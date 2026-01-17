"""
CONFIGURATION_ROUTES.PY - Advanced JSONB-Based Configuration Management
=========================================================================
✅ Flexible JSONB storage for company configuration
✅ GET /configuration?company_id=<id> - Get configuration
✅ POST /configuration - Save configuration (replaces, not merges)
✅ IST timezone support for all timestamps
✅ Uses psycopg2 only (no SQLAlchemy)
✅ Proper audit trail with updated_at timestamps
"""

from flask import Blueprint, request, jsonify
from admin_auth_routes import require_admin_auth
from db import get_db, get_ist_now, IST
from datetime import datetime
import json

configuration_bp = Blueprint('configuration', __name__)

# ============================================================================
# GET COMPANY CONFIGURATION
# ============================================================================

@configuration_bp.route('/api/configuration', methods=['GET'])
@require_admin_auth
def get_configuration():
    """
    Get current configuration for the company
    
    Query params:
        company_id (optional): Company ID - defaults to authenticated user's company
    
    Returns:
        {
            "success": true,
            "config": {...},
            "updated_at": "2025-01-16T10:30:00+05:30"
        }
    """
    try:
        # Get company_id from query param or auth context
        company_id = request.args.get('company_id') or request.company_id
        
        if not company_id:
            return jsonify({'error': 'Company ID required'}), 400
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Get configuration from JSONB table
            cur.execute("""
                SELECT config_data, updated_at, created_at
                FROM configuration
                WHERE company_id = %s
            """, (company_id,))
            
            config_row = cur.fetchone()
            
            if not config_row:
                # Return default configuration if not exists
                default_config = {
                    'screenshot_interval_minutes': 10,
                    'idle_timeout_minutes': 5,
                    'office_start_time': '09:00:00',
                    'office_end_time': '18:00:00',
                    'working_days': [1, 2, 3, 4, 5]  # Monday to Friday
                }
                
                return jsonify({
                    'success': True,
                    'config': default_config,
                    'updated_at': None,
                    'message': 'Using default configuration'
                }), 200
            
            # Convert timestamps to IST
            updated_at_ist = config_row['updated_at'].astimezone(IST) if config_row['updated_at'] else None
            created_at_ist = config_row['created_at'].astimezone(IST) if config_row.get('created_at') else None
            
            # Return stored configuration
            result = {
                'success': True,
                'config': config_row['config_data'],
                'updated_at': updated_at_ist.isoformat() if updated_at_ist else None,
                'created_at': created_at_ist.isoformat() if created_at_ist else None
            }
            
            print(f"✅ Retrieved configuration for company {company_id}")
            
            return jsonify(result), 200
            
    except Exception as e:
        print(f"❌ Get configuration error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch configuration'}), 500


# ============================================================================
# SAVE COMPANY CONFIGURATION
# ============================================================================

@configuration_bp.route('/api/configuration', methods=['POST'])
@require_admin_auth
def save_configuration():
    """
    Save/update company configuration (REPLACES existing config, does not merge)
    
    Expected JSON:
    {
        "company_id": 1,  // Optional - defaults to auth context
        "config": {
            "screenshot_interval_minutes": 10,
            "idle_timeout_minutes": 5,
            "office_start_time": "09:00:00",
            "office_end_time": "18:00:00",
            "working_days": [1, 2, 3, 4, 5],
            // ... any other custom settings
        }
    }
    
    Returns:
        {
            "success": true,
            "config": {...},
            "updated_at": "2025-01-16T10:30:00+05:30"
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        # Get company_id from request or auth context
        company_id = data.get('company_id') or request.company_id
        config_data = data.get('config')
        
        if not company_id:
            return jsonify({'error': 'Company ID required'}), 400
        
        if not config_data or not isinstance(config_data, dict):
            return jsonify({'error': 'Config object required'}), 400
        
        # Validate basic configuration fields
        if 'screenshot_interval_minutes' in config_data:
            interval = config_data['screenshot_interval_minutes']
            if interval not in [5, 10, 15, 30, 60]:
                return jsonify({'error': 'Invalid screenshot interval. Must be 5, 10, 15, 30, or 60 minutes'}), 400
        
        if 'idle_timeout_minutes' in config_data:
            timeout = config_data['idle_timeout_minutes']
            if timeout < 1 or timeout > 15:
                return jsonify({'error': 'Invalid idle timeout. Must be between 1 and 15 minutes'}), 400
        
        if 'working_days' in config_data:
            days = config_data['working_days']
            if not isinstance(days, list) or not all(isinstance(d, int) and 0 <= d <= 6 for d in days):
                return jsonify({'error': 'Invalid working days. Must be array of integers 0-6'}), 400
        
        # Validate time format
        if 'office_start_time' in config_data:
            try:
                datetime.strptime(config_data['office_start_time'], '%H:%M:%S')
            except ValueError:
                return jsonify({'error': 'Invalid office start time format. Use HH:MM:SS'}), 400
        
        if 'office_end_time' in config_data:
            try:
                datetime.strptime(config_data['office_end_time'], '%H:%M:%S')
            except ValueError:
                return jsonify({'error': 'Invalid office end time format. Use HH:MM:SS'}), 400
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Get current IST time
            now_ist = get_ist_now()
            
            # Upsert configuration (insert or update) - REPLACES entire config
            cur.execute("""
                INSERT INTO configuration (company_id, config_data, updated_at, created_at)
                VALUES (%s, %s::jsonb, %s, %s)
                ON CONFLICT (company_id) 
                DO UPDATE SET 
                    config_data = EXCLUDED.config_data,
                    updated_at = EXCLUDED.updated_at
                RETURNING config_data, updated_at, created_at
            """, (company_id, json.dumps(config_data), now_ist, now_ist))
            
            result_row = cur.fetchone()
            conn.commit()
            
            # Convert to IST for response
            updated_at_ist = result_row['updated_at'].astimezone(IST) if result_row['updated_at'] else None
            
            print(f"✅ Saved configuration for company {company_id} at {updated_at_ist}")
            
            # Broadcast to connected trackers (if WebSocket is available)
            try:
                broadcast_config_update(company_id, config_data)
            except Exception as broadcast_error:
                print(f"⚠️ Broadcast warning: {broadcast_error}")
            
            result = {
                'success': True,
                'message': 'Configuration saved successfully',
                'config': result_row['config_data'],
                'updated_at': updated_at_ist.isoformat() if updated_at_ist else None
            }
            
            return jsonify(result), 200
            
    except Exception as e:
        print(f"❌ Save configuration error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to save configuration'}), 500


# ============================================================================
# TRACKER CONFIGURATION SYNC (For tracker to get company settings)
# ============================================================================

@configuration_bp.route('/tracker/configuration', methods=['POST'])
def get_tracker_configuration():
    """
    Get configuration for tracker client based on company
    Used by tracker to sync settings dynamically
    
    Expected JSON:
    {
        "tracker_token": "base64_token",
        "member_email": "user@company.com"
    }
    
    Returns:
        {
            "success": true,
            "company_id": 1,
            "company_name": "Acme Corp",
            "configuration": {...}
        }
    """
    try:
        data = request.get_json()
        tracker_token = data.get('tracker_token')
        member_email = data.get('member_email')
        
        if not tracker_token:
            return jsonify({'error': 'Tracker token required'}), 401
        
        # Verify tracker token and get company_id
        from tracker_routes import verify_tracker_token
        company_id = verify_tracker_token(tracker_token)
        
        if not company_id:
            return jsonify({'error': 'Invalid tracker token'}), 401
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Verify company exists and is active
            cur.execute("""
                SELECT id, name as company_name, is_active 
                FROM companies 
                WHERE id = %s
            """, (company_id,))
            
            company = cur.fetchone()
            
            if not company or not company['is_active']:
                return jsonify({'error': 'Company not found or inactive'}), 404
            
            # Verify member exists if email provided
            if member_email:
                cur.execute("""
                    SELECT id, name as full_name, is_active 
                    FROM members 
                    WHERE company_id = %s AND email = %s
                """, (company_id, member_email))
                
                member = cur.fetchone()
                
                if not member:
                    return jsonify({'error': 'Member not found'}), 404
                
                if not member['is_active']:
                    return jsonify({'error': 'Member account is inactive'}), 403
            
            # Get company configuration
            cur.execute("""
                SELECT config_data, updated_at
                FROM configuration
                WHERE company_id = %s
            """, (company_id,))
            
            config_row = cur.fetchone()
            
            if not config_row:
                # Return default configuration
                config_data = {
                    'screenshot_interval_minutes': 10,
                    'idle_timeout_minutes': 5,
                    'office_start_time': '09:00:00',
                    'office_end_time': '18:00:00',
                    'working_days': [1, 2, 3, 4, 5],
                    'last_modified_at': None
                }
            else:
                config_data = config_row['config_data']
                updated_at_ist = config_row['updated_at'].astimezone(IST) if config_row.get('updated_at') else None
                config_data['last_modified_at'] = updated_at_ist.isoformat() if updated_at_ist else None
            
            print(f"✅ Configuration synced for company {company_id}")
            
            return jsonify({
                'success': True,
                'company_id': company_id,
                'company_name': company['company_name'],
                'configuration': config_data,
                'message': 'Configuration synced successfully'
            }), 200
            
    except Exception as e:
        print(f"❌ Tracker configuration sync error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to sync configuration'}), 500


# ============================================================================
# BROADCAST CONFIG UPDATE (WebSocket Support)
# ============================================================================

def broadcast_config_update(company_id, config_data):
    """
    Broadcast configuration update to all connected trackers for this company
    This is a placeholder - implement WebSocket broadcasting if needed
    """
    try:
        print(f"📡 Broadcasting config update to company {company_id} trackers")
        # TODO: Implement WebSocket broadcast if you have WebSocket support
        # Example:
        # from your_websocket_module import broadcast_to_company
        # broadcast_to_company(company_id, {
        #     'type': 'config_update',
        #     'config': config_data
        # })
        pass
    except Exception as e:
        print(f"⚠️ Broadcast error: {e}")


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = ['configuration_bp']
