"""
DB.PY - Synchronous Database Layer with psycopg2
================================================
✅ psycopg2 ONLY (no SQLAlchemy)
✅ Synchronous connection per request
✅ PostgreSQL connection pooling via Render
✅ Production-ready for Render deployment
✅ IST (Indian Standard Time) support
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
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

DATABASE_URL = os.environ.get(
    'DATABASE_URL',
    'postgresql://postgres:password@localhost:5432/workeye'
)

# Render uses postgres://, PostgreSQL requires postgresql://
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

print(f"🔗 Database URL: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'local'}")

# ============================================================================
# CONNECTION MANAGEMENT
# ============================================================================

def get_db_connection():
    """
    Create a new database connection.
    
    Usage:
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT * FROM users")
            result = cur.fetchall()
        finally:
            conn.close()
    """
    return psycopg2.connect(
        DATABASE_URL,
        cursor_factory=RealDictCursor,
        sslmode='require'
    )


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
        conn.close()


# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

def init_db():
    """
    Initialize database tables.
    Call this on application startup.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Check if companies table exists with old schema
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'companies' AND column_name = 'company_username'
        """)
        
        if cur.fetchone():
            print("⚠️ Old schema detected. Run migrate_db.py to update schema.")
            print("   Database will work but some features may fail.")
            conn.close()
            return
        
        # Create companies table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS companies (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            );
        """)
        
        cur.execute("CREATE INDEX IF NOT EXISTS idx_company_username ON companies(username);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_company_active ON companies(is_active);")
        
        # Create configuration table (JSONB-based)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS configuration (
                id SERIAL PRIMARY KEY,
                company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                config_data JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(company_id)
            );
        """)
        
        cur.execute("CREATE INDEX IF NOT EXISTS idx_config_company ON configuration(company_id);")
        print("   ✅ configuration table created")
        
        # Create users table (admin accounts)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                role VARCHAR(50) DEFAULT 'admin',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            );
        """)
        
        cur.execute("CREATE INDEX IF NOT EXISTS idx_user_company ON users(company_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);")
        
        # Create members table (tracked employees)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS members (
                id SERIAL PRIMARY KEY,
                company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                device_id VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                position VARCHAR(100),
                department VARCHAR(100),
                status VARCHAR(50) DEFAULT 'offline',
                is_active BOOLEAN DEFAULT TRUE,
                is_punched_in BOOLEAN DEFAULT FALSE,
                tracker_token VARCHAR(500) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_activity TIMESTAMP,
                last_heartbeat_at TIMESTAMP,
                last_activity_at TIMESTAMP,
                last_punch_in_at TIMESTAMP,
                last_punch_out_at TIMESTAMP,
                UNIQUE(company_id, device_id)
            );
        """)
        
        cur.execute("CREATE INDEX IF NOT EXISTS idx_member_company ON members(company_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_member_device ON members(device_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_member_token ON members(tracker_token);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_member_email ON members(company_id, email);")
        
        # Create activity_logs table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS activity_logs (
                id SERIAL PRIMARY KEY,
                company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                device_id VARCHAR(255) NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                window_title TEXT,
                process_name VARCHAR(500),
                app_name VARCHAR(255),
                url TEXT,
                domain VARCHAR(255),
                is_idle BOOLEAN DEFAULT FALSE,
                is_locked BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                duration_seconds INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        cur.execute("CREATE INDEX IF NOT EXISTS idx_activity_company_time ON activity_logs(company_id, timestamp);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_activity_member_time ON activity_logs(member_id, timestamp);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_activity_app ON activity_logs(app_name);")
        
        # Create activity_log table (tracker data aggregation)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS activity_log (
                id SERIAL PRIMARY KEY,
                company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                device_id VARCHAR(255) NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                total_seconds NUMERIC(12, 2) DEFAULT 0,
                active_seconds NUMERIC(12, 2) DEFAULT 0,
                idle_seconds NUMERIC(12, 2) DEFAULT 0,
                locked_seconds NUMERIC(12, 2) DEFAULT 0,
                current_window TEXT,
                current_process VARCHAR(255),
                is_idle BOOLEAN DEFAULT FALSE,
                locked BOOLEAN DEFAULT FALSE,
                raw_payload JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        cur.execute("CREATE INDEX IF NOT EXISTS idx_activity_log_company ON activity_log(company_id, timestamp);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_activity_log_member ON activity_log(member_id, timestamp);")
        
        # Create screenshots table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS screenshots (
                id SERIAL PRIMARY KEY,
                company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                device_id VARCHAR(255) NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                tracking_date DATE NOT NULL,
                file_path VARCHAR(500),
                url TEXT,
                thumbnail_url TEXT,
                file_size INTEGER,
                width INTEGER,
                height INTEGER,
                screenshot_data TEXT,
                window_title TEXT,
                process_name VARCHAR(255),
                is_idle BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        cur.execute("CREATE INDEX IF NOT EXISTS idx_screenshot_company_time ON screenshots(company_id, timestamp);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_screenshot_member_time ON screenshots(member_id, timestamp);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_screenshot_tracking_date ON screenshots(tracking_date);")
        
        # Create punch_logs table (for attendance tracking)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS punch_logs (
                id SERIAL PRIMARY KEY,
                company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                punch_date DATE NOT NULL,
                punch_in_time TIMESTAMP,
                punch_out_time TIMESTAMP,
                duration_seconds INTEGER,
                status VARCHAR(50) DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        cur.execute("CREATE INDEX IF NOT EXISTS idx_punch_company_date ON punch_logs(company_id, punch_date);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_punch_member_date ON punch_logs(member_id, punch_date);")
        
        conn.commit()
        print("✅ Database tables initialized")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Database initialization error: {e}")
        raise
    finally:
        cur.close()
        conn.close()


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
        cur.execute("SELECT 1")
        cur.close()
        conn.close()
        return True
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
# EXPORTS
# ============================================================================

__all__ = [
    'get_db_connection',
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
