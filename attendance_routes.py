"""
ATTENDANCE_ROUTES.PY - Complete Attendance Management System
=============================================================
✅ Punch in/out tracking with IST timestamps
✅ Daily attendance records with date-wise breakdown
✅ Attendance analytics (Daily/Weekly/Monthly views)
✅ Proper duration calculations from exact timestamps
✅ Configuration-based attendance calculation (office timings + working days)
✅ All timestamps in IST (Indian Standard Time)
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
        punch_date = punch_time_ist.date()
        
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
            
            # Check if already punched in today
            cur.execute("""
                SELECT id FROM punch_logs
                WHERE company_id = %s AND member_id = %s 
                  AND punch_date = %s AND punch_out_time IS NULL
            """, (company_id, member_id, punch_date))
            
            existing_punch = cur.fetchone()
            
            if existing_punch:
                return jsonify({'error': 'Already punched in today'}), 400
            
            # Create new punch log
            cur.execute("""
                INSERT INTO punch_logs (company_id, member_id, punch_date, punch_in_time, status)
                VALUES (%s, %s, %s, %s, 'punched_in')
                RETURNING id, punch_in_time
            """, (company_id, member_id, punch_date, punch_time_ist))
            
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
                'punch_in_time': punch_log['punch_in_time'].isoformat(),
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
        punch_date = punch_out_time_ist.date()
        
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
            
            # Find open punch log
            cur.execute("""
                SELECT id, punch_in_time FROM punch_logs
                WHERE company_id = %s AND member_id = %s 
                  AND punch_date = %s AND punch_out_time IS NULL
                ORDER BY punch_in_time DESC
                LIMIT 1
            """, (company_id, member_id, punch_date))
            
            punch_log = cur.fetchone()
            
            if not punch_log:
                return jsonify({'error': 'No active punch-in found for today'}), 400
            
            # Calculate duration in seconds
            punch_in_time = punch_log['punch_in_time']
            if punch_in_time.tzinfo is None:
                import pytz
                punch_in_time = pytz.UTC.localize(punch_in_time)
            punch_in_ist = punch_in_time.astimezone(IST)
            
            duration_seconds = int((punch_out_time_ist - punch_in_ist).total_seconds())
            
            # Update punch log
            cur.execute("""
                UPDATE punch_logs
                SET punch_out_time = %s, duration_seconds = %s, status = 'punched_out', updated_at = %s
                WHERE id = %s
                RETURNING id, punch_in_time, punch_out_time, duration_seconds
            """, (punch_out_time_ist, duration_seconds, punch_out_time_ist, punch_log['id']))
            
            updated_punch = cur.fetchone()
            
            # Update member status
            cur.execute("""
                UPDATE members
                SET is_punched_in = FALSE, last_punch_out_at = %s
                WHERE id = %s
            """, (punch_out_time_ist, member_id))
            
            conn.commit()
            
            # Format duration
            hours = duration_seconds // 3600
            minutes = (duration_seconds % 3600) // 60
            duration_str = f"{hours}h {minutes}m"
            
            return jsonify({
                'success': True,
                'message': 'Punched out successfully',
                'punch_id': updated_punch['id'],
                'punch_in_time': updated_punch['punch_in_time'].isoformat(),
                'punch_out_time': updated_punch['punch_out_time'].isoformat(),
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
    Shows: Name, Status, Current Punch In, Last Punch Out
    """
    try:
        company_id = request.company_id
        today = datetime.now(IST).date()
        
        with get_db() as conn:
            cur = conn.cursor()
            
            # Get all members with today's punch status
            cur.execute("""
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
                    m.last_heartbeat_at,
                    -- Today's total time from punch logs
                    COALESCE(SUM(
                        EXTRACT(EPOCH FROM (
                            COALESCE(pl.punch_out_time, NOW()) - pl.punch_in_time
                        ))
                    ), 0) as today_seconds
                FROM members m
                LEFT JOIN punch_logs pl 
                    ON pl.member_id = m.id 
                    AND pl.punch_date = %s
                    AND pl.company_id = %s
                WHERE m.company_id = %s 
                    AND m.is_active = TRUE
                GROUP BY m.id, m.name, m.email, m.position, m.department, 
                         m.status, m.is_punched_in, m.last_punch_in_at, 
                         m.last_punch_out_at, m.last_heartbeat_at
                ORDER BY m.name ASC
            """, (today, company_id, company_id))
            
            members = cur.fetchall()
            
            result = []
            for member in members:
                # Calculate status based on heartbeat
                status = member['status'] or 'offline'
                if member['last_heartbeat_at']:
                    last_heartbeat_ist = convert_to_ist(member['last_heartbeat_at'])
                    seconds_ago = (get_ist_now() - last_heartbeat_ist).total_seconds()
                    if seconds_ago < 60:
                        status = 'active'
                    elif seconds_ago < 300:
                        status = 'idle'
                    else:
                        status = 'offline'
                
                result.append({
                    'id': member['id'],
                    'name': member['name'],
                    'email': member['email'],
                    'position': member['position'] or '',
                    'department': member['department'] or '',
                    'status': status,
                    'is_punched_in': member['is_punched_in'],
                    'punch_in_time': convert_to_ist(member['last_punch_in_at']).isoformat() if member['last_punch_in_at'] else None,
                    'punch_out_time': convert_to_ist(member['last_punch_out_at']).isoformat() if member['last_punch_out_at'] else None,
                    'today_hours': round(member['today_seconds'] / 3600, 2) if member['today_seconds'] else 0
                })
            
            return jsonify({
                'success': True,
                'members': result,
                'date': today.isoformat()
            }), 200
            
    except Exception as e:
        print(f"❌ Get members attendance error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch attendance data'}), 500


# ============================================================================
# GET MEMBER ATTENDANCE HISTORY WITH DAILY BREAKDOWN
# ============================================================================

@attendance_bp.route('/api/attendance/member/<int:member_id>', methods=['GET'])
@require_admin_auth
def get_member_attendance_history(member_id):
    """
    Get detailed attendance history for a member with date-wise breakdown
    Query params:
    - start_date: Start date (YYYY-MM-DD), defaults to 30 days ago
    - end_date: End date (YYYY-MM-DD), defaults to today
    
    Returns daily summary table including absent days
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
            
            # Verify member belongs to company
            cur.execute("""
                SELECT id, name, email, position, department
                FROM members
                WHERE id = %s AND company_id = %s
            """, (member_id, company_id))
            
            member = cur.fetchone()
            if not member:
                return jsonify({'error': 'Member not found'}), 404
            
            # Get company configuration for working days
            cur.execute("""
                SELECT config_data FROM configuration WHERE company_id = %s
            """, (company_id,))
            
            config_row = cur.fetchone()
            working_days = [1, 2, 3, 4, 5]  # Default: Monday to Friday
            if config_row and 'working_days' in config_row['config_data']:
                working_days = config_row['config_data']['working_days']
            
            # Get punch logs for date range
            cur.execute("""
                SELECT 
                    punch_date,
                    MIN(punch_in_time) as first_punch_in,
                    MAX(punch_out_time) as last_punch_out,
                    SUM(duration_seconds) as total_duration_seconds,
                    status
                FROM punch_logs
                WHERE company_id = %s 
                    AND member_id = %s
                    AND punch_date BETWEEN %s AND %s
                GROUP BY punch_date, status
                ORDER BY punch_date DESC
            """, (company_id, member_id, start_date, end_date))
            
            punch_logs = cur.fetchall()
            
            # Create lookup for punch data by date
            punch_data = {}
            for log in punch_logs:
                punch_data[log['punch_date']] = log
            
            # Generate daily breakdown for entire date range
            daily_records = []
            current_date = start_date
            total_hours = 0
            days_present = 0
            
            while current_date <= end_date:
                day_of_week = current_date.weekday()  # 0 = Monday, 6 = Sunday
                day_name = calendar.day_name[day_of_week]
                
                # Check if this is a working day
                # Note: Python weekday() returns 0-6 (Mon-Sun), but our config uses 0=Sunday
                config_day = (day_of_week + 1) % 7
                is_working_day = config_day in working_days
                
                if current_date in punch_data:
                    log = punch_data[current_date]
                    
                    # Format punch times in IST
                    punch_in_ist = convert_to_ist(log['first_punch_in']) if log['first_punch_in'] else None
                    punch_out_ist = convert_to_ist(log['last_punch_out']) if log['last_punch_out'] else None
                    
                    # Calculate duration
                    duration_seconds = log['total_duration_seconds'] or 0
                    hours = int(duration_seconds // 3600)
                    minutes = int((duration_seconds % 3600) // 60)
                    duration_str = f"{hours}h {minutes}m"
                    
                    total_hours += duration_seconds / 3600
                    days_present += 1
                    
                    daily_records.append({
                        'date': current_date.isoformat(),
                        'day': day_name,
                        'punch_in': punch_in_ist.strftime('%I:%M %p') if punch_in_ist else 'NA',
                        'punch_out': punch_out_ist.strftime('%I:%M %p') if punch_out_ist else 'NA',
                        'duration': duration_str,
                        'duration_seconds': int(duration_seconds),
                        'is_working_day': is_working_day,
                        'status': 'Present'
                    })
                else:
                    # No punch record for this day
                    daily_records.append({
                        'date': current_date.isoformat(),
                        'day': day_name,
                        'punch_in': 'NA',
                        'punch_out': 'NA',
                        'duration': 'Unavailable',
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
                    'id': member['id'],
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
                    punch_date,
                    COUNT(*) as punch_count,
                    SUM(duration_seconds) / 3600.0 as total_hours
                FROM punch_logs
                WHERE company_id = %s 
                    AND member_id = %s
                    AND punch_date BETWEEN %s AND %s
                GROUP BY punch_date
                ORDER BY punch_date ASC
            """, (company_id, member_id, start_date, end_date))
            
            daily_data = cur.fetchall()
            
            # Format for charts based on view type
            if view_type == 'daily':
                result = []
                for record in daily_data:
                    date = record['punch_date']
                    hours = float(record['total_hours']) if record['total_hours'] else 0
                    
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
                weekly_chart = defaultdict(lambda: {'hours': 0, 'days': 0})
                
                for record in daily_data:
                    date = record['punch_date']
                    hours = float(record['total_hours']) if record['total_hours'] else 0
                    
                    # ISO week
                    week_key = f"{date.year}-W{date.isocalendar()[1]:02d}"
                    weekly_chart[week_key]['hours'] += hours
                    weekly_chart[week_key]['days'] += 1
                
                result = [
                    {
                        'week': week,
                        'total_hours': round(data['hours'], 2),
                        'days_present': data['days'],
                        'avg_hours_per_day': round(data['hours'] / data['days'], 2) if data['days'] > 0 else 0
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
                monthly_chart = defaultdict(lambda: {'hours': 0, 'days': 0})
                
                for record in daily_data:
                    date = record['punch_date']
                    hours = float(record['total_hours']) if record['total_hours'] else 0
                    
                    month_key = date.strftime('%Y-%m')
                    monthly_chart[month_key]['hours'] += hours
                    monthly_chart[month_key]['days'] += 1
                
                result = [
                    {
                        'month': month,
                        'total_hours': round(data['hours'], 2),
                        'days_present': data['days'],
                        'avg_hours_per_day': round(data['hours'] / data['days'], 2) if data['days'] > 0 else 0
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
