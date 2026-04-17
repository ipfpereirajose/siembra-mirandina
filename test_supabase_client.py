import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_KEY missing in .env")
    exit(1)

print(f"Testing connection to: {url}")

try:
    supabase: Client = create_client(url, key)
    response = supabase.table("productos").select("*").limit(1).execute()
    print("SUCCESS: Connection to Supabase REST API established.")
    print(f"Items found in 'productos': {len(response.data) if response.data else 0}")
    if response.data:
        print(f"First item name: {response.data[0].get('nombre', 'N/A')}")
except Exception as e:
    print(f"FAILURE: Could not connect or query Supabase.")
    print(f"Error details: {str(e)}")
