from app.db.supabase_client import get_supabase

def sync_orphans():
    supabase = get_supabase()
    users_to_fix = [
        {'email': 'productor.elhatillo@gmail.com', 'nombre': 'Juan Productor El Hatillo', 'rol': 'PRODUCTOR'},
        {'email': 'empresa_1540dc@arcob2b.com', 'nombre': 'Cliente Demo B2B', 'rol': 'CLIENTE_EMPRESA'}
    ]
    
    auth_users = {u.email: u.id for u in supabase.auth.admin.list_users()}
    
    for u in users_to_fix:
        uid = auth_users.get(u['email'])
        if uid:
            print(f"Syncing {u['email']}...")
            try:
                # 1. Crear empresa
                emp_res = supabase.table('empresas').insert({
                    'nombre': f"Empresa de {u['nombre']}",
                    'nit_rfc': f"ID-{uid[:8].upper()}",
                    'tipo_personalidad': 'J',
                    'direccion_fiscal': 'Sede Miranda, Venezuela'
                }).execute()
                eid = emp_res.data[0]['id']
                
                # 2. Upsert Perfil
                supabase.table('perfiles').upsert({
                    'id': uid,
                    'empresa_id': eid,
                    'rol': u['rol'],
                    'nombre_completo': u['nombre']
                }).execute()
                print(f"OK: {u['email']} sincronizado.")
            except Exception as e:
                print(f"Error sincronizando {u['email']}: {e}")

if __name__ == "__main__":
    sync_orphans()
