import psycopg2
import sys

regions = [
    "ap-south-1",      # Mumbai
    "ap-southeast-1",  # Singapore
    "ap-southeast-2",  # Sydney
    "ap-northeast-1",  # Tokyo
    "ap-northeast-2",  # Seoul
    "us-east-1",       # N. Virginia
    "us-east-2",       # Ohio
    "us-west-1",       # N. California
    "us-west-2",       # Oregon
    "eu-west-1",       # Ireland
    "eu-west-2",       # London
    "eu-west-3",       # Paris
    "eu-central-1",    # Frankfurt
    "sa-east-1",       # Sao Paulo
    "ca-central-1"     # Canada Central
]

project_id = "bjdpfsgfyjmdpioxcgpm"
password = "Purna_2007_sai"

for r in regions:
    host = f"aws-0-{r}.pooler.supabase.com"
    dsn = f"postgresql://postgres.{project_id}:{password}@{host}:6543/postgres"
    print(f"Testing region {r} ({host})...")
    try:
        conn = psycopg2.connect(dsn, connect_timeout=3)
        print(f"--> SUCCESS! Connected to region: {r}")
        conn.close()
        sys.exit(0)
    except psycopg2.OperationalError as e:
        err_msg = str(e)
        if "tenant/user postgres.bjdpfsgfyjmdpioxcgpm not found" in err_msg:
            print("  Host resolved, but tenant not found here.")
        else:
            print(f"  Connection error: {err_msg.strip()}")
    except Exception as e:
        print(f"  Error: {e}")

print("None of the tested regions succeeded.")
