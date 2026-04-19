from app.db.supabase_client import get_supabase

def update_images():
    supabase = get_supabase()
    
    # Mapping of product name keywords to image URLs
    mapping = {
        'Papa': '/products/papa.png',
        'Tomate': '/products/tomate.png',
        'Cebolla': '/products/cebolla.png',
        'Caraotas': '/products/caraota.png',
        'Pimenton': '/products/pimenton.png',
        'Yuca': '/products/yuca.png',
        'Lechuga': '/products/lechuga.png',
        'Cebollin': '/products/cebollin.png',
        'Ajo': '/products/ajo.png',
        'Remolacha': '/products/remolacha.png'
    }
    
    products = supabase.table('productos').select('id, nombre').execute().data
    
    for p in products:
        for keyword, url in mapping.items():
            if keyword in p['nombre']:
                print(f"Updating {p['nombre']} with {url}...")
                supabase.table('productos').update({'imagen_url': url}).eq('id', p['id']).execute()
                break

if __name__ == "__main__":
    update_images()
