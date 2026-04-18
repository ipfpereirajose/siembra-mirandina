import sys
import os
import uuid

# Asegurar que el path incluya la raíz para importar app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.db.supabase_client import get_supabase

def sync_production_users():
    supabase = get_supabase()
    
    users_data = [
        {"email": "productor@siembramirandina.com", "pass": "Productor@2026!", "rol": "PRODUCTOR", "nombre": "Juan Pérez Agricultor"},
        {"email": "cliente@siembramirandina.com", "pass": "Cliente@2026!", "rol": "CLIENTE_EMPRESA", "nombre": "María González Compradora"},
        {"email": "admin@siembramirandina.com", "pass": "Admin@2026!", "rol": "ADMINISTRADOR", "nombre": "Carlos Rodríguez"}
    ]

    print("--- Sincronizando Usuarios en Proyecto A ---")
    
    # Obtener lista de usuarios existentes vía Admin API
    all_users = supabase.auth.admin.list_users()
    email_to_id = {u.email: u.id for u in all_users}

    for u in users_data:
        print(f"\nProcesando {u['email']}...")
        
        target_id = email_to_id.get(u['email'])
        
        if not target_id:
            # Crear si no existe
            print("No encontrado. Creando usuario...")
            res = supabase.auth.admin.create_user({
                "email": u['email'],
                "password": u['pass'],
                "email_confirm": True,
                "user_metadata": {"nombre": u['nombre'], "rol": u['rol']}
            })
            target_id = res.user.id
        else:
            # Forzar actualización de password y metadatos si ya existe
            print(f"Encontrado (ID: {target_id}). Actualizando credenciales...")
            supabase.auth.admin.update_user_by_id(target_id, {
                "password": u['pass'],
                "user_metadata": {"nombre": u['nombre'], "rol": u['rol']}
            })

        # Asegurar perfil en la tabla de base de datos
        print("Sincronizando perfil en base de datos...")
        # Buscar empresa para este rol o crear una genérica
        nit_map = {
            "PRODUCTOR": "V-12345678-9",
            "CLIENTE_EMPRESA": "J-87654321-0",
            "ADMINISTRADOR": "G-99999999-9"
        }
        res_emp = supabase.table('empresas').select('id').eq('nit_rfc', nit_map[u['rol']]).execute()
        
        if res_emp.data:
            empresa_id = res_emp.data[0]['id']
        else:
            # Crear empresa si no existe
            emp_names = {
                "PRODUCTOR": "Finca La Esperanza",
                "CLIENTE_EMPRESA": "Comercializadora Gourmet",
                "ADMINISTRADOR": "Siembra Mirandina HQ"
            }
            res_new_emp = supabase.table('empresas').insert({
                "nombre": emp_names[u['rol']],
                "nit_rfc": nit_map[u['rol']],
                "tipo_personalidad": nit_map[u['rol']][0],
                "direccion_fiscal": "Sede Miranda, Venezuela",
                "telefono_contacto": "0412-0000000"
            }).execute()
            empresa_id = res_new_emp.data[0]['id']

        # Upsert Perfil
        supabase.table('perfiles').upsert({
            "id": target_id,
            "empresa_id": empresa_id,
            "rol": u['rol'],
            "nombre_completo": u['nombre'],
            "telefono": "0412-1112233"
        }).execute()

    print("\nOK: Depuracion de usuarios completada con exito.")

if __name__ == "__main__":
    sync_production_users()
