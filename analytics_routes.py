"""
ANALYTICS_ROUTES.PY - Advanced Analytics (Synchronous + psycopg2)
==================================================================
✅ psycopg2 ONLY
✅ Member-specific analytics
✅ PostgreSQL aggregations
"""

from flask import Blueprint, request, jsonify
from auth_routes import require_auth
from db import get_db
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)

# ============================================================================
# MEMBER ANALYTICS
# ============================================================================

@analytics_bp.route('/analytics/member/<int:member_id>', methods=['GET'])
@require_auth
def get_member_analytics(member_id):
    """Get detailed analytics for a specific member"""
    try:
        company_id = request.company_id
        start_date = request.args.get('start_date', (datetime.utcnow() - timedelta(days=30)).isoformat())
        end_date = request.args.get('end_date', datetime.utcnow().isoformat())
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Verify member belongs to company
            cur.execute(
                "SELECT id, name, email FROM members WHERE id = %s AND company_id = %s",
                (member_id, company_id)
            )
            member = cur.fetchone()
            
            if not member:
                return jsonify({'error': 'Member not found'}), 404
            
            # Total activity stats
            cur.execute(
                """
                SELECT 
                    COUNT(*) as total_activities,
                    COALESCE(SUM(duration_seconds), 0) / 3600.0 as total_hours,
                    COUNT(DISTINCT DATE(timestamp)) as active_days
                FROM activity_logs
                WHERE member_id = %s 
                  AND timestamp >= %s 
                  AND timestamp <= %s
                """,
                (member_id, start_date, end_date)
            )
            stats = cur.fetchone()
            
            # Top apps
            cur.execute(
                """
                SELECT 
                    app_name,
                    COUNT(*) as count,
                    COALESCE(SUM(duration_seconds), 0) / 3600.0 as hours
                FROM activity_logs
                WHERE member_id = %s 
                  AND timestamp >= %s 
                  AND timestamp <= %s
                  AND app_name IS NOT NULL
                GROUP BY app_name
                ORDER BY hours DESC
                LIMIT 10
                """,
                (member_id, start_date, end_date)
            )
            top_apps = cur.fetchall()
            
            # Daily activity
            cur.execute(
                """
                SELECT 
                    DATE(timestamp) as date,
                    COUNT(*) as activity_count,
                    COALESCE(SUM(duration_seconds), 0) / 3600.0 as hours
                FROM activity_logs
                WHERE member_id = %s 
                  AND timestamp >= %s 
                  AND timestamp <= %s
                GROUP BY date
                ORDER BY date
                """,
                (member_id, start_date, end_date)
            )
            daily_activity = cur.fetchall()
            
            return jsonify({
                'success': True,
                'member': member,
                'stats': stats,
                'top_apps': top_apps,
                'daily_activity': daily_activity
            }), 200
    
    except Exception as e:
        print(f"❌ Member analytics error: {e}")
        return jsonify({'error': 'Failed to fetch member analytics'}), 500


# ============================================================================
# PRODUCTIVITY TRENDS
# ============================================================================

@analytics_bp.route('/analytics/productivity-trends', methods=['GET'])
@require_auth
def get_productivity_trends():
    """Get productivity trends over time"""
    try:
        company_id = request.company_id
        days = int(request.args.get('days', 30))
        start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
        
        with get_db() as conn:
            cur = conn.cursor()
            
            cur.execute(
                """
                SELECT 
                    DATE(timestamp) as date,
                    COUNT(DISTINCT member_id) as active_members,
                    COUNT(*) as total_activities,
                    COALESCE(SUM(duration_seconds), 0) / 3600.0 as total_hours,
                    COALESCE(AVG(duration_seconds), 0) as avg_duration_seconds
                FROM activity_logs
                WHERE company_id = %s 
                  AND timestamp >= %s
                GROUP BY date
                ORDER BY date
                """,
                (company_id, start_date)
            )
            trends = cur.fetchall()
            
            return jsonify({
                'success': True,
                'trends': trends
            }), 200
    
    except Exception as e:
        print(f"❌ Productivity trends error: {e}")
        return jsonify({'error': 'Failed to fetch productivity trends'}), 500


# ============================================================================
# APPLICATION USAGE
# ============================================================================

@analytics_bp.route('/analytics/app-usage', methods=['GET'])
@require_auth
def get_app_usage():
    """Get application usage breakdown"""
    try:
        company_id = request.company_id
        start_date = request.args.get('start_date', (datetime.utcnow() - timedelta(days=7)).isoformat())
        end_date = request.args.get('end_date', datetime.utcnow().isoformat())
        
        with get_db() as conn:
            cur = conn.cursor()
            
            cur.execute(
                """
                SELECT 
                    app_name,
                    COUNT(*) as usage_count,
                    COUNT(DISTINCT member_id) as unique_users,
                    COALESCE(SUM(duration_seconds), 0) / 3600.0 as total_hours,
                    COALESCE(AVG(duration_seconds), 0) as avg_duration_seconds
                FROM activity_logs
                WHERE company_id = %s 
                  AND timestamp >= %s 
                  AND timestamp <= %s
                  AND app_name IS NOT NULL
                GROUP BY app_name
                ORDER BY total_hours DESC
                """,
                (company_id, start_date, end_date)
            )
            apps = cur.fetchall()
            
            return jsonify({
                'success': True,
                'apps': apps
            }), 200
    
    except Exception as e:
        print(f"❌ App usage error: {e}")
        return jsonify({'error': 'Failed to fetch app usage'}), 500
