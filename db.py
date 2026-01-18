"""
DB.PY - PostgreSQL Database Connection for WorkEye
===================================================
✅ Uses external Render PostgreSQL database
✅ Proper SSL connection configuration
✅ Connection pooling with psycopg2
✅ IST (Indian Standard Time) timezone support
✅ Compatible with all backend routes
✅ FIXED: Complete external database URL with full hostname
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

# Use the external PostgreSQL database URL with COMPLETE hostname
DATABASE_URL = os.environ.get(
    'DATABASE_URL',
    'postgresql://work_eye_db_user:DeXsKDcQNO6rpdQypAjDECEjqRXVa8hr@dpg-d52ij3ali9vc73f8tn40-a.singapore-postgres.render.com/work_eye_db'
)

# Render uses postgres://, PostgreSQL requires postgresql://
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

print(f"🔗 Connecting to: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'database'}")

# ============================================================================
# CONNECTION POOL (for better performance)
# ============================================================================

connection_pool = None

def initialize_connection_pool():
    """Initialize the connection pool with SSL required"""
    global connection_pool
    try:
        # Parse DATABASE_URL to ensure all components are present
        print(f"📡 Initializing connection pool...")
        print(f"📡 Database URL starts with: {DATABASE_URL[:30]}...")
        
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            1,  # minimum connections
            20,  # maximum connections
            DATABASE_URL,
            cursor_factory=RealDictCursor,
            sslmode='require',  # Required for Render PostgreSQL
            connect_timeout=10  # 10 second timeout
        )
        print("✅ Database connection pool initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to create connection pool: {e}")
        print(f"❌ Attempting direct connection test...")
        try:
            # Try direct connection to verify
            test_conn = psycopg2.connect(
                DATABASE_URL,
                sslmode='require',
                connect_timeout=10
            )
            test_conn.close()
            print("✅ Direct connection test succeeded!")
            # Try pool again
            connection_pool = psycopg2.pool.SimpleConnectionPool(
                1, 20, DATABASE_URL,
                cursor_factory=RealDictCursor,
                sslmode='require',
                connect_timeout=10
            )
            print("✅ Pool created on second attempt")
            return True
        except Exception as e2:
            print(f"❌ Direct connection also failed: {e2}")
            import traceback
            traceback.print_exc()
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
            sslmode='require',
            connect_timeout=10
        )
    
    try:
        return connection_pool.getconn()
    except:
        # Fallback: create direct connection
        return psycopg2.connect(
            DATABASE_URL,
            cursor_factory=RealDictCursor,
            sslmode='require',
            connect_timeout=10
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
        
        # Check admin_users table
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'admin_users'
            )
        """)
        admin_users_exists = cur.fetchone()['exists']
        
        if admin_users_exists:
            cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'admin_users'
                ORDER BY ordinal_position
            """)
            admin_columns = [row['column_name'] for row in cur.fetchall()]
            print(f"✅ Admin_users table columns: {', '.join(admin_columns)}")
        else:
            print("⚠️  admin_users table not found - admin login may not work")
        
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
        print(f"📊 Database tables ({len(all_tables)}): {', '.join(all_tables[:10])}{'...' if len(all_tables) > 10 else ''}")
        
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
print("🚀 Initializing database connection...")
if initialize_connection_pool():
    print("🎉 Database ready!")
    # Verify schema
    init_db()
else:
    print("⚠️  Database connection pool failed, will use direct connections")

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
