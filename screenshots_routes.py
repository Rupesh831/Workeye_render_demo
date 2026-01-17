"""
SCREENSHOTS_ROUTES.PY - Screenshot Retrieval (Admin-Only)
==========================================================
✅ Secure company-scoped screenshot access
✅ Returns WebP screenshots with pagination
✅ Linked to member_id and admin_token
"""

from flask import Blueprint, request, jsonify, send_file
from admin_auth_routes import require_admin_auth
from db import get_db
from datetime import datetime, timedelta
from io import BytesIO

screenshots_bp = Blueprint('screenshots', __name__)

# ============================================================================
# GET SCREENSHOTS FOR MEMBER
# ============================================================================

@screenshots_bp.route('/api/screenshots/<int:member_id>', methods=['GET'])
@require_admin_auth
def get_member_screenshots(member_id):
    """
    Get screenshots for a specific member
    
    Security:
    - Admin JWT required
    - Only screenshots for admin's company
    - No cross-company access
    
    Query params:
    - date: Filter by date (YYYY-MM-DD), defaults to today
    - limit: Number of screenshots (default 20, max 100)
    - offset: Pagination offset (default 0)
    """
    try:
        company_id = request.company_id  # From JWT
        
        # Parse query parameters
        date_str = request.args.get('date')
        limit = min(int(request.args.get('limit', 20)), 100)
        offset = int(request.args.get('offset', 0))
        
        # Default to today if no date specified
        if date_str:
            try:
                filter_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        else:
            filter_date = datetime.utcnow().date()
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Verify member belongs to admin's company
            cur.execute(
                """
                SELECT id, name, email
                FROM members
                WHERE id = %s AND company_id = %s
                """,
                (member_id, company_id)
            )
            member = cur.fetchone()
            
            if not member:
                return jsonify({'error': 'Member not found'}), 404
            
            # Get total count
            cur.execute(
                """
                SELECT COUNT(*) as total
                FROM screenshots
                WHERE company_id = %s 
                  AND member_id = %s 
                  AND tracking_date = %s
                """,
                (company_id, member_id, filter_date)
            )
            total_count = cur.fetchone()['total']
            
            # Get screenshots (metadata only, no binary data yet)
            cur.execute(
                """
                SELECT 
                    id,
                    timestamp,
                    tracking_date,
                    file_size,
                    width,
                    height,
                    created_at
                FROM screenshots
                WHERE company_id = %s 
                  AND member_id = %s 
                  AND tracking_date = %s
                ORDER BY timestamp DESC
                LIMIT %s OFFSET %s
                """,
                (company_id, member_id, filter_date, limit, offset)
            )
            screenshots = cur.fetchall()
            
            # Format response
            result = []
            for screenshot in screenshots:
                result.append({
                    'id': screenshot['id'],
                    'timestamp': screenshot['timestamp'].isoformat(),
                    'tracking_date': screenshot['tracking_date'].isoformat(),
                    'file_size': screenshot['file_size'],
                    'width': screenshot['width'],
                    'height': screenshot['height'],
                    'url': f"/api/screenshots/image/{screenshot['id']}",
                    'created_at': screenshot['created_at'].isoformat() if screenshot['created_at'] else None
                })
            
            return jsonify({
                'success': True,
                'member': {
                    'id': member['id'],
                    'name': member['name'],
                    'email': member['email']
                },
                'screenshots': result,
                'pagination': {
                    'total': total_count,
                    'limit': limit,
                    'offset': offset,
                    'has_more': (offset + limit) < total_count
                }
            }), 200
    
    except Exception as e:
        print(f"❌ Get screenshots error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch screenshots'}), 500


# ============================================================================
# GET SINGLE SCREENSHOT IMAGE
# ============================================================================

@screenshots_bp.route('/api/screenshots/image/<int:screenshot_id>', methods=['GET'])
@require_admin_auth
def get_screenshot_image(screenshot_id):
    """
    Get actual screenshot image (WebP format)
    
    Security:
    - Admin JWT required
    - Verifies screenshot belongs to admin's company
    """
    try:
        company_id = request.company_id
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Get screenshot with company verification
            cur.execute(
                """
                SELECT screenshot_data, timestamp
                FROM screenshots
                WHERE id = %s AND company_id = %s
                """,
                (screenshot_id, company_id)
            )
            screenshot = cur.fetchone()
            
            if not screenshot:
                return jsonify({'error': 'Screenshot not found'}), 404
            
            if not screenshot['screenshot_data']:
                return jsonify({'error': 'Screenshot data missing'}), 404
            
            # Return WebP image
            return send_file(
                BytesIO(screenshot['screenshot_data']),
                mimetype='image/webp',
                as_attachment=False,
                download_name=f"screenshot_{screenshot_id}_{screenshot['timestamp'].strftime('%Y%m%d_%H%M%S')}.webp"
            )
    
    except Exception as e:
        print(f"❌ Get screenshot image error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch screenshot image'}), 500


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = ['screenshots_bp']
