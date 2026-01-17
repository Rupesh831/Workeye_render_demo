"""
ADMIN_AUTH_ROUTES.PY - Admin Dashboard Authentication
======================================================
✅ FIXED: Uses 'users' table instead of 'admins'
✅ Works with your actual database schema
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from functools import wraps
import bcrypt
import jwt
import os
import secrets
import base64
from db import get_db

admin_auth_bp = Blueprint('admin_auth', __name__)

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-super-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 30  # 30 days

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def hash_password(password: str) -> str:
    """Hash password with bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_tracker_token(company_id: int) -> str:
    """Generate unique tracker token for company"""
    token_data = f"{company_id}:{secrets.token_urlsafe(32)}"
    return base64.b64encode(token_data.encode()).decode()

def generate_admin_jwt(admin_id: int, company_id: int, email: str) -> str:
    """Generate JWT with company_id embedded"""
    payload = {
        'admin_id': admin_id,
        'company_id': company_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_admin_jwt(token: str) -> dict:
    """Verify JWT and extract company_id"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError('Token has expired')
    except jwt.InvalidTokenError:
        raise ValueError('Invalid token')

def require_admin_auth(f):
    """Decorator: Require admin JWT authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Invalid authorization header'}), 401
        
        token = auth_header.replace('Bearer ', '')
        try:
            payload = verify_admin_jwt(token)
            request.admin_id = payload['admin_id']
            request.company_id = payload['company_id']
            request.admin_email = payload['email']
        except ValueError as e:
            return jsonify({'error': str(e)}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function

def validate_company_username(username: str) -> bool:
    """Validate company username format"""
    import re
    pattern = r'^[a-z0-9-]{3,50}$'
    return bool(re.match(pattern, username))

# ============================================================================
# ADMIN SIGNUP
# ============================================================================

@admin_auth_bp.route('/auth/admin/signup', methods=['POST'])
def admin_signup():
    """Admin creates company account"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['company_username', 'company_name', 'email', 'password']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        company_username = data['company_username'].lower().strip()
        company_name = data['company_name'].strip()
        email = data['email'].lower().strip()
        password = data['password']
        full_name = data.get('full_name', company_name)
        
        # Validate username format
        if not validate_company_username(company_username):
            return jsonify({
                'error': 'Invalid company username. Use lowercase, numbers, hyphens (3-50 chars)'
            }), 400
        
        # Validate password
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Check what columns exist in companies table
            cur.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'companies'
            """)
            company_cols = [row['column_name'] for row in cur.fetchall()]
            
            # Determine correct column names
            username_col = 'company_username' if 'company_username' in company_cols else 'username'
            name_col = 'company_name' if 'company_name' in company_cols else 'name'
            isactive_col = 'is_active' if 'is_active' in company_cols else 'isactive'
            
            # Check if company username exists
            cur.execute(
                f"SELECT id FROM companies WHERE {username_col} = %s",
                (company_username,)
            )
            
            if cur.fetchone():
                return jsonify({'error': 'Company username already exists'}), 409
            
            # Check if admin email exists - FIXED: Use 'users' table
            cur.execute(
                "SELECT id FROM users WHERE email = %s",
                (email,)
            )
            
            if cur.fetchone():
                return jsonify({'error': 'Email already registered'}), 409
            
            # Generate tracker token
            temp_company_id = 999999
            tracker_token = generate_tracker_token(temp_company_id)
            
            # Create company
            if 'tracker_token' in company_cols:
                cur.execute(
                    f"""
                    INSERT INTO companies ({username_col}, {name_col}, tracker_token, {isactive_col})
                    VALUES (%s, %s, %s, TRUE)
                    RETURNING id, {username_col} as company_username, {name_col} as company_name, tracker_token
                    """,
                    (company_username, company_name, tracker_token)
                )
            else:
                cur.execute(
                    f"""
                    INSERT INTO companies ({username_col}, {name_col}, {isactive_col})
                    VALUES (%s, %s, TRUE)
                    RETURNING id, {username_col} as company_username, {name_col} as company_name
                    """,
                    (company_username, company_name)
                )
            
            company = cur.fetchone()
            company_id = company['id']
            
            # Regenerate tracker token with actual company_id
            tracker_token = generate_tracker_token(company_id)
            
            if 'tracker_token' in company_cols:
                cur.execute(
                    "UPDATE companies SET tracker_token = %s WHERE id = %s",
                    (tracker_token, company_id)
                )
            
            # Hash password
            password_hash = hash_password(password)
            
            # Create admin account - FIXED: Use 'users' table
            cur.execute(
                """
                INSERT INTO users (company_id, email, password_hash, full_name, role, is_active)
                VALUES (%s, %s, %s, %s, 'admin', TRUE)
                RETURNING id, email, full_name, role
                """,
                (company_id, email, password_hash, full_name)
            )
            
            admin = cur.fetchone()
            
            # Generate JWT
            jwt_token = generate_admin_jwt(admin['id'], company_id, email)
            
            return jsonify({
                'success': True,
                'token': jwt_token,
                'admin': {
                    'id': admin['id'],
                    'email': admin['email'],
                    'full_name': admin['full_name'],
                    'role': admin['role'],
                    'company_id': company_id
                },
                'company': {
                    'id': company_id,
                    'company_name': company['company_name'],
                    'company_username': company['company_username'],
                    'tracker_token': tracker_token
                }
            }), 201
            
    except Exception as e:
        print(f"❌ Admin signup error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error during signup'}), 500


# ============================================================================
# ADMIN LOGIN - FIXED
# ============================================================================

@admin_auth_bp.route('/auth/admin/login', methods=['POST'])
def admin_login():
    """Admin dashboard login"""
    try:
        data = request.get_json()
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Find admin by email - FIXED: Use 'users' table
            cur.execute(
                """
                SELECT id, company_id, email, password_hash, full_name, role, is_active
                FROM users WHERE email = %s
                """,
                (email,)
            )
            
            admin = cur.fetchone()
            
            if not admin:
                print(f"❌ Login failed: User not found for email: {email}")
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Verify password
            if not verify_password(password, admin['password_hash']):
                print(f"❌ Login failed: Invalid password for email: {email}")
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Check if admin is active
            if not admin['is_active']:
                print(f"❌ Login failed: Inactive account for email: {email}")
                return jsonify({'error': 'Account is disabled'}), 403
            
            # Check what columns exist in companies table
            cur.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'companies'
            """)
            company_cols = [row['column_name'] for row in cur.fetchall()]
            
            # Determine correct column names
            username_col = 'company_username' if 'company_username' in company_cols else 'username'
            name_col = 'company_name' if 'company_name' in company_cols else 'name'
            isactive_col = 'is_active' if 'is_active' in company_cols else 'isactive'
            
            # Build query for company
            select_cols = [
                'id',
                f'{name_col} as company_name',
                f'{username_col} as company_username',
                f'{isactive_col} as is_active'
            ]
            
            if 'tracker_token' in company_cols:
                select_cols.append('tracker_token')
            
            query = f"SELECT {', '.join(select_cols)} FROM companies WHERE id = %s"
            
            cur.execute(query, (admin['company_id'],))
            company = cur.fetchone()
            
            if not company or not company['is_active']:
                print(f"❌ Login failed: Company not found or inactive for company_id: {admin['company_id']}")
                return jsonify({'error': 'Company account is inactive'}), 403
            
            # Update last login - FIXED: Use 'users' table
            cur.execute(
                "UPDATE users SET last_login = %s WHERE id = %s",
                (datetime.utcnow(), admin['id'])
            )
            
            # Generate JWT
            jwt_token = generate_admin_jwt(admin['id'], company['id'], email)
            
            print(f"✅ Login successful for email: {email}, company_id: {company['id']}")
            
            return jsonify({
                'success': True,
                'token': jwt_token,
                'admin': {
                    'id': admin['id'],
                    'email': admin['email'],
                    'full_name': admin['full_name'],
                    'role': admin['role'],
                    'company_id': company['id']
                },
                'company': {
                    'id': company['id'],
                    'company_name': company['company_name'],
                    'company_username': company['company_username'],
                    'tracker_token': company.get('tracker_token', '')
                }
            }), 200
            
    except Exception as e:
        print(f"❌ Admin login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error during login'}), 500


# ============================================================================
# VALIDATE ADMIN TOKEN - FIXED
# ============================================================================

@admin_auth_bp.route('/auth/admin/validate-token', methods=['GET'])
def validate_admin_token():
    """Validate admin JWT and return details"""
    try:
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Invalid authorization header'}), 401
        
        token = auth_header.replace('Bearer ', '')
        
        try:
            payload = verify_admin_jwt(token)
        except ValueError as e:
            return jsonify({'error': str(e)}), 401
        
        admin_id = payload['admin_id']
        company_id = payload['company_id']
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Get admin - FIXED: Use 'users' table
            cur.execute(
                """
                SELECT id, email, full_name, role, is_active, company_id
                FROM users WHERE id = %s
                """,
                (admin_id,)
            )
            
            admin = cur.fetchone()
            
            if not admin or not admin['is_active']:
                return jsonify({'error': 'Admin not found or inactive'}), 401
            
            # Verify company_id matches
            if admin['company_id'] != company_id:
                return jsonify({'error': 'Company mismatch'}), 401
            
            # Check what columns exist in companies table
            cur.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'companies'
            """)
            company_cols = [row['column_name'] for row in cur.fetchall()]
            
            # Determine correct column names
            username_col = 'company_username' if 'company_username' in company_cols else 'username'
            name_col = 'company_name' if 'company_name' in company_cols else 'name'
            isactive_col = 'is_active' if 'is_active' in company_cols else 'isactive'
            
            # Get company
            cur.execute(
                f"""
                SELECT id, {name_col} as company_name, {username_col} as company_username, {isactive_col} as is_active
                FROM companies WHERE id = %s
                """,
                (company_id,)
            )
            
            company = cur.fetchone()
            
            if not company or not company['is_active']:
                return jsonify({'error': 'Company not found or inactive'}), 401
            
            return jsonify({
                'success': True,
                'admin': {
                    'id': admin['id'],
                    'email': admin['email'],
                    'full_name': admin['full_name'],
                    'role': admin['role'],
                    'company_id': company_id
                },
                'company': {
                    'id': company['id'],
                    'company_name': company['company_name'],
                    'company_username': company['company_username']
                }
            }), 200
            
    except Exception as e:
        print(f"❌ Token validation error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500


# ============================================================================
# DELETE ADMIN ACCOUNT
# ============================================================================

@admin_auth_bp.route('/auth/admin/delete-account', methods=['DELETE'])
@require_admin_auth
def delete_admin_account():
    """
    Delete admin account and all associated company data permanently
    This includes:
    - Admin user account
    - Company record
    - All members associated with the company
    - All tracking data (screenshots, activity logs, attendance, etc.)
    """
    try:
        admin_id = request.admin_id
        company_id = request.company_id
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Verify admin exists and get company_id
            cur.execute(
                "SELECT id, company_id, email, role FROM users WHERE id = %s",
                (admin_id,)
            )
            admin = cur.fetchone()
            
            if not admin:
                return jsonify({'error': 'Admin not found'}), 404
            
            # Verify admin is authorized to delete (must be admin role)
            if admin['role'] != 'admin':
                return jsonify({'error': 'Only admin users can delete accounts'}), 403
            
            # Verify company_id matches
            if admin['company_id'] != company_id:
                return jsonify({'error': 'Unauthorized'}), 403
            
            print(f"🗑️  Starting account deletion for admin_id={admin_id}, company_id={company_id}")
            
            # Start cascading deletion
            # 1. Delete all screenshots for the company
            cur.execute(
                """
                DELETE FROM screenshots 
                WHERE device_id IN (
                    SELECT id FROM devices WHERE company_id = %s
                )
                """,
                (company_id,)
            )
            deleted_screenshots = cur.rowcount
            print(f"   ✓ Deleted {deleted_screenshots} screenshots")
            
            # 2. Delete all activity logs
            cur.execute(
                """
                DELETE FROM activity_logs 
                WHERE device_id IN (
                    SELECT id FROM devices WHERE company_id = %s
                )
                """,
                (company_id,)
            )
            deleted_activities = cur.rowcount
            print(f"   ✓ Deleted {deleted_activities} activity logs")
            
            # 3. Delete all website visits
            cur.execute(
                """
                DELETE FROM website_visits 
                WHERE device_id IN (
                    SELECT id FROM devices WHERE company_id = %s
                )
                """,
                (company_id,)
            )
            deleted_websites = cur.rowcount
            print(f"   ✓ Deleted {deleted_websites} website visits")
            
            # 4. Delete all application usage
            cur.execute(
                """
                DELETE FROM application_usage 
                WHERE device_id IN (
                    SELECT id FROM devices WHERE company_id = %s
                )
                """,
                (company_id,)
            )
            deleted_app_usage = cur.rowcount
            print(f"   ✓ Deleted {deleted_app_usage} application usage records")
            
            # 5. Delete all attendance records
            cur.execute(
                """
                DELETE FROM attendance 
                WHERE member_id IN (
                    SELECT id FROM users WHERE company_id = %s
                )
                """,
                (company_id,)
            )
            deleted_attendance = cur.rowcount
            print(f"   ✓ Deleted {deleted_attendance} attendance records")
            
            # 6. Delete all devices
            cur.execute(
                "DELETE FROM devices WHERE company_id = %s",
                (company_id,)
            )
            deleted_devices = cur.rowcount
            print(f"   ✓ Deleted {deleted_devices} devices")
            
            # 7. Delete all company members (including admin)
            cur.execute(
                "DELETE FROM users WHERE company_id = %s",
                (company_id,)
            )
            deleted_users = cur.rowcount
            print(f"   ✓ Deleted {deleted_users} users")
            
            # 8. Delete tracker settings if they exist
            try:
                cur.execute(
                    "DELETE FROM tracker_settings WHERE company_id = %s",
                    (company_id,)
                )
                deleted_settings = cur.rowcount
                print(f"   ✓ Deleted {deleted_settings} tracker settings")
            except Exception as e:
                print(f"   ⚠ Tracker settings deletion skipped (table may not exist): {e}")
            
            # 9. Finally, delete the company
            cur.execute(
                "DELETE FROM companies WHERE id = %s",
                (company_id,)
            )
            deleted_companies = cur.rowcount
            print(f"   ✓ Deleted {deleted_companies} company record")
            
            # Commit all deletions
            conn.commit()
            
            print(f"✅ Account deletion completed successfully for company_id={company_id}")
            
            return jsonify({
                'success': True,
                'message': 'Account and all associated data deleted permanently',
                'deleted_counts': {
                    'screenshots': deleted_screenshots,
                    'activity_logs': deleted_activities,
                    'website_visits': deleted_websites,
                    'application_usage': deleted_app_usage,
                    'attendance_records': deleted_attendance,
                    'devices': deleted_devices,
                    'users': deleted_users,
                    'companies': deleted_companies
                }
            }), 200
            
    except Exception as e:
        print(f"❌ Delete account error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error during account deletion'}), 500


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = ['admin_auth_bp', 'require_admin_auth']
