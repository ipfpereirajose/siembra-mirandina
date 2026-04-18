from app.db.supabase_client import get_supabase
s = get_supabase()
r = s.table('produccion_productor').select('*, productos(nombre, unidad_medida), perfiles(nombre_completo)').execute()
for d in r.data[:8]:
    prod = d.get('productos') or {}
    perfil = d.get('perfiles') or {}
    print(f"{perfil.get('nombre_completo','?')[:25]} | {prod.get('nombre','?')[:20]} | {d['cantidad_disponible']} {d['unidad_medida']}")
print(f"\nTotal ofertas: {len(r.data)}")
# Check columns
if r.data:
    print("Columns:", list(r.data[0].keys()))
