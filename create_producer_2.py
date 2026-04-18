import os
from app.db.supabase_client import get_supabase
import uuid

def main():
    supabase = get_supabase()
    
    # 1. Crear Empresa
    try:
        empresa_data = {
            "nombre": "Agropecuaria El Hatillo",
            "nit_rfc": "J-50000001-2",
            "tipo_personalidad": "J",
            "direccion_fiscal": "El Hatillo, Miranda",
            "telefono_contacto": "0412-5555555",
            "activo": True
        }
        res_emp = supabase.table('empresas').insert(empresa_data).execute()
        empresa_id = res_emp.data[0]['id']
        print(f"Empresa creada: {empresa_id}")
    except Exception as e:
        print("Empresa ya existia, buscandola...")
        res_emp = supabase.table('empresas').select('id').eq('nit_rfc', 'J-50000001-2').execute()
        empresa_id = res_emp.data[0]['id']
        
    # 2. Registrar Usuario Auth
    email = "productor.elhatillo@gmail.com"
    password = "Password123!"
    
    try:
        # First sign up the user
        auth_res = supabase.auth.sign_up({"email": email, "password": password})
        user_id = auth_res.user.id
        print(f"Usuario Auth creado: {user_id}")
    except Exception as e:
        print(f"Auth error (maybe user exists?): {e}")
        # Try to find user in perfiles
        res_perfil = supabase.table('perfiles').select('id').eq('nombre_completo', 'Carlos Hatillo').execute()
        if res_perfil.data:
            user_id = res_perfil.data[0]['id']
            print(f"Usuario encontrado en perfiles: {user_id}")
        else:
            print("No se pudo resolver el Auth. Cancelando.")
            return

    # 3. Crear Perfil
    try:
        perfil_data = {
            "id": user_id,
            "empresa_id": empresa_id,
            "rol": "PRODUCTOR",
            "nombre_completo": "Carlos Hatillo",
            "telefono": "0412-5555555"
        }
        supabase.table('perfiles').insert(perfil_data).execute()
        print("Perfil de Productor Creado!")
    except Exception as e:
        print("Perfil ya existia.")
    
    # 4. Asignarle productos al productor2
    # Buscamos Tomate(Kg) y Cebolla(Kg) para q compita con el productor 1
    productos_res = supabase.table('productos').select('id, nombre, unidad_medida').ilike('nombre', '%Detal%').execute()
    
    ofertas = []
    for p in productos_res.data:
        ofertas.append({
            "productor_id": user_id,
            "producto_id": p['id'],
            "cantidad_disponible": 300,
            "cantidad_en_venta": 150,
            "esta_en_venta": True,
            "unidad_medida": p['unidad_medida'],
            "precio_propuesto_usd": 1.2
        })
        
    supabase.table('produccion_productor').insert(ofertas).execute()
    print(f"Insertados {len(ofertas)} productos iniciales para ventas para {email}")
    print(f"Credentials:\nUsuario: {email}\nClave: {password}")

if __name__ == "__main__":
    main()
