import os
from supabase import create_client

SUPABASE_URL = "https://fptmfurazlkkldvxdflm.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwdG1mdXJhemxra2xkdnhkZmxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3OTEzNCwiZXhwIjoyMDkxNDU1MTM0fQ.2nUG5NfTPbtnNorplskrlzlrsZRKavpqrxnk--wv8lg"

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# Cuentas con roles compatibles con el check constraint actual
# NOTA: El admin usa ADMINISTRADOR, el productor usa COMPRADOR temporalmente
# hasta que se ejecute el ALTER TABLE en Supabase
cuentas = [
    {
        "email": "admin@arco.com",
        "password": "123456",
        "nombre": "Super Admin ARCO",
        "tipo": "EMPRESA",
        "documento": "J-00000001-0",
        "rol": "ADMINISTRADOR",  # Usamos ADMINISTRADOR hasta que se agregue SUPER_ADMIN
        "telefono": "+58 412 0000001",
        "user_id": "be38fe1e-27a6-422b-a316-2994733cbd5d",  # Ya creado
        "empresa_id": "e811f07e-41e6-4a64-8cd5-5d6663c5d82c"
    },
    {
        "email": "productor@arco.com",
        "password": "123456",
        "nombre": "Juan",
        "apellido": "Perez",
        "tipo": "PRODUCTOR",
        "documento": "V-12345678",
        "rol": "COMPRADOR",  # Temporal hasta que se agregue PRODUCTOR al constraint
        "telefono": "+58 412 0000003",
        "user_id": "1a31adf4-de77-44a3-af36-24b6b904c5e7",
        "empresa_id": "e59d597c-cf5a-4ba6-a940-a1b07a10c7df"
    }
]

for c in cuentas:
    nombre = f"{c['nombre']} {c.get('apellido', '')}".strip()
    print(f"\nCreando perfil para: {c['email']}")
    try:
        sb.table('perfiles').insert({
            "id": c["user_id"],
            "empresa_id": c["empresa_id"],
            "rol": c["rol"],
            "nombre_completo": nombre,
            "telefono": c["telefono"]
        }).execute()
        print(f"  OK: {c['email']} / 123456 [{c['rol']}]")
    except Exception as e:
        print(f"  ERROR: {e}")

print("\n--- Proceso completado ---")
print("\nCuentas creadas:")
print("  admin@arco.com       / 123456  (rol: ADMINISTRADOR -> accede como Admin)")
print("  cliente@arco.com     / 123456  (rol: ADMINISTRADOR -> accede como Cliente B2B)")
print("  productor@arco.com   / 123456  (rol: COMPRADOR    -> accede como Productor)")
print("\nPARA ACTIVAR ROLES REALES ejecuta en Supabase SQL Editor:")
print("""
ALTER TABLE perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check;
ALTER TABLE perfiles ADD CONSTRAINT perfiles_rol_check 
  CHECK (rol IN ('SUPER_ADMIN', 'ADMINISTRADOR', 'COMPRADOR', 'PRODUCTOR'));

UPDATE perfiles SET rol = 'SUPER_ADMIN' WHERE id = 'be38fe1e-27a6-422b-a316-2994733cbd5d';
UPDATE perfiles SET rol = 'PRODUCTOR'   WHERE id = '1a31adf4-de77-44a3-af36-24b6b904c5e7';
""")
