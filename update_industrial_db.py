from app.db.supabase_client import get_supabase

def update_industrial_images():
    supabase = get_supabase()
    
    # Mapping of Categories to Images
    mapping = {
        'Herramientas Manuales': '/products/herramientas.png',
        'Maquinaria y Equipos Agrícolas': '/products/maquinaria.png',
        'Insumos Agrícolas (Consumibles)': '/products/insumos.png',
        'Materiales de Protección': '/products/proteccion.png',
        'Tecnología Agrícola': '/products/tecnologia.png'
    }
    
    # 1. Get Categories
    cats = supabase.table('categorias').select('id, nombre').execute().data
    cat_id_to_img = {c['id']: mapping[c['nombre']] for c in cats if c['nombre'] in mapping}
    
    # 2. Update products in those categories
    for cat_id, img_url in cat_id_to_img.items():
        print(f"Updating products in category ID {cat_id} with {img_url}...")
        supabase.table('productos').update({'imagen_url': img_url}).eq('categoria_id', cat_id).execute()

if __name__ == "__main__":
    update_industrial_images()
