from app.db.supabase_client import get_supabase

def check_rls():
    supabase = get_supabase()
    # Querying metadata is hard via the postgrest client, 
    # but we can try to fetch inventario as a "ghost" user (no headers).
    
    print("--- Fetching as ADMIN (with headers) ---")
    admin_headers = { 'x-user-id': '00000000-0000-0000-0000-000000000000', 'x-empresa-id': '00000000-0000-0000-0000-000000000000' }
    # Note: the mock context treats this as admin in some places if we hardcoded it.
    # But for Supabase RLS, it depends on the JWT.
    
    # Actually, the best way to verify RLS is to see if we can get data.
    res = supabase.table('inventario').select('*').limit(1).execute()
    print(f"Data found: {len(res.data) > 0}")

if __name__ == "__main__":
    check_rls()
