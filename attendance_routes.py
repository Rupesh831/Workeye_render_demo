"""
ATTENDANCE_ROUTES.PY - Complete Attendance Management System
=============================================================
✅ Punch in/out tracking with IST timestamps
✅ Daily attendance records with date-wise breakdown
✅ Attendance analytics (Daily/Weekly/Monthly views)
✅ Proper duration calculations from exact timestamps
✅ Configuration-based attendance calculation (office timings + working days)
✅ All timestamps in IST (Indian Standard Time)
✅ FIXED: Compatible with existing punch_logs schema
"""

from flask import Blueprint, request, jsonify
from admin_auth_routes import require_admin_auth
from db import get_db, get_ist_now, convert_to_ist, IST
from datetime import datetime, timedelta, time
from collections import defaultdict
import calendar

attendance_bp = Blueprint('attendance', __name__)

# ============================================================================
# PUNCH IN / PUNCH OUT ENDPOINTS
# ============================================================================

@attendance_bp.route('/api/attendance/punch-in', methods=['POST'])
def punch_in():
    """
    Punch in for a member
    Records timestamp in IST
    """
    try:
        data = request.get_json()
        member_email = data.get('member_email')
        company_id = data.get('company_id')
        
        if not member_email or not company_id:
            return jsonify({'error': 'Member email and company ID required'}), 400
        
        punch_time_ist = get_ist_now()
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Get member
            cur.execute("""
                SELECT id, name FROM members
                WHERE company_id = %s AND email = %s AND is_active = TRUE
            """, (company_id, member_email))
            
            member = cur.fetchone()
            if not member:
                return jsonify({'error': 'Member not found or inactive'}), 404
            
            member_id = member['id']
            
            # Check if already punched in today (no punch-out yet)
            cur.execute("""
                SELECT id FROM punch_logs
                WHERE company_id = %s AND member_id = %s 
                  AND DATE(timestamp) = CURRENT_DATE 
                  AND action = 'punch_in'
                  AND NOT EXISTS (
                      SELECT 1 FROM punch_logs pl2 
                      WHERE pl2.member_id = punch_logs.member_id 
                        AND pl2.action = 'punch_out'
                        AND pl2.timestamp > punch_logs.timestamp
                        AND DATE(pl2.timestamp) = CURRENT_DATE
                  )
            """, (company_id, member_id))
            
            existing_punch = cur.fetchone()
            
            if existing_punch:
                return jsonify({'error': 'Already punched in today'}), 400
            
            # Create new punch log
            cur.execute("""
                INSERT INTO punch_logs (company_id, member_id, email, action, timestamp)
                VALUES (%s, %s, %s, 'punch_in', %s)
                RETURNING id, timestamp
            """, (company_id, member_id, member_email, punch_time_ist))
            
            punch_log = cur.fetchone()
            
            # Update member status
            cur.execute("""
                UPDATE members
                SET is_punched_in = TRUE, last_punch_in_at = %s, status = 'active'
                WHERE id = %s
            """, (punch_time_ist, member_id))
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Punched in successfully',
                'punch_id': punch_log['id'],
                'punch_in_time': punch_log['timestamp'].isoformat(),
                'member_name': member['name']
            }), 200
            
    except Exception as e:
        print(f"❌ Punch in error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to punch in'}), 500


@attendance_bp.route('/api/attendance/punch-out', methods=['POST'])
def punch_out():
    """
    Punch out for a member
    Calculates duration and closes punch log
    """
    try:
        data = request.get_json()
        member_email = data.get('member_email')
        company_id = data.get('company_id')
        
        if not member_email or not company_id:
            return jsonify({'error': 'Member email and company ID required'}), 400
        
        punch_out_time_ist = get_ist_now()
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Get member
            cur.execute("""
                SELECT id, name FROM members
                WHERE company_id = %s AND email = %s AND is_active = TRUE
            """, (company_id, member_email))
            
            member = cur.fetchone()
            if not member:
                return jsonify({'error': 'Member not found or inactive'}), 404
            
            member_id = member['id']
            
            # Find active punch-in (no corresponding punch-out yet)
            cur.execute("""
                SELECT id, timestamp FROM punch_logs
                WHERE company_id = %s AND member_id = %s 
                  AND action = 'punch_in'
                  AND DATE(timestamp) = CURRENT_DATE
                  AND NOT EXISTS (
                      SELECT 1 FROM punch_logs pl2 
                      WHERE pl2.member_id = punch_logs.member_id 
                        AND pl2.action = 'punch_out'
                        AND pl2.timestamp > punch_logs.timestamp
                        AND DATE(pl2.timestamp) = CURRENT_DATE
                  )
                ORDER BY timestamp DESC
                LIMIT 1
            """, (company_id, member_id))
            
            punch_log = cur.fetchone()
            
            if not punch_log:
                return jsonify({'error': 'No active punch-in found for today'}), 400
            
            # Calculate duration in minutes
            punch_in_time = punch_log['timestamp']
            if punch_in_time.tzinfo is None:
                import pytz
                punch_in_time = pytz.UTC.localize(punch_in_time)
            punch_in_ist = punch_in_time.astimezone(IST)
            
            duration_seconds = int((punch_out_time_ist - punch_in_ist).total_seconds())
            duration_minutes = duration_seconds // 60
            
            # Insert punch-out record
            cur.execute("""
                INSERT INTO punch_logs (company_id, member_id, email, action, timestamp, duration_minutes)
                VALUES (%s, %s, %s, 'punch_out', %s, %s)
                RETURNING id, timestamp
            """, (company_id, member_id, member_email, punch_out_time_ist, duration_minutes))
            
            punch_out_log = cur.fetchone()
            
            # Update member status
            cur.execute("""
                UPDATE members
                SET is_punched_in = FALSE, last_punch_out_at = %s
                WHERE id = %s
            """, (punch_out_time_ist, member_id))
            
            conn.commit()
            
            # Format duration
            hours = duration_minutes // 60
            minutes = duration_minutes % 60
            duration_str = f"{hours}h {minutes}m"
            
            return jsonify({
                'success': True,
                'message': 'Punched out successfully',
                'punch_out_id': punch_out_log['id'],
                'punch_in_time': punch_in_time.isoformat(),
                'punch_out_time': punch_out_log['timestamp'].isoformat(),
                'duration_minutes': duration_minutes,
                'duration_seconds': duration_seconds,
                'duration_formatted': duration_str,
                'member_name': member['name']
            }), 200
            
    except Exception as e:
        print(f"❌ Punch out error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to punch out'}), 500


# ============================================================================
# GET ALL MEMBERS ATTENDANCE STATUS
# ============================================================================

@attendance_bp.route('/api/attendance/members', methods=['GET'])
@require_admin_auth
def get_members_attendance():
    """
    Get current attendance status for all members
    Returns: list of members with their punch status and today's hours
    """
    try:
        company_id = request.company_id
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Get all active members with their today's attendance
            cur.execute("""
                WITH today_punch_data AS (
                    SELECT 
                        member_id,
                        MAX(CASE WHEN action = 'punch_in' THEN timestamp END) as last_punch_in,
                        MAX(CASE WHEN action = 'punch_out' THEN timestamp END) as last_punch_out,
                        SUM(CASE WHEN action = 'punch_out' THEN duration_minutes ELSE 0 END) as total_minutes
                    FROM punch_logs
                    WHERE company_id = %s 
                      AND DATE(timestamp) = CURRENT_DATE
                    GROUP BY member_id
                )
                SELECT 
                    m.id,
                    m.name,
                    m.email,
                    m.position,
                    m.department,
                    m.status,
                    m.is_punched_in,
                    m.last_punch_in_at,
                    m.last_punch_out_at,
                    COALESCE(tpd.last_punch_in, m.last_punch_in_at) as punch_in_time,
                    COALESCE(tpd.last_punch_out, m.last_punch_out_at) as punch_out_time,
                    COALESCE(tpd.total_minutes, 0) as today_minutes
                FROM members m
                LEFT JOIN today_punch_data tpd ON m.id = tpd.member_id
                WHERE m.company_id = %s AND m.is_active = TRUE
                ORDER BY m.name
            """, (company_id, company_id))
            
            members = cur.fetchall()
            
            members_list = []
            for member in members:
                # Calculate today's hours
                today_hours = float(member['today_minutes']) / 60.0 if member['today_minutes'] else 0.0
                
                # If currently punched in, add time from last punch-in to now
                if member['is_punched_in'] and member['punch_in_time']:
                    now = get_ist_now()
                    punch_in = member['punch_in_time']
                    if punch_in.tzinfo is None:
                        import pytz
                        punch_in = pytz.UTC.localize(punch_in)
                    punch_in_ist = punch_in.astimezone(IST)
                    current_session_seconds = (now - punch_in_ist).total_seconds()
                    today_hours += current_session_seconds / 3600.0
                
                members_list.append({
                    'id': member['id'],
                    'name': member['name'],
                    'email': member['email'],
                    'position': member['position'],
                    'department': member['department'],
                    'status': member['status'],
                    'is_punched_in': member['is_punched_in'],
                    'punch_in_time': member['punch_in_time'].isoformat() if member['punch_in_time'] else None,
                    'punch_out_time': member['punch_out_time'].isoformat() if member['punch_out_time'] else None,
                    'today_hours': round(today_hours, 2)
                })
            
            return jsonify({
                'success': True,
                'members': members_list
            }), 200
            
    except Exception as e:
        print(f"❌ Get members attendance error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch attendance data'}), 500


# ============================================================================
# GET MEMBER ATTENDANCE HISTORY (DATE RANGE)
# ============================================================================

@attendance_bp.route('/api/attendance/member/<int:member_id>', methods=['GET'])
@require_admin_auth
def get_member_attendance(member_id):
    """
    Get detailed attendance history for a specific member
    Returns daily breakdown with punch in/out times
    
    Query params:
    - start_date: Start date (YYYY-MM-DD)
    - end_date: End date (YYYY-MM-DD)
    """
    try:
        company_id = request.company_id
        
        # Parse date range
        end_date_str = request.args.get('end_date')
        start_date_str = request.args.get('start_date')
        
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = datetime.now(IST).date()
        
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = end_date - timedelta(days=30)
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Verify member
            cur.execute("""
                SELECT name, email, position, department FROM members
                WHERE id = %s AND company_id = %s
            """, (member_id, company_id))
            
            member = cur.fetchone()
            if not member:
                return jsonify({'error': 'Member not found'}), 404
            
            # Get configuration for working days
            cur.execute("""
                SELECT working_days, office_start_time, office_end_time
                FROM company_configurations
                WHERE company_id = %s
            """, (company_id,))
            
            config = cur.fetchone()
            working_days = config['working_days'] if config and config['working_days'] else [1, 2, 3, 4, 5]
            
            # Get punch logs for date range
            cur.execute("""
                SELECT 
                    DATE(timestamp) as date,
                    action,
                    timestamp,
                    duration_minutes
                FROM punch_logs
                WHERE company_id = %s 
                  AND member_id = %s
                  AND DATE(timestamp) BETWEEN %s AND %s
                ORDER BY timestamp
            """, (company_id, member_id, start_date, end_date))
            
            punch_logs = cur.fetchall()
            
            # Group by date
            daily_data = defaultdict(lambda: {'punch_ins': [], 'punch_outs': [], 'total_minutes': 0})
            
            for log in punch_logs:
                date_key = log['date']
                if log['action'] == 'punch_in':
                    daily_data[date_key]['punch_ins'].append(log['timestamp'])
                elif log['action'] == 'punch_out':
                    daily_data[date_key]['punch_outs'].append(log['timestamp'])
                    if log['duration_minutes']:
                        daily_data[date_key]['total_minutes'] += log['duration_minutes']
            
            # Build daily records
            daily_records = []
            total_hours = 0
            days_present = 0
            
            current_date = start_date
            while current_date <= end_date:
                is_working_day = current_date.weekday() in working_days
                
                if current_date in daily_data:
                    data = daily_data[current_date]
                    first_punch_in = min(data['punch_ins']) if data['punch_ins'] else None
                    last_punch_out = max(data['punch_outs']) if data['punch_outs'] else None
                    
                    hours = data['total_minutes'] / 60.0
                    total_hours += hours
                    
                    if first_punch_in:
                        days_present += 1
                    
                    daily_records.append({
                        'date': current_date.isoformat(),
                        'day': calendar.day_name[current_date.weekday()],
                        'punch_in': first_punch_in.strftime('%H:%M:%S') if first_punch_in else 'N/A',
                        'punch_out': last_punch_out.strftime('%H:%M:%S') if last_punch_out else 'N/A',
                        'duration': f"{int(hours)}h {int((hours % 1) * 60)}m",
                        'duration_seconds': data['total_minutes'] * 60,
                        'is_working_day': is_working_day,
                        'status': 'Present' if first_punch_in else ('Absent' if is_working_day else 'Holiday/Weekend')
                    })
                else:
                    daily_records.append({
                        'date': current_date.isoformat(),
                        'day': calendar.day_name[current_date.weekday()],
                        'punch_in': 'N/A',
                        'punch_out': 'N/A',
                        'duration': '0h 0m',
                        'duration_seconds': 0,
                        'is_working_day': is_working_day,
                        'status': 'Absent' if is_working_day else 'Holiday/Weekend'
                    })
                
                current_date += timedelta(days=1)
            
            # Calculate statistics
            total_days = (end_date - start_date).days + 1
            working_days_count = sum(1 for r in daily_records if r['is_working_day'])
            avg_hours_per_day = total_hours / days_present if days_present > 0 else 0
            attendance_percentage = (days_present / working_days_count * 100) if working_days_count > 0 else 0
            
            return jsonify({
                'success': True,
                'member': {
                    'id': member_id,
                    'name': member['name'],
                    'email': member['email'],
                    'position': member['position'],
                    'department': member['department']
                },
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                },
                'statistics': {
                    'total_days': total_days,
                    'working_days': working_days_count,
                    'days_present': days_present,
                    'days_absent': working_days_count - days_present,
                    'attendance_percentage': round(attendance_percentage, 2),
                    'total_hours': round(total_hours, 2),
                    'average_hours_per_day': round(avg_hours_per_day, 2)
                },
                'daily_records': daily_records
            }), 200
            
    except Exception as e:
        print(f"❌ Get member attendance history error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch attendance history'}), 500


# ============================================================================
# GET ATTENDANCE ANALYTICS (DAILY/WEEKLY/MONTHLY VIEWS)
# ============================================================================

@attendance_bp.route('/api/attendance/analytics/<int:member_id>', methods=['GET'])
@require_admin_auth
def get_attendance_analytics(member_id):
    """
    Get attendance analytics for charts
    Returns daily, weekly, and monthly aggregated data
    
    Query params:
    - view: 'daily', 'weekly', or 'monthly' (default: 'daily')
    - start_date: Start date (YYYY-MM-DD)
    - end_date: End date (YYYY-MM-DD)
    """
    try:
        company_id = request.company_id
        view_type = request.args.get('view', 'daily').lower()
        
        # Parse date range
        end_date_str = request.args.get('end_date')
        start_date_str = request.args.get('start_date')
        
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = datetime.now(IST).date()
        
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            # Default based on view type
            if view_type == 'monthly':
                start_date = end_date - timedelta(days=365)
            elif view_type == 'weekly':
                start_date = end_date - timedelta(days=90)
            else:
                start_date = end_date - timedelta(days=30)
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Verify member
            cur.execute("""
                SELECT name FROM members
                WHERE id = %s AND company_id = %s
            """, (member_id, company_id))
            
            member = cur.fetchone()
            if not member:
                return jsonify({'error': 'Member not found'}), 404
            
            # Get daily punch data
            cur.execute("""
                SELECT 
                    DATE(timestamp) as punch_date,
                    SUM(CASE WHEN action = 'punch_out' THEN duration_minutes ELSE 0 END) as total_minutes
                FROM punch_logs
                WHERE company_id = %s 
                    AND member_id = %s
                    AND DATE(timestamp) BETWEEN %s AND %s
                GROUP BY DATE(timestamp)
                ORDER BY DATE(timestamp) ASC
            """, (company_id, member_id, start_date, end_date))
            
            daily_data = cur.fetchall()
            
            # Format for charts based on view type
            if view_type == 'daily':
                result = []
                for record in daily_data:
                    date = record['punch_date']
                    hours = float(record['total_minutes']) / 60.0 if record['total_minutes'] else 0
                    
                    result.append({
                        'date': date.isoformat(),
                        'hours': round(hours, 2),
                        'day_name': calendar.day_name[date.weekday()]
                    })
                
                return jsonify({
                    'success': True,
                    'view': 'daily',
                    'member_name': member['name'],
                    'data': result
                }), 200
            
            elif view_type == 'weekly':
                weekly_chart = defaultdict(lambda: {'minutes': 0, 'days': 0})
                
                for record in daily_data:
                    date = record['punch_date']
                    minutes = float(record['total_minutes']) if record['total_minutes'] else 0
                    
                    # ISO week
                    week_key = f"{date.year}-W{date.isocalendar()[1]:02d}"
                    weekly_chart[week_key]['minutes'] += minutes
                    weekly_chart[week_key]['days'] += 1
                
                result = [
                    {
                        'week': week,
                        'total_hours': round(data['minutes'] / 60.0, 2),
                        'days_present': data['days'],
                        'avg_hours_per_day': round((data['minutes'] / 60.0) / data['days'], 2) if data['days'] > 0 else 0
                    }
                    for week, data in sorted(weekly_chart.items())
                ]
                
                return jsonify({
                    'success': True,
                    'view': 'weekly',
                    'member_name': member['name'],
                    'data': result
                }), 200
            
            elif view_type == 'monthly':
                monthly_chart = defaultdict(lambda: {'minutes': 0, 'days': 0})
                
                for record in daily_data:
                    date = record['punch_date']
                    minutes = float(record['total_minutes']) if record['total_minutes'] else 0
                    
                    month_key = date.strftime('%Y-%m')
                    monthly_chart[month_key]['minutes'] += minutes
                    monthly_chart[month_key]['days'] += 1
                
                result = [
                    {
                        'month': month,
                        'total_hours': round(data['minutes'] / 60.0, 2),
                        'days_present': data['days'],
                        'avg_hours_per_day': round((data['minutes'] / 60.0) / data['days'], 2) if data['days'] > 0 else 0
                    }
                    for month, data in sorted(monthly_chart.items())
                ]
                
                return jsonify({
                    'success': True,
                    'view': 'monthly',
                    'member_name': member['name'],
                    'data': result
                }), 200
            
            else:
                return jsonify({'error': 'Invalid view type. Use: daily, weekly, or monthly'}), 400
            
    except Exception as e:
        print(f"❌ Get attendance analytics error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch attendance analytics'}), 500


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = ['attendance_bp']
