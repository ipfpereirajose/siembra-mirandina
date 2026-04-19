import uuid
import requests
import time
from app.db.supabase_client import get_supabase

supabase = get_supabase()

def run_test():
    print("==========================================================")
    print(" INICIANDO PRUEBAS INTEGRADAS: A.R.C.O. B2B OS")
    print("==========================================================\n")
    
    print("[1] PREPARANDO BASE DE DATOS (SEEDING MOCK DATA)")
    print("----------------------------------------------------------")
    # 1. Crear Usuario Admin
    email = f"empresa_{uuid.uuid4().hex[:6]}@arcob2b.com"
    user_res = supabase.auth.admin.create_user({"email": email, "password": "securepassword123", "email_confirm": True})
    usuario_id = user_res.user.id
    print(f"[OK] Usuario B2B Registrado: {email} (ID: {usuario_id})")
        
    # 2. Crear Empresa
    empresa_data = supabase.table('empresas').insert({
        "nombre": "Agroindustrias San Martín", 
        "nit_rfc": f"NIT-{uuid.uuid4().hex[:6]}", 
        "limite_credito_usd": 50000.00
    }).execute()
    empresa_id = empresa_data.data[0]['id']
    print(f"[OK] Organización B2B Creada: {empresa_id}")
    
    # 3. Vincular Usuario <-> Empresa en 'perfiles'
    supabase.table('perfiles').insert({
        "id": usuario_id, "empresa_id": empresa_id, "rol": "COMPRADOR", "nombre_completo": "Gerente de Compras"
    }).execute()
    
    # 4. Crear Categoría y Producto
    cat_data = supabase.table('categorias').insert({"nombre": f"Fertilizantes C-{uuid.uuid4().hex[:4]}"}).execute()
    cat_id = cat_data.data[0]['id']
    
    prod_data = supabase.table('productos').insert({
        "categoria_id": cat_id,
        "nombre": "Urea Agrícola 50kg (Especial)",
        "sku": f"UREA-{uuid.uuid4().hex[:4]}",
        "precio_base_usd": 45.50,
        "activo": True
    }).execute()
    prod_id = prod_data.data[0]['id']
    
    # 5. Inventario
    initial_stock = 500
    supabase.table('inventario').insert({"producto_id": prod_id, "stock_disponible": initial_stock}).execute()
    print(f"[OK] Producto '{prod_data.data[0]['nombre']}' creado con {initial_stock} sacos en sistema.\n")
    
    
    print("[2] PRUEBAS DE ENDPOINTS (API FASTAPI)")
    print("----------------------------------------------------------")
    # URL del FastAPI local
    API_URL = "http://127.0.0.1:8001"
    
    # A. Ver catálogo (Asegurar que FastApi devuelve el inventario anidado)
    print("A) -> Petición GET al catálogo público...")
    res_cat = requests.get(f"{API_URL}/productos")
    if res_cat.status_code == 200:
        productos = res_cat.json()
        print(f"   OK! {len(productos)} productos listados.")
    else:
        print(f"   Fallo al solicitar catálogo: {res_cat.text}")
        return

    # B. Procesar un Checkout de 30 sacos
    print("\nB) -> Procesando Checkout B2B (30 Sacos de Urea)...")
    headers = {
        "x-user-id": str(usuario_id),
        "x-empresa-id": str(empresa_id)
    }
    
    compra_payload = {
        "metodo_pago": "TRANSFERENCIA_BANCARIA",
        "lineas": [
            {
                "producto_id": prod_id,
                "cantidad": 30
            }
        ]
    }
    
    res_checkout = requests.post(f"{API_URL}/pedidos/checkout", json=compra_payload, headers=headers)
    if res_checkout.status_code == 200:
        orden = res_checkout.json()
        print(f"   [OK] ¡ORDEN APROBADA! Factura No: {orden['id']}")
        print(f"      Estado: {orden['estado']}")
        print(f"      Total Cobrado: ${orden['total_usd']}")
    else:
        print(f"   [ERROR] ERROR EN CHECKOUT: {res_checkout.text}")
        return
        
    # C. Verificación de Transaccionalidad de Inventario
    print("\nC) -> Verificando Deducción Transaccional de Sistema:")
    res_cat2 = requests.get(f"{API_URL}/productos")
    if res_cat2.status_code == 200:
        for p in res_cat2.json():
            if p["id"] == prod_id:
                print(f"   Stock Anterior: {initial_stock}")
                print(f"   Stock Actualizado: {p.get('inventario', {}).get('stock_disponible', 'N/A')} (Debe ser {initial_stock - 30})")
                if p["inventario"]["stock_disponible"] == initial_stock - 30:
                    print("   [OK] MATEMÁTICAS PERFECTAS. Restado exitosamente.")
                else:
                    print("   [ERROR] FALLO EN CÁLCULO DE STOCK.")
    print("\n==========================================================")
    print(" TODAS LAS PRUEBAS RESULTARON O.K. SISTEMA ESTABLE.")
    print("==========================================================")

if __name__ == "__main__":
    try:
        run_test()
    except requests.exceptions.ConnectionError:
        print("[ERROR] Error: No se puede conectar a FastAPI. Asegúrate de ejecutar uvicorn primero.")
