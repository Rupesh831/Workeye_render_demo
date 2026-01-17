"""
DB.PY - PostgreSQL Database Connection for WorkEye
===================================================
✅ Uses external Render PostgreSQL database
✅ Proper SSL connection configuration
✅ Connection pooling with psycopg2
✅ IST (Indian Standard Time) timezone support
✅ Compatible with all backend routes
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import pool
from contextlib import contextmanager
from datetime import datetime
import pytz

# ============================================================================
# TIMEZONE CONFIGURATION
# ============================================================================

IST = pytz.timezone('Asia/Kolkata')

def get_ist_now():
    """Get current time in IST"""
    return datetime.now(IST)

def convert_to_ist(utc_dt):
    """Convert UTC datetime to IST"""
    if utc_dt is None:
        return None
    if utc_dt.tzinfo is None:
        utc_dt = pytz.UTC.localize(utc_dt)
    return utc_dt.astimezone(IST)

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

# Use the external PostgreSQL database URL
DATABASE_URL = os.environ.get(
    'DATABASE_URL',
    'postgresql://work_eye_db_user:DeXsKDcQNO6rpdQypAjDECEjqRXVa8hr@dpg-d52ij3ali9vc73f8tn40-a.singapore-postgres.render.com/work_eye_db'
)

# Render uses postgres://, PostgreSQL requires postgresql://
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

print(f"🔗 Database: work_eye_db @ dpg-d52ij3ali9vc73f8tn40-a.singapore-postgres.render.com")

# ============================================================================
# CONNECTION POOL (for better performance)
# ============================================================================

connection_pool = None

def initialize_connection_pool():
    """Initialize the connection pool"""
    global connection_pool
    try:
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            1,  # minimum connections
            20,  # maximum connections
            DATABASE_URL,
            cursor_factory=RealDictCursor,
            sslmode='require'  # Required for Render PostgreSQL
        )
        print("✅ Database connection pool initialized")
        return True
    except Exception as e:
        print(f"❌ Failed to create connection pool: {e}")
        return False

# ============================================================================
# CONNECTION MANAGEMENT
# ============================================================================

def get_db_connection():
    """
    Get a database connection from the pool.
    If pool doesn't exist, create a direct connection.
    
    Usage:
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT * FROM users")
            result = cur.fetchall()
        finally:
            conn.close()
    """
    global connection_pool
    
    if connection_pool is None:
        # Fallback: create direct connection
        return psycopg2.connect(
            DATABASE_URL,
            cursor_factory=RealDictCursor,
            sslmode='require'
        )
    
    try:
        return connection_pool.getconn()
    except:
        # Fallback: create direct connection
        return psycopg2.connect(
            DATABASE_URL,
            cursor_factory=RealDictCursor,
            sslmode='require'
        )


def return_connection(conn):
    """Return a connection to the pool"""
    global connection_pool
    if connection_pool is not None:
        try:
            connection_pool.putconn(conn)
        except:
            conn.close()
    else:
        conn.close()


@contextmanager
def get_db():
    """
    Context manager for database connections.
    Auto-commits on success, rolls back on error.
    
    Usage:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("INSERT INTO users ...")
            # Auto-commit on exit
    """
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        return_connection(conn)


# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

def init_db():
    """
    Initialize database tables if they don't exist.
    This is safe to run multiple times - it only creates missing tables.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        print("🔧 Checking database schema...")
        
        # Check if companies table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'companies'
            )
        """)
        companies_exists = cur.fetchone()['exists']
        
        if not companies_exists:
            print("⚠️  Database tables not found. Please run init_db.py first.")
            conn.close()
            return False
        
        # Check companies table structure
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'companies'
            ORDER BY ordinal_position
        """)
        company_columns = [row['column_name'] for row in cur.fetchall()]
        print(f"✅ Companies table columns: {', '.join(company_columns)}")
        
        # Check users table (for admin authentication)
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            )
        """)
        users_exists = cur.fetchone()['exists']
        
        if users_exists:
            cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users'
                ORDER BY ordinal_position
            """)
            user_columns = [row['column_name'] for row in cur.fetchall()]
            print(f"✅ Users table columns: {', '.join(user_columns)}")
        else:
            print("⚠️  Users table not found - admin login may not work")
        
        # Check members table
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'members'
            )
        """)
        members_exists = cur.fetchone()['exists']
        
        if members_exists:
            cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'members'
                ORDER BY ordinal_position
            """)
            member_columns = [row['column_name'] for row in cur.fetchall()]
            print(f"✅ Members table columns: {', '.join(member_columns)}")
        
        # List all tables
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        all_tables = [row['table_name'] for row in cur.fetchall()]
        print(f"📊 Database tables: {', '.join(all_tables)}")
        
        conn.commit()
        print("✅ Database schema verified")
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Database initialization error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        cur.close()
        return_connection(conn)


# ============================================================================
# DATABASE HEALTH CHECK
# ============================================================================

def check_db_health():
    """
    Check if database connection is healthy.
    Returns True if connection is working, False otherwise.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1 as health_check")
        result = cur.fetchone()
        cur.close()
        return_connection(conn)
        
        if result and result['health_check'] == 1:
            return True
        return False
    except Exception as e:
        print(f"❌ Database health check failed: {e}")
        return False


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def execute_query(query, params=None):
    """
    Execute a query and return results.
    
    Args:
        query: SQL query string
        params: Query parameters tuple or dict
    
    Returns:
        Query results as list of dicts
    """
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(query, params or ())
        try:
            return cur.fetchall()
        except psycopg2.ProgrammingError:
            # No results to fetch (INSERT/UPDATE/DELETE)
            return None


def fetch_one(query, params=None):
    """
    Fetch a single row from database.
    
    Returns:
        Single row as dict or None
    """
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(query, params or ())
        return cur.fetchone()


def fetch_all(query, params=None):
    """
    Fetch all rows from database.
    
    Returns:
        List of dicts
    """
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(query, params or ())
        return cur.fetchall()


# ============================================================================
# INITIALIZATION ON MODULE LOAD
# ============================================================================

# Initialize connection pool when module is imported
initialize_connection_pool()

# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    'get_db_connection',
    'return_connection',
    'get_db',
    'init_db',
    'check_db_health',
    'execute_query',
    'fetch_one',
    'fetch_all',
    'IST',
    'get_ist_now',
    'convert_to_ist'
]
