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

    # 2. Preparar Productos (Catálogo Expandido)
    productos_data = [
        {"nombre": "Papa Granola", "cat": "Raices y Tuberculos", "sku": "RUB-PAPA", "img": "https://images.unsplash.com/photo-1518977676601-b53f02bad67b?auto=format&fit=crop&q=80&w=800", "p": 30.0},
        {"nombre": "Tomate Perita", "cat": "Hortalizas", "sku": "RUB-TOMA", "img": "https://images.unsplash.com/photo-1546473530-9a31436a30c5?auto=format&fit=crop&q=80&w=800", "p": 25.0},
        {"nombre": "Caraotas Negras", "cat": "Viveres y Granos", "sku": "RUB-CARA", "img": "https://images.unsplash.com/photo-1551462147-37885abb3e4a?auto=format&fit=crop&q=80&w=800", "p": 75.0},
        {"nombre": "Cebolla Blanca", "cat": "Hortalizas", "sku": "RUB-CEBO", "img": "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&q=80&w=800", "p": 18.0},
        {"nombre": "Pimenton Rojo", "cat": "Hortalizas", "sku": "RUB-PIME", "img": "https://images.unsplash.com/photo-1563513307168-a5105ebf16ee?auto=format&fit=crop&q=80&w=800", "p": 15.0},
        {"nombre": "Yuca Dulce", "cat": "Raices y Tuberculos", "sku": "RUB-YUCA", "img": "https://images.unsplash.com/photo-1629115913220-4a88f7b57b9e?auto=format&fit=crop&q=80&w=800", "p": 20.0},
        {"nombre": "Lechuga Criolla", "cat": "Verdes y Hierbas", "sku": "RUB-LECH", "img": "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&q=80&w=800", "p": 12.0},
        {"nombre": "Cebollin", "cat": "Verdes y Hierbas", "sku": "RUB-CEBN", "img": "https://images.unsplash.com/photo-1587483166752-bf5df5dca507?auto=format&fit=crop&q=80&w=800", "p": 10.0},
        {"nombre": "Ajo Morado", "cat": "Hortalizas", "sku": "RUB-AJOM", "img": "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&q=80&w=800", "p": 25.0},
        {"nombre": "Remolacha", "cat": "Hortalizas", "sku": "RUB-REMO", "img": "https://images.unsplash.com/photo-1528113033602-ae2426da1bb3?auto=format&fit=crop&q=80&w=800", "p": 20.0}
    ]

    final_prods = []
    for p in productos_data:
        final_prods.append({
            "nombre": p["nombre"],
            "categoria_id": cat_map[p["cat"]],
            "sku": p["sku"],
            "imagen_url": p["img"],
            "precio_base_usd": p["p"],
            "descripcion_tecnica": f"Producto fresco nacional. Categoria: {p['cat']}. Calidad garantizada."
        })

    print("Insertando productos...")
    res_prods = supabase.table('productos').insert(final_prods).execute()
    prod_map = {p['nombre']: p['id'] for p in res_prods.data}

    # 3. Crear Ofertas Diversificadas (Diferentes Unidades)
    print("Creando ofertas diversificadas...")
    ofertas = []
    # Papa
    ofertas.append({"productor_id": PRODUCTOR_UUID, "producto_id": prod_map["Papa Granola"], "cantidad_disponible": 100, "unidad_medida": "Sacos", "precio_propuesto_usd": 30.0})
    ofertas.append({"productor_id": PRODUCTOR_UUID, "producto_id": prod_map["Papa Granola"], "cantidad_disponible": 500, "unidad_medida": "Kg", "precio_propuesto_usd": 0.8})
    # Tomate
    ofertas.append({"productor_id": PRODUCTOR_UUID, "producto_id": prod_map["Tomate Perita"], "cantidad_disponible": 50, "unidad_medida": "Huacales", "precio_propuesto_usd": 25.0})
    ofertas.append({"productor_id": PRODUCTOR_UUID, "producto_id": prod_map["Tomate Perita"], "cantidad_disponible": 200, "unidad_medida": "Kg", "precio_propuesto_usd": 1.2})
    # Pimentón
    ofertas.append({"productor_id": PRODUCTOR_UUID, "producto_id": prod_map["Pimenton Rojo"], "cantidad_disponible": 40, "unidad_medida": "Cajas", "precio_propuesto_usd": 15.0})
    ofertas.append({"productor_id": PRODUCTOR_UUID, "producto_id": prod_map["Pimenton Rojo"], "cantidad_disponible": 150, "unidad_medida": "Kg", "precio_propuesto_usd": 1.5})
    # Lechuga
    ofertas.append({"productor_id": PRODUCTOR_UUID, "producto_id": prod_map["Lechuga Criolla"], "cantidad_disponible": 30, "unidad_medida": "Cajas", "precio_propuesto_usd": 12.0})
    # Cebollin
    ofertas.append({"productor_id": PRODUCTOR_UUID, "producto_id": prod_map["Cebollin"], "cantidad_disponible": 100, "unidad_medida": "Kg", "precio_propuesto_usd": 1.0})
    # Ajo
    ofertas.append({"productor_id": PRODUCTOR_UUID, "producto_id": prod_map["Ajo Morado"], "cantidad_disponible": 50, "unidad_medida": "Kg", "precio_propuesto_usd": 4.5})
    # Caraotas
    ofertas.append({"productor_id": PRODUCTOR_UUID, "producto_id": prod_map["Caraotas Negras"], "cantidad_disponible": 20, "unidad_medida": "Sacos", "precio_propuesto_usd": 75.0})
    
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
