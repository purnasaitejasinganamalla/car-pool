import os
import psycopg2

# Manual .env parser
def load_env(env_path):
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    os.environ[key.strip()] = val.strip()

dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_env(dotenv_path)

db_uri = os.environ.get("SUPABASE_DB_URI")
if not db_uri:
    print("Error: SUPABASE_DB_URI is not set in environment variables.")
    exit(1)

print(f"Connecting to database...")
try:
    conn = psycopg2.connect(db_uri)
    conn.autocommit = True
    cursor = conn.cursor()
    
    print("Executing migrations for rideschedules...")
    cursor.execute("""
        ALTER TABLE "rideschedules" 
        ADD COLUMN IF NOT EXISTS "vehicleType" TEXT DEFAULT 'Car',
        ADD COLUMN IF NOT EXISTS "vehicleModel" TEXT DEFAULT '';
    """)
    
    print("Executing migrations for rideposts...")
    cursor.execute("""
        ALTER TABLE "rideposts" 
        ADD COLUMN IF NOT EXISTS "vehicleType" TEXT DEFAULT 'Car',
        ADD COLUMN IF NOT EXISTS "vehicleModel" TEXT DEFAULT '';
    """)
    
    print("Migration completed successfully!")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Migration failed: {e}")
    exit(1)
