"""
TRACKER ROUTES - WITH COMPREHENSIVE DEBUGGING
==============================================
Handles all tracker endpoints with detailed logging
"""

from flask import Blueprint, request, jsonify, send_file, after_this_request
from db import get_db
from datetime import datetime
import base64
import json
from PIL import Image
from io import BytesIO
import os
import tempfile
from functools import wraps

tracker_bp = Blueprint('tracker', __name__)


def verify_tracker_token(token: str):
    """Verify tracker token and extract company_id"""
    try:
        if not token or not isinstance(token, str):
            print(f"❌ Token is None or not string")
            return None
        
        decoded = base64.b64decode(token.encode()).decode()
        parts = decoded.split(':', 1)
        
        if len(parts) >= 1:
            company_id = int(parts[0])
            print(f"✅ Token decoded: company_id={company_id}")
            return company_id
        
        return None
    except Exception as e:
        print(f"❌ Token verification error: {e}")
        return None


def require_tracker_token(f):
    """Decorator: Require tracker token authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get token from header
        tracker_token = request.headers.get('X-Tracker-Token')
        
        if not tracker_token:
            # Try to get from body
            try:
                data = request.get_json(silent=True) or {}
                tracker_token = data.get('tracker_token')
            except:
                pass
        
        if not tracker_token:
            print("❌ No tracker token provided in request")
            return jsonify({"error": "Tracker token required"}), 401
        
        # Verify token and get company_id
        company_id = verify_tracker_token(tracker_token)
        
        if not company_id:
            print(f"❌ Invalid tracker token format")
            return jsonify({"error": "Invalid tracker token"}), 401
        
        try:
            with get_db() as conn:
                cur = conn.cursor()
                
                # Check what columns exist in companies table
                cur.execute("""
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_name = 'companies'
                """)
                company_cols = [row['column_name'] for row in cur.fetchall()]
                print(f"✅ Companies table columns: {company_cols}")
                
                # Build query based on available columns
                select_cols = ['id']
                
                # Detect name column
                if 'company_name' in company_cols:
                    select_cols.append('company_name as name')
                elif 'name' in company_cols:
                    select_cols.append('name')
                elif 'companyname' in company_cols:
                    select_cols.append('companyname as name')
                
                # Add tracker_token if exists
                if 'tracker_token' in company_cols:
                    select_cols.append('tracker_token')
                
                # FIXED: Detect is_active column properly
                if 'is_active' in company_cols:
                    isactive_col = 'is_active'
                elif 'isactive' in company_cols:
                    isactive_col = 'isactive'
                else:
                    isactive_col = 'is_active'  # Default fallback
                
                # Build and execute query with detected column name
                query = f"SELECT {', '.join(select_cols)} FROM companies WHERE id = %s AND {isactive_col} = TRUE"
                print(f"🔍 Token verification query: {query}")
                
                cur.execute(query, (company_id,))
                company = cur.fetchone()
                
                if not company:
                    print(f"❌ Company {company_id} not found or inactive")
                    return jsonify({"error": "Invalid or inactive company"}), 401
                
                # Optionally verify tracker_token matches if column exists
                if 'tracker_token' in company_cols and company.get('tracker_token'):
                    if company['tracker_token'] != tracker_token:
                        print(f"❌ Tracker token mismatch for company {company_id}")
                        return jsonify({"error": "Invalid tracker token"}), 401
                
                company_name = company.get('name', 'Unknown')
                print(f"✅ Token verified for company {company_id}: {company_name}")
                
        except Exception as e:
            print(f"❌ Database error during token verification: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": "Authentication failed"}), 500
        
        # Store company_id in request for use in endpoint
        request.tracker_company_id = company_id
        request.tracker_token = tracker_token
        
        return f(*args, **kwargs)
    
    return decorated_function



# ============================================================================
# TRACKER DOWNLOAD
# ============================================================================

@tracker_bp.route('/api/tracker/download', methods=['GET'])
def download_tracker():
    """Download tracker with embedded company token"""
    try:
        # Get JWT token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authentication required. Please log in."}), 401
        
        jwt_token = auth_header.replace('Bearer ', '').strip()
        
        # Verify admin JWT
        from admin_auth_routes import verify_admin_jwt
        
        try:
            payload = verify_admin_jwt(jwt_token)
            admin_id = payload['admin_id']
            company_id = payload['company_id']
            admin_email = payload['email']
        except Exception as e:
            print(f"❌ JWT verification failed: {e}")
            return jsonify({"error": f"Authentication failed: {str(e)}"}), 401
        
        print(f"✅ Tracker download request from admin: {admin_email}, company: {company_id}")
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Check companies table columns
            cur.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'companies'
            """)
            company_cols = [row['column_name'] for row in cur.fetchall()]
            print(f"📋 Companies table columns: {company_cols}")
            
            # FIXED: Properly detect column names with underscores
            # Check for company_name (with underscore), companyname (without), or name
            if 'company_name' in company_cols:
                name_col = 'company_name'
            elif 'companyname' in company_cols:
                name_col = 'companyname'
            else:
                name_col = 'name'
            
            print(f"✅ Using company name column: {name_col}")
            
            # Build select query
            select_cols = ['id', f'{name_col} as companyname']
            
            if 'tracker_token' in company_cols:
                select_cols.append('tracker_token')
                has_tracker_token = True
            else:
                has_tracker_token = False
            
            # Determine isactive column name
            if 'is_active' in company_cols:
                isactive_col = 'is_active'
            elif 'isactive' in company_cols:
                isactive_col = 'isactive'
            else:
                isactive_col = 'is_active'  # Default fallback
            
            query = f"SELECT {', '.join(select_cols)} FROM companies WHERE id = %s AND {isactive_col} = TRUE"
            print(f"🔍 Executing query: {query}")
            
            cur.execute(query, (company_id,))
            company = cur.fetchone()
            
            if not company:
                return jsonify({"error": "Company not found or inactive"}), 404
            
            company_name = company['companyname']
            
            # Get or generate tracker token
            if has_tracker_token and company.get('tracker_token'):
                tracker_token = company['tracker_token']
                print(f"✅ Using existing tracker_token for company {company_id}")
            else:
                # Generate token
                import secrets
                token_data = f"{company_id}:{secrets.token_urlsafe(32)}"
                tracker_token = base64.b64encode(token_data.encode()).decode()
                print(f"✅ Generated new tracker_token for company {company_id}")
                
                # Try to save it if column exists
                if has_tracker_token:
                    try:
                        cur.execute("UPDATE companies SET tracker_token = %s WHERE id = %s", (tracker_token, company_id))
                        conn.commit()
                        print(f"✅ Saved tracker_token to database")
                    except Exception as e:
                        print(f"⚠️ Could not save tracker_token: {e}")
            
            # FIXED: Try multiple possible locations for tracker file
            backend_dir = os.path.dirname(os.path.abspath(__file__))
            
            # List of possible paths to check
            possible_paths = [
                os.path.join(backend_dir, 'wkv0.0.py'),  # Same directory as tracker_routes.py
                os.path.join(os.getcwd(), 'wkv0.0.py'),  # Current working directory
                os.path.join(backend_dir, '..', 'wkv0.0.py'),  # Parent directory
                '/opt/render/project/src/wkv0.0.py',  # Render deployment path
                'wkv0.0.py',  # Relative path
            ]
            
            tracker_file_path = None
            
            print(f"🔍 Searching for wkv0.0.py...")
            print(f"📂 Backend dir: {backend_dir}")
            print(f"📂 Current working dir: {os.getcwd()}")
            
            try:
                files_in_dir = os.listdir(backend_dir)
                print(f"📂 Files in backend dir ({len(files_in_dir)} total): {files_in_dir[:15]}")
            except Exception as e:
                print(f"⚠️ Could not list backend dir: {e}")
            
            for path in possible_paths:
                print(f"   Checking: {path}")
                if os.path.exists(path):
                    tracker_file_path = path
                    print(f"✅ Found tracker file at: {path}")
                    break
            
            if not tracker_file_path:
                print(f"❌ Tracker template not found in any location!")
                return jsonify({
                    "error": "Tracker template file not found on server",
                    "details": "wkv0.0.py file is missing. Please ensure it's uploaded to the backend repository.",
                    "searched_paths": possible_paths
                }), 500
            
            with open(tracker_file_path, 'r', encoding='utf-8') as f:
                tracker_content = f.read()
            
            print(f"✅ Tracker file read successfully ({len(tracker_content)} bytes)")
            
            # Inject token and company_id
            replacements = {
                "'tracker_token': None": f"'tracker_token': '{tracker_token}'",
                '"tracker_token": None': f'"tracker_token": "{tracker_token}"',
                "'company_id': None": f"'company_id': {company_id}",
                '"company_id": None': f'"company_id": {company_id}',
            }
            
            for old_value, new_value in replacements.items():
                if old_value in tracker_content:
                    tracker_content = tracker_content.replace(old_value, new_value)
                    print(f"✅ Replaced: {old_value[:30]}...")
            
            # Add header comment
            header_comment = f'''"""
╔═══════════════════════════════════════════════════════════════╗
║                    WORK-EYE TRACKER                           ║
║              Pre-Configured for {company_name[:30].ljust(30)} ║
╠═══════════════════════════════════════════════════════════════╣
║  Company ID: {str(company_id).ljust(48)} ║
║  Token: ***{tracker_token[-8:].ljust(45)} ║
║  Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC').ljust(45)} ║
╠═══════════════════════════════════════════════════════════════╣
║  INSTRUCTIONS:                                                ║
║  1. Run this file on employee computer                        ║
║  2. Employee enters their registered email                    ║
║  3. Tracker automatically verifies and starts                 ║
╚═══════════════════════════════════════════════════════════════╝
"""

'''
            tracker_content = header_comment + tracker_content
            
            # Save to temp file
            temp_fd, temp_file_path = tempfile.mkstemp(suffix='.py', prefix='workeye_tracker_')
            
            with os.fdopen(temp_fd, 'w', encoding='utf-8') as temp_file:
                temp_file.write(tracker_content)
            
            # Sanitize company name for filename
            sanitized_company = ''.join(c for c in company_name if c.isalnum() or c in [' ', '-', '_']).strip()
            sanitized_company = sanitized_company.replace(' ', '_')
            output_filename = f"WorkEyeTracker_{sanitized_company}.py"
            
            @after_this_request
            def cleanup(response):
                try:
                    if os.path.exists(temp_file_path):
                        os.unlink(temp_file_path)
                except Exception as e:
                    print(f"⚠️ Failed to cleanup temp file: {e}")
                return response
            
            print(f"✅ Tracker generated successfully: {output_filename}")
            
            return send_file(
                temp_file_path,
                mimetype='text/x-python',
                as_attachment=True,
                download_name=output_filename
            )
            
    except Exception as e:
        print(f"❌ Tracker download error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to generate tracker", "details": str(e)}), 500




# ============================================================================
# VERIFY MEMBER
# ============================================================================

@tracker_bp.route('/tracker/verify-member', methods=['POST'])
@require_tracker_token
def verify_member():
    """Verify member email and register device"""
    try:
        data = request.get_json(silent=True) or {}
        company_id = request.tracker_company_id
        
        email = data.get('email', '').lower().strip()
        deviceid = data.get('deviceid', '')
        
        print("="*70)
        print("🔍 VERIFY MEMBER START")
        print("="*70)
        print(f"📧 Email: '{email}'")
        print(f"🏢 Company ID: {company_id}")
        print(f"💻 Device ID: {deviceid}")
        
        if not email:
            print("❌ Email is required but not provided")
            return jsonify({"error": "Email required"}), 400
        
        if not deviceid:
            print("❌ Device ID is required but not provided")
            return jsonify({"error": "Device ID required"}), 400
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Check members table columns
            cur.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'members'
            """)
            member_cols = [row['column_name'] for row in cur.fetchall()]
            print(f"✅ Members table columns: {member_cols}")
            
            # Determine name column
            if 'full_name' in member_cols:
                name_col = 'full_name'
            elif 'name' in member_cols:
                name_col = 'name'
            elif 'fullname' in member_cols:
                name_col = 'fullname'
            else:
                print("❌ No name column found in members table!")
                return jsonify({"error": "Database configuration error"}), 500
            
            # Determine company_id column
            if 'company_id' in member_cols:
                company_col = 'company_id'
            elif 'companyid' in member_cols:
                company_col = 'companyid'
            else:
                company_col = 'company_id'
            
            # Determine is_active column
            if 'is_active' in member_cols:
                active_col = 'is_active'
            elif 'isactive' in member_cols:
                active_col = 'isactive'
            else:
                active_col = 'is_active'
            
            print(f"✅ Using columns: name={name_col}, company={company_col}, active={active_col}")
            
            # Query for member
            query = f"""
                SELECT id, email, {name_col} as membername, position, {active_col} as isactive 
                FROM members 
                WHERE {company_col} = %s AND email = %s
            """
            print(f"🔍 Executing query: {query}")
            print(f"🔍 Parameters: {company_col}={company_id}, email='{email}'")
            
            cur.execute(query, (company_id, email))
            member = cur.fetchone()
            
            if not member:
                print("❌ Member NOT FOUND!")
                
                # Debug: Check total members for this company
                cur.execute(f"SELECT COUNT(*) as count FROM members WHERE {company_col} = %s", (company_id,))
                count = cur.fetchone()['count']
                print(f"📊 Total members for company {company_id}: {count}")
                
                # Debug: List all members for this company
                cur.execute(f"SELECT id, email, {name_col} as name FROM members WHERE {company_col} = %s LIMIT 5", (company_id,))
                all_members = cur.fetchall()
                print(f"📋 Existing members:")
                for m in all_members:
                    print(f"   - ID: {m['id']}, Email: '{m['email']}', Name: {m['name']}")
                
                return jsonify({
                    "error": f"Email '{email}' not found in company. Contact your admin.",
                    "debug_info": f"Total members in company: {count}"
                }), 404
            
            print("✅ Member FOUND!")
            print(f"   - Member ID: {member['id']}")
            print(f"   - Member Name: {member['membername']}")
            print(f"   - Member Position: {member.get('position', 'N/A')}")
            print(f"   - Member Active: {member.get('isactive', True)}")
            
            # Check if member is active
            if not member.get('isactive', True):
                print("❌ Member account is INACTIVE")
                return jsonify({"error": "Member account is inactive"}), 403
            
            member_id = member['id']
            member_name = member.get('membername', 'Unknown')
            
            # Register/update device
            print("💻 Checking devices table...")
            
            # Check devices table columns
            cur.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'devices'
            """)
            device_cols = [row['column_name'] for row in cur.fetchall()]
            print(f"✅ Devices table columns: {device_cols}")
            
            # Determine device column names
            if 'company_id' in device_cols:
                dev_company_col = 'company_id'
                dev_member_col = 'member_id'
                dev_device_col = 'device_id'
                dev_name_col = 'device_name'
            else:
                dev_company_col = 'companyid'
                dev_member_col = 'memberid'
                dev_device_col = 'deviceid'
                dev_name_col = 'devicename'
            
            print(f"✅ Using device columns: {dev_company_col}, {dev_member_col}, {dev_device_col}")
            
            cur.execute(f"""
                SELECT id, {dev_name_col} as devicename, status 
                FROM devices 
                WHERE {dev_company_col} = %s AND {dev_member_col} = %s AND {dev_device_col} = %s
            """, (company_id, member_id, deviceid))
            
            device = cur.fetchone()
            
            if device:
                device_db_id = device['id']
                print(f"✅ Existing device found (DB ID: {device_db_id})")
                
                # Update device member_id if needed (device can be reassigned to new member)
                hostname = data.get('hostname', 'Unknown')
                osinfo = data.get('osinfo', 'Unknown OS')
                
                if 'os_info' in device_cols:
                    osinfo_col = 'os_info'
                elif 'osinfo' in device_cols:
                    osinfo_col = 'osinfo'
                else:
                    osinfo_col = 'os_info'
                
                cur.execute(f"""
                    UPDATE devices 
                    SET {dev_member_col} = %s, 
                        {dev_name_col} = %s, 
                        hostname = %s, 
                        {osinfo_col} = %s,
                        last_seen_at = NOW(),
                        status = 'active'
                    WHERE id = %s
                """, (member_id, hostname, hostname, osinfo, device_db_id))
                print(f"✅ Device updated with current member and status")
            else:
                # Register new device
                print("💻 Registering new device...")
                hostname = data.get('hostname', 'Unknown')
                osinfo = data.get('osinfo', 'Unknown OS')
                
                # FIXED: Detect os_info column name
                if 'os_info' in device_cols:
                    osinfo_col = 'os_info'
                elif 'osinfo' in device_cols:
                    osinfo_col = 'osinfo'
                else:
                    osinfo_col = 'os_info'
                
                print(f"✅ Using osinfo column: {osinfo_col}")
                
                # Check if device exists for any member in this company (handle reassignment)
                cur.execute(f"""
                    SELECT id, {dev_member_col} as current_member_id 
                    FROM devices 
                    WHERE {dev_company_col} = %s AND {dev_device_col} = %s
                """, (company_id, deviceid))
                
                existing_device = cur.fetchone()
                
                if existing_device:
                    # Device exists but for different member - reassign it
                    device_db_id = existing_device['id']
                    print(f"💻 Device exists for another member, reassigning...")
                    
                    cur.execute(f"""
                        UPDATE devices 
                        SET {dev_member_col} = %s, 
                            {dev_name_col} = %s, 
                            hostname = %s, 
                            {osinfo_col} = %s,
                            last_seen_at = NOW(),
                            status = 'active'
                        WHERE id = %s
                    """, (member_id, hostname, hostname, osinfo, device_db_id))
                    print(f"✅ Device reassigned to current member (DB ID: {device_db_id})")
                else:
                    # Truly new device - insert it
                    cur.execute(f"""
                        INSERT INTO devices ({dev_company_col}, {dev_member_col}, {dev_device_col}, {dev_name_col}, hostname, {osinfo_col}, status)
                        VALUES (%s, %s, %s, %s, %s, %s, 'active')
                        RETURNING id
                    """, (company_id, member_id, deviceid, hostname, hostname, osinfo))
                    
                    result = cur.fetchone()
                    device_db_id = result['id'] if result else None
                    
                    if device_db_id:
                        print(f"✅ New device registered (DB ID: {device_db_id})")
                    else:
                        print("⚠️ Device registration returned no ID")

            
            print("="*70)
            print("✅ VERIFY SUCCESS!")
            print(f"👤 Member: {member_name} ({email})")
            print(f"💻 Device: {device_db_id}")
            print("="*70)
            
            return jsonify({
                "success": True,
                "message": "Member verified successfully",
                "member": {
                    "id": member_id,
                    "email": member['email'],
                    "name": member_name,
                    "fullname": member_name,
                    "position": member.get('position', 'Member')
                },
                "device_id": device_db_id
            }), 200
            
    except Exception as e:
        print(f"❌ VERIFY EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error during verification",
            "details": str(e)
        }), 500




# ============================================================================
# PUNCH IN
# ============================================================================

@tracker_bp.route('/tracker/punch-in', methods=['POST'])
@require_tracker_token
def tracker_punch_in():
    """Record punch in"""
    try:
        data = request.get_json(silent=True) or {}
        company_id = request.tracker_company_id
        
        email = data.get('email', '').lower().strip()
        deviceid_str = data.get('deviceid', '')
        
        print(f"👊 PUNCH-IN: Email={email}, Company={company_id}, Device={deviceid_str}")
        
        if not email or not deviceid_str:
            return jsonify({"error": "Email and deviceid required"}), 400
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Detect column names
            cur.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'members' AND column_name IN ('name', 'full_name', 'fullname', 'company_id', 'companyid')
            """)
            cols = {row['column_name'] for row in cur.fetchall()}
            
            name_col = 'full_name' if 'full_name' in cols else ('name' if 'name' in cols else 'fullname')
            company_col = 'company_id' if 'company_id' in cols else 'companyid'
            
            # Get member
            cur.execute(
                f"SELECT id, {name_col} as membername FROM members WHERE {company_col} = %s AND email = %s",
                (company_id, email)
            )
            member = cur.fetchone()
            
            if not member:
                return jsonify({"error": "Member not found"}), 404
            
            member_id = member['id']
            member_name = member['membername']
            
            # Detect device column names
            cur.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'devices' AND column_name IN ('company_id', 'companyid', 'member_id', 'memberid', 'device_id', 'deviceid')
            """)
            dev_cols = {row['column_name'] for row in cur.fetchall()}
            
            dev_company_col = 'company_id' if 'company_id' in dev_cols else 'companyid'
            dev_member_col = 'member_id' if 'member_id' in dev_cols else 'memberid'
            dev_device_col = 'device_id' if 'device_id' in dev_cols else 'deviceid'
            
            # Get device
            cur.execute(
                f"SELECT id FROM devices WHERE {dev_company_col} = %s AND {dev_member_col} = %s AND {dev_device_col} = %s",
                (company_id, member_id, deviceid_str)
            )
            device = cur.fetchone()
            device_db_id = device['id'] if device else None
            
            if not device_db_id:
                print(f"⚠️ PUNCH-IN: Device not found, proceeding without device_id")
            
            now = datetime.utcnow()
            today = now.date()
            
            # Detect punchlogs column names
            cur.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'punch_logs' AND column_name IN ('company_id', 'companyid', 'member_id', 'memberid', 'device_id', 'deviceid', 'punch_in_time', 'punchintime', 'punch_out_time', 'punchouttime', 'punch_date', 'punchdate')
            """)
            punch_cols = {row['column_name'] for row in cur.fetchall()}
            
            punch_company_col = 'company_id' if 'company_id' in punch_cols else 'companyid'
            punch_member_col = 'member_id' if 'member_id' in punch_cols else 'memberid'
            punch_device_col = 'device_id' if 'device_id' in punch_cols else 'deviceid'
            punch_in_col = 'punch_in_time' if 'punch_in_time' in punch_cols else 'punchintime'
            punch_out_col = 'punch_out_time' if 'punch_out_time' in punch_cols else 'punchouttime'
            punch_date_col = 'punch_date' if 'punch_date' in punch_cols else 'punchdate'
            
            # Check if status column exists in punch_logs
            cur.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'punch_logs' AND column_name = 'status'
            """)
            has_status_col = cur.fetchone() is not None
            
            # Check for existing active punch
            cur.execute(f"""
                SELECT id FROM punch_logs 
                WHERE {punch_company_col} = %s AND {punch_member_col} = %s AND {punch_out_col} IS NULL 
                ORDER BY {punch_in_col} DESC LIMIT 1
            """, (company_id, member_id))
            
            existing = cur.fetchone()
            
            if existing:
                print(f"⚠️ PUNCH-IN: Already punched in")
                return jsonify({
                    "success": True,
                    "message": "Already punched in",
                    "punchlogid": existing['id']
                }), 200
            
            # Create new punch in with or without status column
            try:
                if has_status_col:
                    if device_db_id:
                        cur.execute(f"""
                            INSERT INTO punch_logs ({punch_company_col}, {punch_member_col}, {punch_device_col}, {punch_date_col}, {punch_in_col}, status)
                            VALUES (%s, %s, %s, %s, %s, 'punched_in')
                            RETURNING id, {punch_in_col}
                        """, (company_id, member_id, device_db_id, today, now))
                    else:
                        cur.execute(f"""
                            INSERT INTO punch_logs ({punch_company_col}, {punch_member_col}, {punch_date_col}, {punch_in_col}, status)
                            VALUES (%s, %s, %s, %s, 'punched_in')
                            RETURNING id, {punch_in_col}
                        """, (company_id, member_id, today, now))
                else:
                    # Fallback without status column
                    if device_db_id:
                        cur.execute(f"""
                            INSERT INTO punch_logs ({punch_company_col}, {punch_member_col}, {punch_device_col}, {punch_date_col}, {punch_in_col})
                            VALUES (%s, %s, %s, %s, %s)
                            RETURNING id, {punch_in_col}
                        """, (company_id, member_id, device_db_id, today, now))
                    else:
                        cur.execute(f"""
                            INSERT INTO punch_logs ({punch_company_col}, {punch_member_col}, {punch_date_col}, {punch_in_col})
                            VALUES (%s, %s, %s, %s)
                            RETURNING id, {punch_in_col}
                        """, (company_id, member_id, today, now))
            except Exception as insert_error:
                print(f"❌ PUNCH-IN Insert Error: {insert_error}")
                raise
            
            result = cur.fetchone()
            punchlog_id = result['id']
            
            # Update member status
            try:
                cur.execute(f"""
                    UPDATE members 
                    SET last_punch_in_at = %s, status = 'active', is_punched_in = TRUE 
                    WHERE id = %s
                """, (now, member_id))
            except Exception as e:
                print(f"⚠️ PUNCH-IN: Could not update member status: {e}")
            
            print(f"✅ PUNCH-IN: Success for {member_name}")
            
            return jsonify({
                "success": True,
                "message": f"Punched in successfully as {member_name}",
                "punchlogid": punchlog_id,
                "punchintime": now.isoformat()
            }), 200
            
    except Exception as e:
        print(f"❌ PUNCH-IN Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to record punch in"}), 500


# ============================================================================
# PUNCH OUT
# ============================================================================

@tracker_bp.route('/tracker/punch-out', methods=['POST'])
@require_tracker_token
def tracker_punch_out():
    """Record punch out"""
    try:
        data = request.get_json(silent=True) or {}
        company_id = request.tracker_company_id
        
        email = data.get('email', '').lower().strip()
        deviceid_str = data.get('deviceid', '')
        
        print(f"👋 PUNCH-OUT: Email={email}, Company={company_id}")
        
        if not email or not deviceid_str:
            return jsonify({"error": "Email and deviceid required"}), 400
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Detect column names
            cur.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'members' AND column_name IN ('name', 'full_name', 'fullname', 'company_id', 'companyid')
            """)
            cols = {row['column_name'] for row in cur.fetchall()}
            
            name_col = 'full_name' if 'full_name' in cols else ('name' if 'name' in cols else 'fullname')
            company_col = 'company_id' if 'company_id' in cols else 'companyid'
            
            # Get member
            cur.execute(
                f"SELECT id, {name_col} as membername FROM members WHERE {company_col} = %s AND email = %s",
                (company_id, email)
            )
            member = cur.fetchone()
            
            if not member:
                return jsonify({"error": "Member not found"}), 404
            
            member_id = member['id']
            member_name = member['membername']
            
            now = datetime.utcnow()
            
            # Detect punchlogs column names
            cur.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'punch_logs' AND column_name IN ('company_id', 'companyid', 'member_id', 'memberid', 'punch_in_time', 'punchintime', 'punch_out_time', 'punchouttime', 'work_duration_seconds', 'workdurationseconds', 'status')
            """)
            punch_cols = {row['column_name'] for row in cur.fetchall()}
            
            punch_company_col = 'company_id' if 'company_id' in punch_cols else 'companyid'
            punch_member_col = 'member_id' if 'member_id' in punch_cols else 'memberid'
            punch_in_col = 'punch_in_time' if 'punch_in_time' in punch_cols else 'punchintime'
            punch_out_col = 'punch_out_time' if 'punch_out_time' in punch_cols else 'punchouttime'
            work_duration_col = 'work_duration_seconds' if 'work_duration_seconds' in punch_cols else 'workdurationseconds'
            has_status_col = 'status' in punch_cols
            
            # Find latest active punch log (most recent punch-in without punch-out)
            cur.execute(f"""
                SELECT id, {punch_in_col} as punchintime
                FROM punch_logs 
                WHERE {punch_company_col} = %s AND {punch_member_col} = %s AND {punch_out_col} IS NULL 
                ORDER BY {punch_in_col} DESC LIMIT 1
            """, (company_id, member_id))
            
            punch_log = cur.fetchone()
            
            if not punch_log:
                print(f"⚠️ PUNCH-OUT: No active punch in session")
                return jsonify({
                    "success": True,
                    "message": "No active punch in session found"
                }), 200
            
            punchlog_id = punch_log['id']
            punchin_time = punch_log['punchintime']
            duration = (now - punchin_time).total_seconds()
            
            # Update punch log with proper status handling
            try:
                if has_status_col:
                    cur.execute(f"""
                        UPDATE punch_logs 
                        SET {punch_out_col} = %s, {work_duration_col} = %s, status = 'punched_out' 
                        WHERE id = %s
                    """, (now, duration, punchlog_id))
                else:
                    cur.execute(f"""
                        UPDATE punch_logs 
                        SET {punch_out_col} = %s, {work_duration_col} = %s
                        WHERE id = %s
                    """, (now, duration, punchlog_id))
            except Exception as update_error:
                print(f"❌ PUNCH-OUT Update Error: {update_error}")
                raise
            
            # Update member status
            try:
                cur.execute(f"""
                    UPDATE members 
                    SET last_punch_out_at = %s, status = 'offline', is_punched_in = FALSE 
                    WHERE id = %s
                """, (now, member_id))
            except Exception as e:
                print(f"⚠️ PUNCH-OUT: Could not update member status: {e}")
            
            hours = int(duration // 3600)
            minutes = int((duration % 3600) // 60)
            
            print(f"✅ PUNCH-OUT: Success for {member_name} - Duration: {hours}h {minutes}m")
            
            return jsonify({
                "success": True,
                "message": f"Punched out successfully. Work duration: {hours}h {minutes}m",
                "punchlogid": punchlog_id,
                "punchouttime": now.isoformat(),
                "workdurationseconds": duration
            }), 200
            
    except Exception as e:
        print(f"❌ PUNCH-OUT Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to record punch out"}), 500



# ============================================================================
# UPLOAD DATA
# ============================================================================

@tracker_bp.route('/tracker/upload', methods=['POST'])
@require_tracker_token
def tracker_upload():
    """Upload tracking data from tracker"""
    try:
        data = request.get_json(silent=True) or {}
        company_id = request.tracker_company_id
        
        email = data.get('email', '').lower().strip()
        deviceid_str = data.get('deviceid', '')
        
        if not email or not deviceid_str:
            return jsonify({"error": "Email and deviceid required"}), 400
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Get member
            cur.execute("SELECT id FROM members WHERE company_id = %s AND email = %s", (company_id, email))
            member = cur.fetchone()
            
            if not member:
                return jsonify({"error": "Member not found"}), 404
            
            member_id = member['id']
            
            # Get device
            cur.execute(
                "SELECT id FROM devices WHERE company_id = %s AND member_id = %s AND device_id = %s",
                (company_id, member_id, deviceid_str)
            )
            device = cur.fetchone()
            
            if not device:
                return jsonify({"error": "Device not registered"}), 404
            
            device_db_id = device['id']
            
            now = datetime.utcnow()
            today = now.date()
            
            is_idle = data.get('isidle', False)
            is_locked = data.get('locked', False)
            
            if is_locked:
                member_status = 'offline'
            elif is_idle:
                member_status = 'idle'
            else:
                member_status = 'active'
            
            screenshot_data = data.get('screenshot')
            windows_opened = data.get('windowsopened', [])
            browser_history = data.get('browserhistory', [])
            
            # Insert into activity_log
            cur.execute("""
                INSERT INTO activity_log (
                    company_id, member_id, device_id, timestamp,
                    session_start, last_activity, username, email,
                    total_seconds, active_seconds, idle_seconds, locked_seconds,
                    idle_for, is_idle, locked, mouse_active, keyboard_active,
                    current_window, current_process, windows_opened, browser_history, screenshot
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s
                ) RETURNING id
            """, (
                company_id, member_id, deviceid_str, data.get('timestamp', now),
                data.get('sessionstart'), data.get('lastactivity'), data.get('username'),
                email, data.get('totalseconds', 0),
                data.get('activeseconds', 0), data.get('idleseconds', 0), data.get('lockedseconds', 0),
                data.get('idlefor', 0), is_idle, is_locked, data.get('mouseactive', False),
                data.get('keyboardactive', False), data.get('currentwindow'), data.get('currentprocess'),
                json.dumps(windows_opened), json.dumps(browser_history), screenshot_data
            ))
            
            result = cur.fetchone()
            raw_data_id = result['id'] if result else None
            
            # Process screenshot if provided
            screenshot_id = None
            if screenshot_data:
                try:
                    if ',' in screenshot_data:
                        screenshot_data = screenshot_data.split(',', 1)[1]
                    
                    img_data = base64.b64decode(screenshot_data)
                    img = Image.open(BytesIO(img_data))
                    
                    # Convert to WEBP
                    output = BytesIO()
                    img.save(output, format='WEBP', quality=80)
                    webp_binary = output.getvalue()
                    
                    cur.execute("""
                        INSERT INTO screenshots (
                            company_id, member_id, device_id, raw_data_id, timestamp, tracking_date,
                            screenshot_data, file_size, width, height
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, (
                        company_id, member_id, device_db_id, raw_data_id,
                        data.get('timestamp', now), today, webp_binary,
                        len(webp_binary), img.width, img.height
                    ))
                    
                    result = cur.fetchone()
                    screenshot_id = result['id'] if result else None
                    
                except Exception as e:
                    print(f"⚠️ Screenshot processing error: {e}")
            
            # Update device status (DISABLED - schema unknown)
            # cur.execute("UPDATE devices SET lastseen = %s, status = 'online' WHERE id = %s", (now, device_db_id))
            # TODO: Find correct column name for devices table
            
            # Update member status
            cur.execute("""
                UPDATE members 
                SET last_activity_at = %s, last_heartbeat_at = %s, status = %s 
                WHERE id = %s
            """, (now, now, member_status, member_id))
            
            print(f"✅ UPLOAD: Data uploaded successfully for member {member_id}")
            
            return jsonify({
                "success": True,
                "message": "Data uploaded successfully",
                "rawdataid": raw_data_id,
                "screenshotid": screenshot_id,
                "memberstatus": member_status,
                "trackingdate": today.isoformat()
            }), 200
            
    except Exception as e:
        print(f"❌ UPLOAD Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to upload data"}), 500


# ============================================================================
# HEARTBEAT
# ============================================================================

@tracker_bp.route('/tracker/heartbeat', methods=['POST'])
@require_tracker_token
def tracker_heartbeat():
    """Keep-alive ping from tracker"""
    try:
        data = request.get_json(silent=True) or {}
        company_id = request.tracker_company_id
        
        email = data.get('email', '').lower().strip()
        deviceid_str = data.get('deviceid', '')
        
        if not email or not deviceid_str:
            return jsonify({"error": "Email and deviceid required"}), 400
        
        with get_db() as conn:
            cur = conn.cursor()
            
            cur.execute("""
                UPDATE devices d 
                SET last_seen_at = %s, status = 'online'
                FROM members m 
                WHERE d.company_id = %s AND d.member_id = m.id 
                  AND m.email = %s AND d.device_id = %s
            """, (datetime.utcnow(), company_id, email, deviceid_str))
            
            return jsonify({"success": True, "message": "Heartbeat received"}), 200
            
    except Exception as e:
        print(f"❌ HEARTBEAT Error: {e}")
        return jsonify({"error": "Failed to process heartbeat"}), 500


__all__ = ['tracker_bp']
