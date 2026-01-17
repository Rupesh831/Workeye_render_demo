"""
MINIMAL WORK TRACKER - Clean UI Version
========================================
✅ Synced with backend tracker_routes.py
✅ Email verification via /tracker/verify-member
✅ Auto device ID generation and DB storage
✅ Simple UI: Email + PUNCH IN → PUNCH OUT only
"""

import os
import sys
import time
import json
import base64
import psutil
import win32gui
import win32process
import win32api
from PIL import Image, ImageGrab
from datetime import datetime
from io import BytesIO
import requests
from threading import Thread, Lock
import logging
import socket
import getpass
import platform
import tkinter as tk
from tkinter import messagebox
import uuid

# ============================================================================
# CONFIGURATION (Embedded by backend when admin downloads)
# ============================================================================

CONFIG = {
    'config_dir': os.path.join(os.getenv('APPDATA'), 'Tracker'),
    'config_file': None,
    'log_file': None,
    
    # Backend configuration (EMBEDDED BY ADMIN DOWNLOAD)
    'backend_url': 'https://backend-35m2.onrender.com',
    'tracker_token': None,  # Will be replaced by backend
    'company_id': None,     # Will be replaced by backend
    
    # Intervals
    'screenshot_interval': 300,
    'activity_check_interval': 5,
    'upload_interval': 30,
    'idle_threshold': 180,
    'heartbeat_interval': 60,
    
    # Runtime data
    'device_id': None,
    'member_email': None,
}

# Setup directories
os.makedirs(CONFIG['config_dir'], exist_ok=True)
CONFIG['log_file'] = os.path.join(CONFIG['config_dir'], 'tracker.log')
CONFIG['config_file'] = os.path.join(CONFIG['config_dir'], 'config.json')

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    handlers=[
        logging.FileHandler(CONFIG['log_file'], encoding='utf-8'),
    ]
)
logger = logging.getLogger(__name__)

# ============================================================================
# GLOBAL STATE
# ============================================================================

class GlobalState:
    def __init__(self):
        self.lock = Lock()
        self.total_seconds = 0.0
        self.active_seconds = 0.0
        self.idle_seconds = 0.0
        self.locked_seconds = 0.0
        self.is_idle = False
        self.is_locked = False
        self.idle_for = 0.0
        self.current_window = ""
        self.current_process = ""
        self.session_start = datetime.now()
        self.punch_in_time = None
        self.last_activity_time = datetime.now()
        self.last_screenshot_time = datetime.now()
        self.windows_opened = []
        self.latest_screenshot_b64 = None
        self.last_mouse_pos = None
        
        # Auto-generate device ID (persistent)
        self.device_id = self._get_or_create_device_id()
        self.username = getpass.getuser()
        self.hostname = socket.gethostname()
        self.os_info = f"{platform.system()} {platform.release()}"
        
        self.is_tracking = False
    
    def _get_or_create_device_id(self):
        """Get or create persistent device ID"""
        try:
            config_file = os.path.join(os.getenv('APPDATA'), 'Tracker', 'device.json')
            if os.path.exists(config_file):
                with open(config_file, 'r') as f:
                    data = json.load(f)
                    if data.get('device_id'):
                        return data['device_id']
        except:
            pass
        
        # Generate new device ID
        device_id = str(uuid.uuid4())[:8]
        
        # Save it
        try:
            os.makedirs(os.path.dirname(config_file), exist_ok=True)
            with open(config_file, 'w') as f:
                json.dump({'device_id': device_id}, f)
        except:
            pass
        
        return device_id
    
    def add_time(self, seconds, is_active, is_idle, is_locked):
        with self.lock:
            self.total_seconds += seconds
            if is_locked:
                self.locked_seconds += seconds
            elif is_idle:
                self.idle_seconds += seconds
            elif is_active:
                self.active_seconds += seconds
    
    def update_activity(self, window, process):
        with self.lock:
            self.current_window = window
            self.current_process = process
            entry = f"{process}||{window}"
            if entry not in self.windows_opened:
                self.windows_opened.append(entry)
                if len(self.windows_opened) > 50:
                    self.windows_opened = self.windows_opened[-50:]
    
    def get_payload(self, include_screenshot=False):
        """Get payload matching backend tracker_routes.py format"""
        with self.lock:
            payload = {
                # Match backend field names exactly
                "deviceid": self.device_id,  # Backend uses 'deviceid'
                "username": self.username,
                "email": CONFIG.get('member_email', ''),
                "hostname": self.hostname,
                "osinfo": self.os_info,  # Backend uses 'osinfo'
                "timestamp": datetime.now().isoformat(),
                "sessionstart": self.session_start.isoformat(),  # Backend uses 'sessionstart'
                "lastactivity": self.last_activity_time.isoformat(),  # Backend uses 'lastactivity'
                "totalseconds": round(self.total_seconds, 2),
                "activeseconds": round(self.active_seconds, 2),
                "idleseconds": round(self.idle_seconds, 2),
                "lockedseconds": round(self.locked_seconds, 2),
                "idlefor": round(self.idle_for, 2),
                "isidle": self.is_idle,
                "locked": self.is_locked,
                "mouseactive": False,
                "keyboardactive": False,
                "currentwindow": self.current_window,
                "currentprocess": self.current_process,
                "windowsopened": self.windows_opened[:],
                "browserhistory": [],
            }
            if include_screenshot and self.latest_screenshot_b64:
                payload["screenshot"] = self.latest_screenshot_b64
            return payload
    
    def reset_for_upload(self):
        with self.lock:
            self.latest_screenshot_b64 = None
    
    def reset_session(self):
        with self.lock:
            self.total_seconds = 0.0
            self.active_seconds = 0.0
            self.idle_seconds = 0.0
            self.locked_seconds = 0.0
            self.session_start = datetime.now()
            self.windows_opened = []

STATE = GlobalState()
CONFIG['device_id'] = STATE.device_id

# ============================================================================
# UTILITIES
# ============================================================================

def get_idle_time():
    try:
        last_input = win32api.GetLastInputInfo()
        current_tick = win32api.GetTickCount()
        return (current_tick - last_input) / 1000.0
    except:
        return 0

def is_screen_locked():
    try:
        return win32gui.GetForegroundWindow() == 0
    except:
        return True

def get_active_window_info():
    try:
        hwnd = win32gui.GetForegroundWindow()
        if hwnd == 0:
            return "Desktop", "explorer.exe"
        title = win32gui.GetWindowText(hwnd)
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        process = psutil.Process(pid)
        return title, process.name()
    except:
        return "Unknown", "unknown.exe"

def capture_screenshot():
    try:
        img = ImageGrab.grab()
        if img.width > 1280:
            ratio = 1280 / img.width
            img = img.resize((1280, int(img.height * ratio)), Image.Resampling.LANCZOS)
        buf = BytesIO()
        img.save(buf, format="JPEG", quality=75)
        return base64.b64encode(buf.getvalue()).decode()
    except:
        return None

def check_mouse_movement():
    try:
        pos = win32api.GetCursorPos()
        if STATE.last_mouse_pos is None:
            STATE.last_mouse_pos = pos
            return False
        moved = pos != STATE.last_mouse_pos
        STATE.last_mouse_pos = pos
        return moved
    except:
        return False

# ============================================================================
# API CALLS - SYNCED WITH BACKEND tracker_routes.py
# ============================================================================

def verify_member(email):
    """
    Verify member email with backend
    Synced with: /tracker/verify-member endpoint in tracker_routes.py
    
    Backend flow:
    1. Validates tracker token (X-Tracker-Token header)
    2. Extracts company_id from token
    3. Queries members table: SELECT * FROM members WHERE company_id=X AND email=Y
    4. Registers device in devices table
    5. Returns member info
    """
    try:
        logger.info(f"[VERIFY] Email: {email}")
        
        if not CONFIG.get('tracker_token'):
            logger.error("[VERIFY] No tracker token configured")
            return False, None, "Token not configured. Please download tracker from admin dashboard."
        
        url = f"{CONFIG['backend_url']}/tracker/verify-member"
        
        # Backend expects these exact field names (see tracker_routes.py line ~180)
        payload = {
            "email": email.lower().strip(),
            "deviceid": STATE.device_id,      # Backend: data.get('deviceid')
            "hostname": STATE.hostname,       # Backend: data.get('hostname')
            "osinfo": STATE.os_info           # Backend: data.get('osinfo')
        }
        
        headers = {
            'Content-Type': 'application/json',
            'X-Tracker-Token': CONFIG['tracker_token']  # Backend validates this
        }
        
        logger.info(f"[VERIFY] Sending to: {url}")
        logger.info(f"[VERIFY] Device ID: {STATE.device_id}")
        
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        logger.info(f"[VERIFY] Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"[VERIFY] Response data: {data}")
            
            if data.get('success'):
                CONFIG['member_email'] = email.lower().strip()
                member = data.get('member', {})
                logger.info(f"[VERIFY] ✅ Verified: {member.get('name', 'Unknown')}")
                logger.info(f"[VERIFY] ✅ Member ID: {member.get('id')}")
                logger.info(f"[VERIFY] ✅ Device registered in DB")
                return True, member, "Verification successful"
            else:
                error = data.get('error', 'Verification failed')
                logger.error(f"[VERIFY] ❌ {error}")
                return False, None, error
        else:
            try:
                error_data = response.json()
                error = error_data.get('error', 'Server error')
                logger.error(f"[VERIFY] ❌ HTTP {response.status_code}: {error}")
                return False, None, error
            except:
                logger.error(f"[VERIFY] ❌ HTTP {response.status_code}")
                return False, None, f"Server error: {response.status_code}"
                
    except requests.exceptions.Timeout:
        logger.error("[VERIFY] ❌ Timeout")
        return False, None, "Backend timeout. Please check internet connection."
    except requests.exceptions.ConnectionError:
        logger.error("[VERIFY] ❌ Connection failed")
        return False, None, "Cannot connect to backend. Check internet."
    except Exception as e:
        logger.error(f"[VERIFY] ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False, None, str(e)

def punch_in():
    """
    Record punch in
    Synced with: /tracker/punch-in endpoint in tracker_routes.py
    
    Backend flow:
    1. Validates tracker token
    2. Gets member by email + company_id
    3. Gets device by deviceid
    4. Inserts into punchlogs table
    5. Updates member status to 'active'
    """
    try:
        if not CONFIG.get('member_email') or not CONFIG.get('tracker_token'):
            return False, "Not configured"
        
        logger.info(f"[PUNCH-IN] Email: {CONFIG['member_email']}")
        
        url = f"{CONFIG['backend_url']}/tracker/punch-in"
        
        # Backend expects these exact fields (see tracker_routes.py line ~280)
        payload = {
            "email": CONFIG['member_email'],
            "deviceid": STATE.device_id  # Backend: data.get('deviceid')
        }
        
        headers = {
            'Content-Type': 'application/json',
            'X-Tracker-Token': CONFIG['tracker_token']
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        logger.info(f"[PUNCH-IN] Response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"[PUNCH-IN] ✅ {data.get('message')}")
            logger.info(f"[PUNCH-IN] ✅ Punch log ID: {data.get('punchlogid')}")
            return True, data.get('message', 'Punched in successfully')
        else:
            try:
                error = response.json().get('error', 'Punch in failed')
                logger.error(f"[PUNCH-IN] ❌ {error}")
                return False, error
            except:
                return False, f"HTTP {response.status_code}"
                
    except Exception as e:
        logger.error(f"[PUNCH-IN] ❌ {e}")
        return False, str(e)

def punch_out():
    """
    Record punch out
    Synced with: /tracker/punch-out endpoint in tracker_routes.py
    
    Backend flow:
    1. Validates tracker token
    2. Gets member by email + company_id
    3. Finds active punch log
    4. Updates punch log with punch_out_time and duration
    5. Updates member status to 'offline'
    """
    try:
        if not CONFIG.get('member_email') or not CONFIG.get('tracker_token'):
            return False, "Not configured"
        
        logger.info(f"[PUNCH-OUT] Email: {CONFIG['member_email']}")
        
        url = f"{CONFIG['backend_url']}/tracker/punch-out"
        
        # Backend expects these exact fields (see tracker_routes.py line ~340)
        payload = {
            "email": CONFIG['member_email'],
            "deviceid": STATE.device_id
        }
        
        headers = {
            'Content-Type': 'application/json',
            'X-Tracker-Token': CONFIG['tracker_token']
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        logger.info(f"[PUNCH-OUT] Response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"[PUNCH-OUT] ✅ {data.get('message')}")
            logger.info(f"[PUNCH-OUT] ✅ Duration: {data.get('workdurationseconds', 0)}s")
            return True, data.get('message', 'Punched out successfully')
        else:
            try:
                error = response.json().get('error', 'Punch out failed')
                logger.error(f"[PUNCH-OUT] ❌ {error}")
                return False, error
            except:
                return False, f"HTTP {response.status_code}"
                
    except Exception as e:
        logger.error(f"[PUNCH-OUT] ❌ {e}")
        return False, str(e)

def upload_data():
    """
    Upload tracking data
    Synced with: /tracker/upload endpoint in tracker_routes.py
    
    Backend flow:
    1. Validates tracker token
    2. Gets member and device
    3. Inserts into rawtrackerdata table
    4. Processes and inserts screenshot
    5. Processes activity logs
    6. Updates member and device status
    """
    try:
        if not CONFIG.get('member_email') or not CONFIG.get('tracker_token'):
            return False
        
        # Screenshot timing
        if (datetime.now() - STATE.last_screenshot_time).total_seconds() >= CONFIG['screenshot_interval']:
            screenshot = capture_screenshot()
            if screenshot:
                STATE.latest_screenshot_b64 = screenshot
            STATE.last_screenshot_time = datetime.now()
        
        # Get payload with exact backend field names
        payload = STATE.get_payload(include_screenshot=STATE.latest_screenshot_b64 is not None)
        
        url = f"{CONFIG['backend_url']}/tracker/upload"
        headers = {
            'Content-Type': 'application/json',
            'X-Tracker-Token': CONFIG['tracker_token']
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        if response.status_code == 200:
            logger.info("[UPLOAD] ✅ Data uploaded")
            STATE.reset_for_upload()
            return True
        else:
            logger.warning(f"[UPLOAD] ⚠️ Failed: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"[UPLOAD] ❌ {e}")
        return False

def heartbeat():
    """
    Send heartbeat
    Synced with: /tracker/heartbeat endpoint in tracker_routes.py
    
    Backend flow:
    1. Validates tracker token
    2. Updates device.last_seen timestamp
    """
    try:
        if not CONFIG.get('member_email') or not CONFIG.get('tracker_token'):
            return False
        
        url = f"{CONFIG['backend_url']}/tracker/heartbeat"
        
        # Backend expects these fields
        payload = {
            "email": CONFIG['member_email'],
            "deviceid": STATE.device_id
        }
        
        headers = {
            'Content-Type': 'application/json',
            'X-Tracker-Token': CONFIG['tracker_token']
        }
        
        requests.post(url, json=payload, headers=headers, timeout=5)
        return True
        
    except:
        return False

def fetch_configuration():
    """
    Fetch configuration settings from backend
    Updates screenshot_interval and idle_threshold based on company settings
    """
    try:
        if not CONFIG.get('tracker_token'):
            logger.info("[CONFIG] No tracker token, using defaults")
            return False
        
        url = f"{CONFIG['backend_url']}/api/configuration?company_id={CONFIG['company_id']}"
        
        headers = {
            'Authorization': f"Bearer {CONFIG['tracker_token']}",
            'Content-Type': 'application/json'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('config'):
                config = data['config']
                
                # Update screenshot interval (convert minutes to seconds)
                screenshot_minutes = config.get('screenshot_interval_minutes', 5)
                CONFIG['screenshot_interval'] = screenshot_minutes * 60
                logger.info(f"[CONFIG] Screenshot interval: {screenshot_minutes} minutes ({CONFIG['screenshot_interval']}s)")
                
                # Update idle timeout (convert minutes to seconds)
                idle_minutes = config.get('idle_timeout_minutes', 3)
                CONFIG['idle_threshold'] = idle_minutes * 60
                logger.info(f"[CONFIG] Idle timeout: {idle_minutes} minutes ({CONFIG['idle_threshold']}s)")
                
                return True
            else:
                logger.warning("[CONFIG] No config data in response")
                return False
        else:
            logger.warning(f"[CONFIG] Failed to fetch: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"[CONFIG] Error: {e}")
        return False

# ============================================================================
# TRACKING THREADS
# ============================================================================

class ActivityTracker(Thread):
    def __init__(self):
        super().__init__(daemon=True)
        self.running = True
        self.last_check = time.time()
    
    def run(self):
        while self.running:
            if not STATE.is_tracking:
                time.sleep(CONFIG['activity_check_interval'])
                continue
            
            current = time.time()
            elapsed = current - self.last_check
            self.last_check = current
            
            idle_time = get_idle_time()
            locked = is_screen_locked()
            idle = idle_time >= CONFIG['idle_threshold']
            
            STATE.is_idle = idle
            STATE.is_locked = locked
            STATE.idle_for = idle_time
            
            if not locked:
                window, process = get_active_window_info()
                STATE.update_activity(window, process)
                if not idle:
                    STATE.last_activity_time = datetime.now()
            
            check_mouse_movement()
            
            active = not idle and not locked
            STATE.add_time(elapsed, active, idle, locked)
            
            time.sleep(CONFIG['activity_check_interval'])

class DataUploader(Thread):
    def __init__(self):
        super().__init__(daemon=True)
        self.running = True
    
    def run(self):
        while self.running:
            if STATE.is_tracking:
                upload_data()
            time.sleep(CONFIG['upload_interval'])

class HeartbeatSender(Thread):
    def __init__(self):
        super().__init__(daemon=True)
        self.running = True
    
    def run(self):
        while self.running:
            if STATE.is_tracking:
                heartbeat()
            time.sleep(CONFIG['heartbeat_interval'])

class ConfigurationFetcher(Thread):
    """Periodically fetch configuration from backend to update intervals"""
    def __init__(self):
        super().__init__(daemon=True)
        self.running = True
    
    def run(self):
        # Fetch configuration immediately on start
        if STATE.is_tracking:
            fetch_configuration()
        
        # Then fetch every 5 minutes
        while self.running:
            time.sleep(300)  # 5 minutes
            if STATE.is_tracking:
                fetch_configuration()

class ScreenshotCapture(Thread):
    """Capture screenshots at intervals defined in configuration"""
    def __init__(self):
        super().__init__(daemon=True)
        self.running = True
    
    def run(self):
        while self.running:
            if not STATE.is_tracking:
                time.sleep(5)
                continue
            
            try:
                # Capture screenshot
                screenshot_b64 = capture_screenshot()
                if screenshot_b64:
                    STATE.latest_screenshot_b64 = screenshot_b64
                    STATE.last_screenshot_time = datetime.now()
                    logger.info(f"[SCREENSHOT] Captured at {datetime.now().strftime('%H:%M:%S')}")
            except Exception as e:
                logger.error(f"[SCREENSHOT] Error: {e}")
            
            # Wait for the configured interval (dynamically updated)
            time.sleep(CONFIG['screenshot_interval'])

# ============================================================================
# MINIMAL UI
# ============================================================================

class MinimalUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Enter Email")
        self.root.geometry("400x250")
        self.root.resizable(False, False)
        self.root.configure(bg='#f8fafc')
        
        self.email_var = tk.StringVar()
        
        self.activity_thread = None
        self.upload_thread = None
        self.heartbeat_thread = None
        self.config_thread = None
        self.screenshot_thread = None
        
        self.setup_ui()
        self.load_saved_email()
    
    def setup_ui(self):
        self.main_frame = tk.Frame(self.root, bg='#f8fafc')
        self.main_frame.pack(fill=tk.BOTH, expand=True, padx=30, pady=30)
        
        # === PUNCH IN VIEW ===
        self.punch_in_frame = tk.Frame(self.main_frame, bg='#f8fafc')
        self.punch_in_frame.pack(fill=tk.BOTH, expand=True)
        
        self.title_label = tk.Label(
            self.punch_in_frame,
            text="Enter your email to Punch IN",
            font=('Arial', 16, 'bold'),
            bg='#f8fafc',
            fg='#1e293b'
        )
        self.title_label.pack(pady=(0, 30))
        
        tk.Label(
            self.punch_in_frame,
            text="Email:",
            font=('Arial', 12),
            bg='#f8fafc',
            fg='#475569'
        ).pack(anchor='w')
        
        self.email_entry = tk.Entry(
            self.punch_in_frame,
            textvariable=self.email_var,
            font=('Arial', 12),
            width=30,
            relief='solid',
            bd=1
        )
        self.email_entry.pack(pady=5, fill='x')
        self.email_entry.focus()
        
        self.punch_in_btn = tk.Button(
            self.punch_in_frame,
            text="PUNCH IN",
            font=('Arial', 18, 'bold'),
            bg='#059669',
            fg='white',
            relief='flat',
            height=2,
            command=self.handle_punch_in,
            cursor='hand2'
        )
        self.punch_in_btn.pack(pady=30, fill='x')
        
        # === PUNCH OUT VIEW ===
        self.punch_out_frame = tk.Frame(self.main_frame, bg='#f8fafc')
        
        self.tracking_label = tk.Label(
            self.punch_out_frame,
            text="",
            font=('Arial', 16, 'bold'),
            bg='#f8fafc',
            fg='#059669'
        )
        self.tracking_label.pack(pady=(20, 50))
        
        self.punch_out_btn = tk.Button(
            self.punch_out_frame,
            text="PUNCH OUT",
            font=('Arial', 18, 'bold'),
            bg='#dc2626',
            fg='white',
            relief='flat',
            height=3,
            command=self.handle_punch_out,
            cursor='hand2'
        )
        self.punch_out_btn.pack(pady=20, fill='both', expand=True, padx=20)
        
        self.root.bind('<Return>', lambda e: self.handle_punch_in() if not STATE.is_tracking else None)
    
    def load_saved_email(self):
        try:
            if os.path.exists(CONFIG['config_file']):
                with open(CONFIG['config_file'], 'r') as f:
                    data = json.load(f)
                    if data.get('member_email'):
                        self.email_var.set(data['member_email'])
        except:
            pass
    
    def save_email(self):
        try:
            data = {
                'member_email': CONFIG.get('member_email'),
                'device_id': STATE.device_id,
            }
            with open(CONFIG['config_file'], 'w') as f:
                json.dump(data, f)
        except:
            pass
    
    def show_punch_in_view(self):
        self.punch_out_frame.pack_forget()
        self.punch_in_frame.pack(fill=tk.BOTH, expand=True)
        self.root.title("Enter Email")
    
    def show_punch_out_view(self):
        self.punch_in_frame.pack_forget()
        self.punch_out_frame.pack(fill=tk.BOTH, expand=True)
        
        email = CONFIG.get('member_email', '')
        self.root.title(email)
        self.tracking_label.config(text=f"Tracking: {email}")
    
    def handle_punch_in(self):
        email = self.email_var.get().strip().lower()
        if not email or '@' not in email:
            messagebox.showerror("Error", "Please enter valid email")
            return
        
        self.email_entry.config(state='disabled')
        self.punch_in_btn.config(state='disabled', text="Verifying...")
        self.root.update()
        
        try:
            # Step 1: Verify email with backend DB
            verified, member, msg = verify_member(email)
            if not verified:
                self.email_entry.config(state='normal')
                self.punch_in_btn.config(state='normal', text="PUNCH IN")
                messagebox.showerror("Verification Failed", 
                    f"{msg}\n\nPlease ensure:\n" +
                    "• You are registered by your admin\n" +
                    "• Email is correct\n" +
                    "• Internet connection is active")
                return
            
            # Step 2: Punch IN
            success, msg2 = punch_in()
            if not success:
                self.email_entry.config(state='normal')
                self.punch_in_btn.config(state='normal', text="PUNCH IN")
                messagebox.showerror("Punch IN Failed", msg2)
                return
            
            # Success!
            CONFIG['member_email'] = email
            self.save_email()
            
            member_name = member.get('name', member.get('fullname', 'Member'))
            messagebox.showinfo("Success", 
                f"✅ Punched IN!\n\n" +
                f"Name: {member_name}\n" +
                f"Email: {email}\n" +
                f"Device: {STATE.device_id}\n\n" +
                f"Tracking started.")
            
            self.start_tracking()
            self.show_punch_out_view()
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed: {str(e)}")
            self.email_entry.config(state='normal')
            self.punch_in_btn.config(state='normal', text="PUNCH IN")
    
    def handle_punch_out(self):
        response = messagebox.askyesno(
            "Confirm Punch Out",
            "Stop tracking and punch out?"
        )
        if not response:
            return
        
        STATE.is_tracking = False
        if self.activity_thread:
            self.activity_thread.running = False
        if self.upload_thread:
            self.upload_thread.running = False
        if self.heartbeat_thread:
            self.heartbeat_thread.running = False
        
        success, msg = punch_out()
        
        if success:
            messagebox.showinfo("Punched Out", msg)
        else:
            messagebox.showwarning("Punched Out", f"Tracking stopped.\n{msg}")
        
        STATE.reset_session()
        
        self.email_entry.config(state='normal')
        self.punch_in_btn.config(state='normal', text="PUNCH IN")
        self.show_punch_in_view()
        
        logger.info("🛑 Tracking stopped")
    
    def start_tracking(self):
        STATE.is_tracking = True
        STATE.punch_in_time = datetime.now()
        STATE.session_start = datetime.now()
        
        # Fetch configuration before starting threads
        fetch_configuration()
        
        self.activity_thread = ActivityTracker()
        self.upload_thread = DataUploader()
        self.heartbeat_thread = HeartbeatSender()
        self.config_thread = ConfigurationFetcher()
        self.screenshot_thread = ScreenshotCapture()
        
        self.activity_thread.start()
        self.upload_thread.start()
        self.heartbeat_thread.start()
        self.config_thread.start()
        self.screenshot_thread.start()
        
        logger.info(f"✅ Tracking: {CONFIG['member_email']} (Device: {STATE.device_id})")
        logger.info(f"✅ Screenshot interval: {CONFIG['screenshot_interval']}s")
        logger.info(f"✅ Idle threshold: {CONFIG['idle_threshold']}s")
    
    def on_closing(self):
        if STATE.is_tracking:
            response = messagebox.askyesno(
                "Confirm Exit",
                "Tracking is active. Exit will punch you out.\n\nContinue?"
            )
            if not response:
                return
            
            STATE.is_tracking = False
            punch_out()
        
        self.root.destroy()
    
    def run(self):
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        self.root.mainloop()

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    logger.info("="*70)
    logger.info("WORK TRACKER - Synced with Backend DB")
    logger.info("="*70)
    logger.info(f"Device ID: {STATE.device_id} (Auto-generated)")
    logger.info(f"Hostname: {STATE.hostname}")
    logger.info(f"Backend: {CONFIG['backend_url']}")
    logger.info("="*70)
    
    try:
        ui = MinimalUI()
        ui.run()
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    except Exception as e:
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()
