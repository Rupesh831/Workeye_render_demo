"""
Work-Eye Desktop Tracker - Unified Version
============================================
✅ Token-based authentication (pre-configured by admin)
✅ Email verification with backend
✅ Smooth backend synchronization
✅ Company-scoped tracking
✅ Detailed error logging
✅ Auto punch-in after verification

NEW TRACKER DOWNLOAD SYSTEM:
============================
1. Admin logs into dashboard and clicks "Download Tracker"
2. Backend generates tracker with embedded company token
3. Member downloads and runs the tracker
4. Member enters their email (must be added by admin first)
5. Tracker verifies email using pre-configured token
6. Tracking starts automatically after verification

Token Flow:
-----------
- Admin signup → Company created with unique tracker_token
- Admin downloads tracker → Token embedded in CONFIG
- Member verifies email → Token sent in X-Tracker-Token header
- All tracking requests → Token authenticates company
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
from datetime import datetime, timedelta
from io import BytesIO
import requests
from threading import Thread, Lock
import logging
from pathlib import Path
import socket
import getpass
import platform
import tkinter as tk
from tkinter import ttk, messagebox

# ============================================================================
# CONFIGURATION
# ============================================================================

CONFIG = {
    'config_dir': os.path.join(os.getenv('APPDATA'), 'WorkEye'),
    'config_file': None,
    'log_file': None,
    
    # Backend configuration
    'backend_url': 'https://backend-35m2.onrender.com',
    'tracker_token': None,
    'device_id': None,
    'company_id': None,
    
    # Intervals
    'screenshot_interval': 300,  # 5 minutes
    'activity_check_interval': 5,
    'upload_interval': 30,  # 30 seconds
    'idle_threshold': 180,  # 3 minutes
    'heartbeat_interval': 60,
    
    # Device info
    'username': None,
    'hostname': None,
    'os_info': None,
    'member_email': None,
    
    # Tracking state
    'is_punched_in': False,
    'capture_screenshots': True,
    'track_browser_history': True,
    'track_window_titles': True,
}

# Create config directory
os.makedirs(CONFIG['config_dir'], exist_ok=True)
CONFIG['log_file'] = os.path.join(CONFIG['config_dir'], 'work_eye.log')
CONFIG['config_file'] = os.path.join(CONFIG['config_dir'], 'config.json')

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(CONFIG['log_file'], encoding='utf-8', errors='replace'),
    ]
)
logger = logging.getLogger(__name__)

console = logging.StreamHandler()
console.setLevel(logging.INFO)
console.setFormatter(logging.Formatter('%(message)s'))
logger.addHandler(console)

# ============================================================================
# CONFIGURATION MANAGEMENT
# ============================================================================

def load_config():
    """Load configuration from config.json"""
    try:
        if os.path.exists(CONFIG['config_file']):
            with open(CONFIG['config_file'], 'r') as f:
                saved_config = json.load(f)
                CONFIG.update(saved_config)
                logger.info("✅ Configuration loaded")
                return True
        else:
            logger.info("ℹ️  No saved configuration found")
            return False
    except Exception as e:
        logger.error(f"❌ Failed to load configuration: {e}")
        return False

def save_config():
    """Save configuration to config.json"""
    try:
        save_data = {
            'backend_url': CONFIG.get('backend_url'),
            'tracker_token': CONFIG.get('tracker_token'),
            'device_id': CONFIG.get('device_id'),
            'company_id': CONFIG.get('company_id'),
            'member_email': CONFIG.get('member_email'),
            'is_punched_in': CONFIG.get('is_punched_in', False),
        }
        with open(CONFIG['config_file'], 'w') as f:
            json.dump(save_data, f, indent=2)
        logger.info("✅ Configuration saved")
    except Exception as e:
        logger.error(f"❌ Failed to save configuration: {e}")

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
        self.mouse_active = False
        self.keyboard_active = False
        self.idle_for = 0.0
        self.current_window = ""
        self.current_process = ""
        self.session_start = datetime.now()
        self.punch_in_time = None
        self.last_activity_time = datetime.now()
        self.last_upload_time = datetime.now()
        self.last_screenshot_time = datetime.now()
        self.windows_opened = []
        self.browser_history = []
        self.latest_screenshot_b64 = None
        self.last_mouse_pos = None
        
        # Device info
        self.device_id = CONFIG.get('device_id') or socket.gethostname()
        self.username = getpass.getuser()
        self.hostname = socket.gethostname()
        self.os_info = f"{platform.system()} {platform.release()} {platform.machine()}"
        
        self.is_tracking = False
    
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
            window_key = f"{process}||{window}"
            if window_key not in self.windows_opened:
                self.windows_opened.append(window_key)
                if len(self.windows_opened) > 50:
                    self.windows_opened = self.windows_opened[-50:]
    
    def get_payload(self, include_screenshot=False):
        with self.lock:
            payload = {
                "device_id": self.device_id,
                "username": self.username,
                "email": CONFIG.get('member_email', ''),
                "hostname": self.hostname,
                "os_info": self.os_info,
                "timestamp": datetime.now().isoformat(),
                "session_start": self.session_start.isoformat(),
                "last_activity": self.last_activity_time.isoformat(),
                "total_seconds": round(self.total_seconds, 2),
                "active_seconds": round(self.active_seconds, 2),
                "idle_seconds": round(self.idle_seconds, 2),
                "locked_seconds": round(self.locked_seconds, 2),
                "idle_for": round(self.idle_for, 2),
                "is_idle": self.is_idle,
                "locked": self.is_locked,
                "mouse_active": self.mouse_active,
                "keyboard_active": self.keyboard_active,
                "current_window": self.current_window,
                "current_process": self.current_process,
                "windows_opened": self.windows_opened[:],
                "browser_history": self.browser_history[:],
            }
            if include_screenshot and self.latest_screenshot_b64:
                payload["screenshot"] = self.latest_screenshot_b64
            return payload
    
    def reset_for_upload(self):
        with self.lock:
            self.latest_screenshot_b64 = None
    
    def reset_session(self):
        """Reset session when punching out"""
        with self.lock:
            self.total_seconds = 0.0
            self.active_seconds = 0.0
            self.idle_seconds = 0.0
            self.locked_seconds = 0.0
            self.session_start = datetime.now()
            self.punch_in_time = None
            self.windows_opened = []
            self.browser_history = []

STATE = GlobalState()
CONFIG['device_id'] = STATE.device_id
CONFIG['username'] = STATE.username
CONFIG['hostname'] = STATE.hostname
CONFIG['os_info'] = STATE.os_info

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def get_idle_time():
    try:
        last_input_info = win32api.GetLastInputInfo()
        current_tick_count = win32api.GetTickCount()
        elapsed_millis = current_tick_count - last_input_info
        return elapsed_millis / 1000.0
    except:
        return 0

def is_screen_locked():
    try:
        hwnd = win32gui.GetForegroundWindow()
        return hwnd == 0
    except:
        return True

def get_active_window_info():
    try:
        hwnd = win32gui.GetForegroundWindow()
        if hwnd == 0:
            return "Desktop", "explorer.exe"
        window_title = win32gui.GetWindowText(hwnd)
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        process = psutil.Process(pid)
        process_name = process.name()
        return window_title, process_name
    except:
        return "Unknown", "unknown.exe"

def capture_screenshot():
    try:
        screenshot = ImageGrab.grab()
        # Resize to max 1280px width
        max_width = 1280
        if screenshot.width > max_width:
            ratio = max_width / screenshot.width
            new_size = (max_width, int(screenshot.height * ratio))
            screenshot = screenshot.resize(new_size, Image.Resampling.LANCZOS)
        
        buffered = BytesIO()
        screenshot.save(buffered, format="JPEG", quality=75)
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        return img_base64
    except Exception as e:
        logger.error(f"[SCREENSHOT] Error: {e}")
        return None

def check_mouse_movement():
    try:
        current_pos = win32api.GetCursorPos()
        if STATE.last_mouse_pos is None:
            STATE.last_mouse_pos = current_pos
            return False
        moved = current_pos != STATE.last_mouse_pos
        STATE.last_mouse_pos = current_pos
        return moved
    except:
        return False

# ============================================================================
# API COMMUNICATION
# ============================================================================

def verify_member(email):
    """
    Verify member email using pre-configured tracker token
    
    NEW: Token is now embedded in the tracker when downloaded by admin
    No longer retrieved from backend - token is pre-configured
    """
    try:
        logger.info(f"[VERIFY] Checking email: {email}")
        
        # Check if token is pre-configured
        if not CONFIG.get('tracker_token'):
            logger.error("[VERIFY] ❌ No tracker token configured")
            return False, None, "Tracker not configured. Please download a new tracker from admin dashboard."
        
        url = f"{CONFIG['backend_url']}/tracker/verify-member"
        payload = {
            "email": email,
            "device_id": STATE.device_id,
            "username": STATE.username,
            "hostname": STATE.hostname,
            "os_info": STATE.os_info
        }
        
        # NEW: Send tracker token in both header and body for authentication
        headers = {
            'Content-Type': 'application/json',
            'X-Tracker-Token': CONFIG['tracker_token']
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        logger.info(f"[VERIFY] Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"[VERIFY] ✅ Response: {data}")
            
            if data.get('success'):
                # Save member email for tracking
                CONFIG['member_email'] = email
                
                logger.info(f"[VERIFY] ✅ Email verified: {email}")
                logger.info(f"[VERIFY] ✅ Using pre-configured token")
                logger.info(f"[VERIFY] ✅ Company ID: {CONFIG.get('company_id', 'embedded')}")
                
                return True, data.get('member'), data.get('message')
            else:
                error_msg = data.get('error', 'Verification failed')
                logger.error(f"[VERIFY] ❌ {error_msg}")
                return False, None, error_msg
        else:
            try:
                error_data = response.json()
                error_msg = error_data.get('error', 'Verification failed')
            except:
                error_msg = response.text
            logger.error(f"[VERIFY] ❌ {error_msg}")
            return False, None, error_msg
    
    except requests.exceptions.Timeout:
        logger.error(f"[VERIFY] ❌ Timeout - Backend not responding")
        return False, None, "Backend timeout - please try again"
    except requests.exceptions.ConnectionError as e:
        logger.error(f"[VERIFY] ❌ Connection failed: {e}")
        return False, None, "Cannot connect to backend - check internet connection"
    except Exception as e:
        logger.error(f"[VERIFY] ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False, None, str(e)

def record_punch_in():
    """Record punch in to backend using tracker token"""
    try:
        if not CONFIG.get('tracker_token'):
            logger.error("[PUNCH-IN] ❌ No tracker token available")
            return False, "Not authenticated"
        
        if not CONFIG.get('member_email'):
            logger.error("[PUNCH-IN] ❌ No member email configured")
            return False, "Member email not configured"
        
        logger.info(f"[PUNCH-IN] Recording for: {CONFIG['member_email']}")
        
        url = f"{CONFIG['backend_url']}/tracker/punch-in"
        headers = {
            'Content-Type': 'application/json',
            'X-Tracker-Token': CONFIG['tracker_token']
        }
        payload = {
            "email": CONFIG['member_email'],  # NEW: Include email
            "device_id": STATE.device_id
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        logger.info(f"[PUNCH-IN] Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"[PUNCH-IN] ✅ Success: {data.get('message')}")
            return True, data.get('message')
        else:
            try:
                error_data = response.json()
                error_msg = error_data.get('error', 'Punch in failed')
            except:
                error_msg = response.text
            logger.error(f"[PUNCH-IN] ❌ Failed: {error_msg}")
            return False, error_msg
    
    except Exception as e:
        logger.error(f"[PUNCH-IN] ❌ Error: {e}")
        return False, str(e)

def record_punch_out():
    """Record punch out to backend using tracker token"""
    try:
        if not CONFIG.get('tracker_token'):
            logger.error("[PUNCH-OUT] ❌ No tracker token available")
            return False, "Not authenticated"
        
        if not CONFIG.get('member_email'):
            logger.error("[PUNCH-OUT] ❌ No member email configured")
            return False, "Member email not configured"
        
        logger.info(f"[PUNCH-OUT] Recording for: {CONFIG['member_email']}")
        
        url = f"{CONFIG['backend_url']}/tracker/punch-out"
        headers = {
            'Content-Type': 'application/json',
            'X-Tracker-Token': CONFIG['tracker_token']
        }
        payload = {
            "email": CONFIG['member_email'],  # NEW: Include email
            "device_id": STATE.device_id
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        logger.info(f"[PUNCH-OUT] Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            duration = data.get('duration_minutes', 0)
            msg = f"Session ended. Duration: {duration:.1f} minutes"
            logger.info(f"[PUNCH-OUT] ✅ {msg}")
            return True, msg
        else:
            try:
                error_data = response.json()
                error_msg = error_data.get('error', 'Punch out failed')
            except:
                error_msg = response.text
            logger.error(f"[PUNCH-OUT] ❌ Failed: {error_msg}")
            return False, error_msg
    
    except Exception as e:
        logger.error(f"[PUNCH-OUT] ❌ Error: {e}")
        return False, str(e)

def upload_activity_data():
    """Upload activity data to backend using tracker token"""
    try:
        if not CONFIG.get('tracker_token'):
            logger.error("[UPLOAD] ❌ No tracker token available")
            return False
        
        # Check if it's time for screenshot
        include_screenshot = False
        time_since_last_screenshot = (datetime.now() - STATE.last_screenshot_time).total_seconds()
        
        if time_since_last_screenshot >= CONFIG['screenshot_interval']:
            if CONFIG['capture_screenshots']:
                screenshot_b64 = capture_screenshot()
                if screenshot_b64:
                    STATE.latest_screenshot_b64 = screenshot_b64
                    include_screenshot = True
            STATE.last_screenshot_time = datetime.now()
        
        payload = STATE.get_payload(include_screenshot=include_screenshot)
        
        url = f"{CONFIG['backend_url']}/tracker/upload"
        headers = {
            'Content-Type': 'application/json',
            'X-Tracker-Token': CONFIG['tracker_token']
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        if response.status_code == 200:
            logger.info(f"[UPLOAD] ✅ Activity uploaded successfully")
            STATE.reset_for_upload()
            return True
        elif response.status_code == 403:
            logger.error(f"[UPLOAD] ❌ 403 FORBIDDEN - Invalid or expired token")
            return False
        elif response.status_code == 503:
            logger.error(f"[UPLOAD] ❌ 503 SERVICE UNAVAILABLE - Backend database error")
            return False
        else:
            try:
                error_data = response.json()
                error_msg = error_data.get('error', response.text)
            except:
                error_msg = response.text
            logger.error(f"[UPLOAD] ❌ {response.status_code}: {error_msg}")
            return False
            
    except requests.exceptions.Timeout:
        logger.error(f"[UPLOAD] ❌ Timeout - Backend not responding")
        return False
    except requests.exceptions.ConnectionError:
        logger.error(f"[UPLOAD] ❌ Connection failed - Backend unreachable")
        return False
    except Exception as e:
        logger.error(f"[UPLOAD] ❌ Error: {e}")
        return False

def send_heartbeat():
    """Send heartbeat to backend"""
    try:
        if not CONFIG.get('tracker_token') or not CONFIG.get('member_email'):
            return False
        
        url = f"{CONFIG['backend_url']}/tracker/heartbeat"
        headers = {
            'Content-Type': 'application/json',
            'X-Tracker-Token': CONFIG['tracker_token']
        }
        payload = {
            "email": CONFIG['member_email'],  # NEW: Include email
            "device_id": STATE.device_id      # NEW: Include device_id
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=5)
        
        if response.status_code == 200:
            logger.debug("[HEARTBEAT] ✅ Sent")
            return True
        else:
            logger.warning(f"[HEARTBEAT] ⚠️ Failed: {response.status_code}")
            return False
    except:
        return False

# ============================================================================
# TRACKING THREADS
# ============================================================================

class ActivityTracker:
    def __init__(self):
        self.running = True
    
    def run(self):
        logger.info("[TRACKER] Activity tracker started")
        last_check = time.time()
        
        while self.running:
            try:
                if not STATE.is_tracking:
                    time.sleep(CONFIG['activity_check_interval'])
                    continue
                
                current_time = time.time()
                elapsed = current_time - last_check
                last_check = current_time
                
                # Get system state
                idle_time = get_idle_time()
                is_locked = is_screen_locked()
                is_idle = idle_time >= CONFIG['idle_threshold']
                mouse_moved = check_mouse_movement()
                
                # Update state
                STATE.is_idle = is_idle
                STATE.is_locked = is_locked
                STATE.mouse_active = mouse_moved
                STATE.idle_for = idle_time
                
                # Get window info if not locked
                if not is_locked:
                    window, process = get_active_window_info()
                    STATE.update_activity(window, process)
                    
                    # Update last activity time if active
                    if not is_idle:
                        STATE.last_activity_time = datetime.now()
                
                # Add time
                is_active = not is_idle and not is_locked
                STATE.add_time(elapsed, is_active, is_idle, is_locked)
                
                time.sleep(CONFIG['activity_check_interval'])
                
            except Exception as e:
                logger.error(f"[TRACKER] Error: {e}")
                time.sleep(CONFIG['activity_check_interval'])
    
    def stop(self):
        self.running = False
        logger.info("[TRACKER] Activity tracker stopped")

class DataUploader:
    def __init__(self):
        self.running = True
    
    def run(self):
        logger.info("[UPLOADER] Data uploader started")
        
        while self.running:
            try:
                if not STATE.is_tracking:
                    time.sleep(CONFIG['upload_interval'])
                    continue
                
                # Upload activity data
                upload_activity_data()
                
                time.sleep(CONFIG['upload_interval'])
                
            except Exception as e:
                logger.error(f"[UPLOADER] Error: {e}")
                time.sleep(CONFIG['upload_interval'])
    
    def stop(self):
        self.running = False
        logger.info("[UPLOADER] Data uploader stopped")

class HeartbeatSender:
    def __init__(self):
        self.running = True
    
    def run(self):
        logger.info("[HEARTBEAT] Heartbeat sender started")
        
        while self.running:
            try:
                if not STATE.is_tracking:
                    time.sleep(CONFIG['heartbeat_interval'])
                    continue
                
                send_heartbeat()
                
                time.sleep(CONFIG['heartbeat_interval'])
                
            except Exception as e:
                logger.error(f"[HEARTBEAT] Error: {e}")
                time.sleep(CONFIG['heartbeat_interval'])
    
    def stop(self):
        self.running = False
        logger.info("[HEARTBEAT] Heartbeat sender stopped")

# ============================================================================
# UI
# ============================================================================

class WorkEyeUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Work-Eye Tracker")
        self.root.geometry("500x400")
        self.root.resizable(False, False)
        
        # Configure style
        style = ttk.Style()
        style.theme_use('clam')
        
        style.configure('TFrame', background='#f5f5f5')
        style.configure('TLabel', background='#f5f5f5', font=('Segoe UI', 10))
        style.configure('Title.TLabel', font=('Segoe UI', 18, 'bold'), foreground='#2c3e50')
        style.configure('Status.TLabel', font=('Segoe UI', 12, 'bold'), foreground='#27ae60')
        style.configure('Timer.TLabel', font=('Segoe UI', 28, 'bold'), foreground='#3498db')
        style.configure('Info.TLabel', font=('Segoe UI', 9), foreground='#7f8c8d')
        
        self.setup_ui()
        self.update_timer()
        
        # Load saved config
        load_config()
        if CONFIG.get('member_email'):
            self.email_entry.insert(0, CONFIG['member_email'])
        
        # Initialize tracking threads
        self.activity_tracker = None
        self.data_uploader = None
        self.heartbeat_sender = None
        
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
    
    def setup_ui(self):
        main_frame = ttk.Frame(self.root, padding="30")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = ttk.Label(
            main_frame, 
            text="Work-Eye Tracker", 
            style='Title.TLabel'
        )
        title_label.pack(pady=(0, 10))
        
        # Device info
        device_label = ttk.Label(
            main_frame,
            text=f"Device: {STATE.hostname}",
            style='Info.TLabel'
        )
        device_label.pack(pady=(0, 20))
        
        # Email input frame
        email_frame = ttk.Frame(main_frame)
        email_frame.pack(fill=tk.X, pady=(0, 20))
        
        email_label = ttk.Label(email_frame, text="Email Address:", font=('Segoe UI', 10, 'bold'))
        email_label.pack(anchor=tk.W, pady=(0, 5))
        
        self.email_entry = ttk.Entry(
            email_frame,
            font=('Segoe UI', 11),
            width=45
        )
        self.email_entry.pack(fill=tk.X)
        
        # Status
        self.status_label = ttk.Label(
            main_frame,
            text="Status: Not Tracking",
            style='Status.TLabel'
        )
        self.status_label.pack(pady=(10, 0))
        
        # Timer
        self.timer_label = ttk.Label(
            main_frame,
            text="00:00:00",
            style='Timer.TLabel'
        )
        self.timer_label.pack(pady=(15, 20))
        
        # Punch Out button (initially hidden)
        self.punch_out_btn = ttk.Button(
            main_frame,
            text="⏹ Punch Out",
            command=self.punch_out,
            width=20
        )
        self.punch_out_btn.pack(pady=(0, 15))
        self.punch_out_btn.pack_forget()  # Hide initially
        
        # Verify button (initially visible)
        self.verify_btn = ttk.Button(
            main_frame,
            text="▶ Start Tracking",
            command=self.verify_and_start,
            width=20
        )
        self.verify_btn.pack(pady=(0, 15))
        
        # Info label
        self.info_label = ttk.Label(
            main_frame,
            text="Enter your email to start tracking",
            style='Info.TLabel',
            wraplength=400
        )
        self.info_label.pack()
    
    def verify_and_start(self):
        """Verify email and start tracking automatically"""
        email = self.email_entry.get().strip()
        
        if not email:
            messagebox.showerror("Error", "Please enter your email address")
            return
        
        # Disable button and show progress
        self.verify_btn.config(state=tk.DISABLED)
        self.email_entry.config(state=tk.DISABLED)
        self.info_label.config(text="Verifying email with backend...")
        self.root.update()
        
        # Verify member with backend
        verified, member, message = verify_member(email)
        
        if not verified:
            self.info_label.config(text="")
            self.verify_btn.config(state=tk.NORMAL)
            self.email_entry.config(state=tk.NORMAL)
            messagebox.showerror(
                "Verification Failed",
                f"Could not verify email:\n\n{message}\n\nPlease check:\n" +
                "• Email is registered in your company\n" +
                "• Email spelling is correct\n" +
                "• Backend is accessible"
            )
            return
        
        # Save configuration
        save_config()
        
        # Record punch in
        self.info_label.config(text="Recording punch in...")
        self.root.update()
        
        success, msg = record_punch_in()
        
        if not success:
            self.info_label.config(text="")
            self.verify_btn.config(state=tk.NORMAL)
            self.email_entry.config(state=tk.DISABLED)
            messagebox.showerror("Punch In Failed", f"Failed to record punch in:\n\n{msg}")
            return
        
        # Start tracking
        member_name = member.get('full_name', member.get('name', 'User'))
        self.status_label.config(text=f"Status: Tracking - {member_name}")
        self.info_label.config(text=f"✅ Tracking started successfully for {email}")
        
        # Hide verify button, show punch out button
        self.verify_btn.pack_forget()
        self.punch_out_btn.pack(pady=(0, 15))
        
        # Start tracking
        STATE.is_tracking = True
        STATE.punch_in_time = datetime.now()
        STATE.session_start = datetime.now()
        
        self.start_tracking_threads()
        
        logger.info(f"✅ Tracking started for: {email}")
        logger.info(f"✅ Member: {member_name}")
        logger.info(f"✅ Company ID: {CONFIG.get('company_id')}")
    
    def punch_out(self):
        """Stop tracking and record punch out"""
        response = messagebox.askyesno(
            "Confirm Punch Out",
            "Are you sure you want to stop tracking and punch out?"
        )
        if not response:
            return
        
        # Stop tracking
        STATE.is_tracking = False
        self.stop_tracking_threads()
        
        # Record punch out
        self.info_label.config(text="Recording punch out...")
        self.root.update()
        
        success, msg = record_punch_out()
        
        # Update UI
        self.status_label.config(text="Status: Not Tracking")
        self.email_entry.config(state=tk.NORMAL)
        self.timer_label.config(text="00:00:00")
        
        # Show verify button, hide punch out button
        self.punch_out_btn.pack_forget()
        self.verify_btn.pack(pady=(0, 15))
        self.verify_btn.config(state=tk.NORMAL)
        
        if success:
            self.info_label.config(text=f"✅ {msg}")
            messagebox.showinfo("Punch Out", msg)
        else:
            self.info_label.config(text="⚠️ Punch out recorded locally")
            messagebox.showwarning("Punch Out", f"Tracking stopped.\n\n{msg}")
        
        # Reset session
        STATE.reset_session()
        
        logger.info(f"🛑 Tracking stopped for: {CONFIG.get('member_email')}")
    
    def update_timer(self):
        """Update timer display"""
        if STATE.is_tracking and STATE.punch_in_time:
            elapsed = datetime.now() - STATE.punch_in_time
            hours, remainder = divmod(int(elapsed.total_seconds()), 3600)
            minutes, seconds = divmod(remainder, 60)
            self.timer_label.config(text=f"{hours:02d}:{minutes:02d}:{seconds:02d}")
        
        self.root.after(1000, self.update_timer)
    
    def start_tracking_threads(self):
        """Start all tracking threads"""
        self.activity_tracker = ActivityTracker()
        self.data_uploader = DataUploader()
        self.heartbeat_sender = HeartbeatSender()
        
        Thread(target=self.activity_tracker.run, daemon=True).start()
        Thread(target=self.data_uploader.run, daemon=True).start()
        Thread(target=self.heartbeat_sender.run, daemon=True).start()
        
        logger.info("✅ All tracking threads started")
    
    def stop_tracking_threads(self):
        """Stop all tracking threads"""
        if self.activity_tracker:
            self.activity_tracker.stop()
        if self.data_uploader:
            self.data_uploader.stop()
        if self.heartbeat_sender:
            self.heartbeat_sender.stop()
        
        logger.info("🛑 All tracking threads stopped")
    
    def on_closing(self):
        """Handle window close"""
        if STATE.is_tracking:
            response = messagebox.askyesno(
                "Confirm Exit",
                "Tracking is active. Exiting will stop tracking and punch out.\n\nAre you sure?"
            )
            if not response:
                return
            
            # Punch out before closing
            STATE.is_tracking = False
            self.stop_tracking_threads()
            record_punch_out()
        
        self.root.destroy()
    
    def run(self):
        """Start the UI main loop"""
        self.root.mainloop()

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    try:
        logger.info("=" * 70)
        logger.info("Work-Eye Tracker - Unified Version")
        logger.info("=" * 70)
        logger.info(f"Device ID: {STATE.device_id}")
        logger.info(f"Username: {STATE.username}")
        logger.info(f"Hostname: {STATE.hostname}")
        logger.info(f"OS: {STATE.os_info}")
        logger.info(f"Backend: {CONFIG['backend_url']}")
        logger.info("=" * 70)
        
        # Start UI
        ui = WorkEyeUI()
        ui.run()
        
    except KeyboardInterrupt:
        logger.info("\n\n🛑 Shutting down...")
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
