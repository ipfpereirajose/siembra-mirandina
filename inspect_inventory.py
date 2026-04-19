from app.db.supabase_client import get_supabase

def check_inventory():
    supabase = get_supabase()
    
    print("--- PRODUCTOS ---")
    p = supabase.table('productos').select('id, nombre').execute()
    for item in p.data:
        print(f"Producto: {item['nombre']} ({item['id']})")
        
    print("\n--- INVENTARIO ---")
    i = supabase.table('inventario').select('*').execute()
    for item in i.data:
        print(f"ProdID: {item['producto_id']} | Stock: {item['stock_disponible']}")
        
    print("\n--- PRODUCCION PRODUCTOR ---")
    pp = supabase.table('produccion_productor').select('*').execute()
    for item in pp.data:
        print(f"Productor: {item['productor_id']} | ProdID: {item['producto_id']} | Cant: {item['cantidad_disponible']}")

if __name__ == "__main__":
    check_inventory()
