import sys
import os
import uuid

# Asegurar que el path incluya la raíz para importar app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.db.supabase_client import get_supabase

def seed_catalog():
    supabase = get_supabase()
    
    # UUID del productor creado en Supabase Auth
    PRODUCTOR_UUID = "795962f5-6d62-4405-b6fa-c1635242119b"
    
    print("Limpiando datos antiguos...")
    try:
        supabase.table('notificaciones').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        supabase.table('pedidos_personalizados').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        supabase.table('produccion_productor').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        supabase.table('inventario').delete().neq('producto_id', '00000000-0000-0000-0000-000000000000').execute()
        supabase.table('productos').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        supabase.table('categorias').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        supabase.table('perfiles').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        supabase.table('empresas').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    except Exception as e:
        print(f"Aviso limpieza: {e}")

    # 1. Crear Empresa
    print("Creando empresa base...")
    emp_res = supabase.table('empresas').insert({
        "nombre": "Agropecuaria Mirandina C.A.",
        "nit_rfc": "J-31245678-0",
        "tipo_personalidad": "J",
        "direccion_fiscal": "Valle del Tuy, Estado Miranda",
        "telefono_contacto": "0412-5555555"
    }).execute()
    empresa_id = emp_res.data[0]['id']

    # 2. Crear Perfil de Productor
    print("Creando perfil de productor...")
    supabase.table('perfiles').insert({
        "id": PRODUCTOR_UUID,
        "empresa_id": empresa_id,
        "rol": "PRODUCTOR",
        "nombre_completo": "Juan Productor Miranda",
        "telefono": "0414-1112233"
    }).execute()

    # 3. Insertar Categorías
    print("Insertando categorias...")
    cats = [
        {"nombre": "Raices y Tuberculos", "descripcion": "Papas, Yuca, etc."},
        {"nombre": "Hortalizas", "descripcion": "Tomates, Cebollas, Pimenton."},
        {"nombre": "Viveres y Granos", "descripcion": "Caraotas, Frijoles."},
        {"nombre": "Verdes y Hierbas", "descripcion": "Lechuga, Cilantro."}
    ]
    res_cats = supabase.table('categorias').insert(cats).execute()
    cat_map = {c['nombre']: c['id'] for c in res_cats.data}

    # 4. Preparar Productos
    productos_data = [
        {"nombre": "Papa Granola", "cat": "Raices y Tuberculos", "sku": "RUB-PAPA", "img": "https://images.unsplash.com/photo-1518977676601-b53f02bad67b?auto=format&fit=crop&q=80&w=800", "p": 30.0},
        {"nombre": "Tomate Perita", "cat": "Hortalizas", "sku": "RUB-TOMA", "img": "https://images.unsplash.com/photo-1546473530-9a31436a30c5?auto=format&fit=crop&q=80&w=800", "p": 25.0},
        {"nombre": "Caraotas Negras", "cat": "Viveres y Granos", "sku": "RUB-CARA", "img": "https://images.unsplash.com/photo-1551462147-37885abb3e4a?auto=format&fit=crop&q=80&w=800", "p": 75.0},
        {"nombre": "Cebolla Blanca", "cat": "Hortalizas", "sku": "RUB-CEBO", "img": "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&q=80&w=800", "p": 18.0}
    ]

    final_prods = []
    for p in productos_data:
        final_prods.append({
            "nombre": p["nombre"],
            "categoria_id": cat_map[p["cat"]],
            "sku": p["sku"],
            "imagen_url": p["img"],
            "precio_base_usd": p["p"],
            "descripcion_tecnica": f"Producto fresco de exportacion. Categoria: {p['cat']}"
        })

    print("Insertando productos...")
    res_prods = supabase.table('productos').insert(final_prods).execute()
    prod_map = {p['nombre']: p['id'] for p in res_prods.data}

    # 5. Crear Ofertas Diversificadas (Diferentes Unidades)
    print("Creando ofertas diversificadas (Sacos vs Kg)...")
    ofertas = [
        # PAPA
        {"productor_id": PRODUCTOR_UUID, "producto_id": prod_map["Papa Granola"], "cantidad_disponible": 100, "unidad_medida": "Sacos", "precio_propuesto_usd": 30.0},
        {"productor_id": PRODUCTOR_UUID, "producto_id": prod_map["Papa Granola"], "cantidad_disponible": 500, "unidad_medida": "Kg", "precio_propuesto_usd": 0.8},
        # TOMATE
        {"productor_id": PRODUCTOR_UUID, "producto_id": prod_map["Tomate Perita"], "cantidad_disponible": 50, "unidad_medida": "Huacales", "precio_propuesto_usd": 25.0},
        {"productor_id": PRODUCTOR_UUID, "producto_id": prod_map["Tomate Perita"], "cantidad_disponible": 200, "unidad_medida": "Kg", "precio_propuesto_usd": 1.2},
        # CARAOTAS
        {"productor_id": PRODUCTOR_UUID, "producto_id": prod_map["Caraotas Negras"], "cantidad_disponible": 20, "unidad_medida": "Sacos", "precio_propuesto_usd": 75.0},
        {"productor_id": PRODUCTOR_UUID, "producto_id": prod_map["Caraotas Negras"], "cantidad_disponible": 100, "unidad_medida": "Kg", "precio_propuesto_usd": 1.6}
    ]
    supabase.table('produccion_productor').insert(ofertas).execute()

    print("OK: Seeding completo. Productos, Empresa, Perfil e Inventario sincronizados.")

if __name__ == "__main__":
    seed_catalog()
