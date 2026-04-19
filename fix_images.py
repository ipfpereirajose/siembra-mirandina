import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.db.supabase_client import get_supabase

def get_default_image_for_category(cat_nombre: str) -> str:
    if not cat_nombre:
        return "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=800"
    cat_nombre = cat_nombre.lower()
    mapping_img = {
        "hortalizas": "https://images.unsplash.com/photo-1595856728068-07bf1227f2dd?auto=format&fit=crop&q=80&w=800",
        "tubérculos": "https://images.unsplash.com/photo-1596701041177-3e284a1d48c9?auto=format&fit=crop&q=80&w=800",
        "frutas": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=800",
        "leguminosas": "https://images.unsplash.com/photo-1551462147-37885abb3e4a?auto=format&fit=crop&q=80&w=800",
        "raices y tuberculos": "https://images.unsplash.com/photo-1596701041177-3e284a1d48c9?auto=format&fit=crop&q=80&w=800",
        "viveres y granos": "https://images.unsplash.com/photo-1551462147-37885abb3e4a?auto=format&fit=crop&q=80&w=800",
        "verdes y hierbas": "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&q=80&w=800"
    }
    for key, img in mapping_img.items():
        if key in cat_nombre:
            return img
    return "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=800"


def main():
    supabase = get_supabase()
    
    # Obtener productos que no tienen imagen
    res = supabase.table('productos').select('id, nombre, categorias(nombre)').execute()
    
    n_updated = 0
    for p in res.data:
        if not p.get('imagen_url') or str(p.get('imagen_url')).strip() == "None":
            cat = p['categorias']['nombre'] if p.get('categorias') else ""
            img = get_default_image_for_category(cat)
            
            supabase.table('productos').update({'imagen_url': img}).eq('id', p['id']).execute()
            n_updated += 1
            print(f"[{p['nombre']}] -> Image updated (Category: {cat})")
            
    print(f"Proceso finalizado. Total imágenes inyectadas retroactivamente: {n_updated}")

if __name__ == "__main__":
    main()
