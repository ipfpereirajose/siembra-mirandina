import sys
import os
import uuid

# Asegurar que el path incluya la raíz para importar app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.db.supabase_client import get_supabase

def seed_catalog():
    supabase = get_supabase()
    
    # Obtener el UUID del Productor oficial dinamicamente
    productor_res = supabase.table('perfiles').select('id').eq('rol', 'PRODUCTOR').execute()
    if not productor_res.data:
        print("Error: No se encontro ningun usuario con rol PRODUCTOR en la tabla perfiles.")
        print("Por favor ejecuta primero seed_production_users.py")
        return
    PRODUCTOR_UUID = productor_res.data[0]['id']
    
    print("Limpiando datos antiguos en Proyecto A...")
    try:
        supabase.table('notificaciones').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        supabase.table('pedidos_personalizados').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        supabase.table('produccion_productor').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        supabase.table('inventario').delete().neq('producto_id', '00000000-0000-0000-0000-000000000000').execute()
        supabase.table('productos').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        supabase.table('categorias').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        # No borramos perfiles ni empresas para no romper la integridad de los usuarios ya registrados
    except Exception as e:
        print(f"Aviso limpieza: {e}")

    # 1. Insertar Categorías
    print("Insertando categorias...")
    cats = [
        {"nombre": "Raices y Tuberculos", "descripcion": "Papas, Yuca, etc."},
        {"nombre": "Hortalizas", "descripcion": "Tomates, Cebollas, Pimenton."},
        {"nombre": "Viveres y Granos", "descripcion": "Caraotas, Frijoles."},
        {"nombre": "Verdes y Hierbas", "descripcion": "Lechuga, Cilantro."}
    ]
    res_cats = supabase.table('categorias').insert(cats).execute()
    cat_map = {c['nombre']: c['id'] for c in res_cats.data}

    # 2. Preparar Productos (Catálogo Expandido y Dividido por Unidades)
    productos_data = [
        {"nombre": "Papa Granola (Saco 40kg)", "cat": "Raices y Tuberculos", "sku": "RUB-PAPA-SAC", "img": "https://images.unsplash.com/photo-1518977676601-b53f02bad67b?auto=format&fit=crop&q=80&w=800", "p": 30.0, "unidad": "Sacos"},
        {"nombre": "Papa Granola (Detal)", "cat": "Raices y Tuberculos", "sku": "RUB-PAPA-KG", "img": "https://images.unsplash.com/photo-1518977676601-b53f02bad67b?auto=format&fit=crop&q=80&w=800", "p": 0.8, "unidad": "Kg"},
        
        {"nombre": "Tomate Perita (Huacal 30kg)", "cat": "Hortalizas", "sku": "RUB-TOMA-HUA", "img": "https://images.unsplash.com/photo-1546473530-9a31436a30c5?auto=format&fit=crop&q=80&w=800", "p": 25.0, "unidad": "Huacales"},
        {"nombre": "Tomate Perita (Detal)", "cat": "Hortalizas", "sku": "RUB-TOMA-KG", "img": "https://images.unsplash.com/photo-1546473530-9a31436a30c5?auto=format&fit=crop&q=80&w=800", "p": 1.2, "unidad": "Kg"},
        
        {"nombre": "Caraotas Negras (Saco 50kg)", "cat": "Viveres y Granos", "sku": "RUB-CARA-SAC", "img": "https://images.unsplash.com/photo-1551462147-37885abb3e4a?auto=format&fit=crop&q=80&w=800", "p": 75.0, "unidad": "Sacos"},
        {"nombre": "Caraotas Negras (Detal)", "cat": "Viveres y Granos", "sku": "RUB-CARA-KG", "img": "https://images.unsplash.com/photo-1551462147-37885abb3e4a?auto=format&fit=crop&q=80&w=800", "p": 1.7, "unidad": "Kg"},
        
        {"nombre": "Cebolla Blanca (Saco 20kg)", "cat": "Hortalizas", "sku": "RUB-CEBO-MALLA", "img": "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&q=80&w=800", "p": 18.0, "unidad": "Sacos"},
        {"nombre": "Cebolla Blanca (Detal)", "cat": "Hortalizas", "sku": "RUB-CEBO-KG", "img": "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&q=80&w=800", "p": 1.0, "unidad": "Kg"},
        
        {"nombre": "Pimenton Rojo (Caja 15kg)", "cat": "Hortalizas", "sku": "RUB-PIME-CAJA", "img": "https://images.unsplash.com/photo-1563513307168-a5105ebf16ee?auto=format&fit=crop&q=80&w=800", "p": 15.0, "unidad": "Cajas"},
        {"nombre": "Pimenton Rojo (Detal)", "cat": "Hortalizas", "sku": "RUB-PIME-KG", "img": "https://images.unsplash.com/photo-1563513307168-a5105ebf16ee?auto=format&fit=crop&q=80&w=800", "p": 1.5, "unidad": "Kg"},
        
        {"nombre": "Yuca Dulce (Saco 40kg)", "cat": "Raices y Tuberculos", "sku": "RUB-YUCA-SAC", "img": "https://images.unsplash.com/photo-1629115913220-4a88f7b57b9e?auto=format&fit=crop&q=80&w=800", "p": 20.0, "unidad": "Sacos"},
        {"nombre": "Lechuga Criolla (Caja)", "cat": "Verdes y Hierbas", "sku": "RUB-LECH-CEST", "img": "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&q=80&w=800", "p": 12.0, "unidad": "Cajas"},
        {"nombre": "Cebollin (Kilo)", "cat": "Verdes y Hierbas", "sku": "RUB-CEBN", "img": "https://images.unsplash.com/photo-1587483166752-bf5df5dca507?auto=format&fit=crop&q=80&w=800", "p": 1.0, "unidad": "Kg"},
        {"nombre": "Ajo Morado (Kilo)", "cat": "Hortalizas", "sku": "RUB-AJOM", "img": "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&q=80&w=800", "p": 4.5, "unidad": "Kg"},
        {"nombre": "Remolacha (Saco 30kg)", "cat": "Hortalizas", "sku": "RUB-REMO", "img": "https://images.unsplash.com/photo-1528113033602-ae2426da1bb3?auto=format&fit=crop&q=80&w=800", "p": 20.0, "unidad": "Sacos"}
    ]

    final_prods = []
    for p in productos_data:
        final_prods.append({
            "nombre": p["nombre"],
            "categoria_id": cat_map[p["cat"]],
            "sku": p["sku"],
            "imagen_url": p["img"],
            "precio_base_usd": p["p"],
            "unidad_medida": p["unidad"],
            "descripcion_tecnica": f"Producto fresco nacional. Categoria: {p['cat']}. Calidad garantizada. Venta por: {p['unidad']}."
        })

    print("Insertando productos...")
    res_prods = supabase.table('productos').insert(final_prods).execute()
    prod_map = {p['nombre']: p['id'] for p in res_prods.data}

    # 3. Crear Ofertas Diversificadas (Asociar Productor con Producto)
    print("Creando ofertas a base de productos...")
    ofertas = []
    for prod in res_prods.data:
        ofertas.append({
            "productor_id": PRODUCTOR_UUID, 
            "producto_id": prod["id"], 
            "cantidad_disponible": 100 if "Kg" not in prod["unidad_medida"] else 500, 
            "unidad_medida": prod["unidad_medida"], 
            "precio_propuesto_usd": prod["precio_base_usd"]
        })
    
    supabase.table('produccion_productor').insert(ofertas).execute()

    # 4. Sincronizar Inventario Base (Utilizando UPSERT para evitar duplicados por el Trigger)
    print("Sincronizando inventario central...")
    inv_data = []
    for prod in res_prods.data:
        inv_data.append({
            "producto_id": prod["id"],
            "stock_disponible": 150.0,
            "umbral_alerta": 10.0
        })
    supabase.table('inventario').upsert(inv_data).execute()

    print("OK: Catalogo expandido y UI verificado exitosamente.")

if __name__ == "__main__":
    seed_catalog()
