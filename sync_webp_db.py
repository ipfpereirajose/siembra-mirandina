from app.db.supabase_client import get_supabase

def sync_to_webp():
    supabase = get_supabase()
    print("Updating all product image URLs to .webp format...")
    
    products = supabase.table('productos').select('id, imagen_url').execute().data
    
    for p in products:
        if p['imagen_url'] and p['imagen_url'].endswith('.png'):
            new_url = p['imagen_url'].replace('.png', '.webp')
            print(f"  {p['imagen_url']} -> {new_url}")
            supabase.table('productos').update({'imagen_url': new_url}).eq('id', p['id']).execute()
    
    print("Done.")

if __name__ == "__main__":
    sync_to_webp()
