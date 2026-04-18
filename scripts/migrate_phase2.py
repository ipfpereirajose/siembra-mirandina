import os
from supabase import create_client, Client

url: str = os.getenv("SUPABASE_URL", "https://mspbptlfgalddeoowase.supabase.co")
key: str = os.getenv("SUPABASE_SERVICE_KEY", "")

# Usar service_key para evitar RLS
if not key:
    with open("C:/Users/Usuario/.gemini/antigravity/scratch/siembra_mirandina/.env") as f:
        for line in f:
            if line.startswith("SUPABASE_SERVICE_KEY"):
                key = line.split("=")[1].strip()
            if line.startswith("SUPABASE_URL"):
                url = line.split("=")[1].strip()

supabase: Client = create_client(url, key)

print("Iniciando Migración SQL Fase 2: Subasta y Pagos...")

sql_migration = """
-- 1. Añadir comprobante a la tabla base
ALTER TABLE pedidos_personalizados ADD COLUMN IF NOT EXISTS url_comprobante TEXT;

-- 2. Modificar constraint estado si existiese previamente para aceptar nuestra semantica ampliada (ignorando errores de sintaxis temporal para forzar strings)
-- Supabase check constraints usually need drop then recreate. We'll skip drop if not strictly needed or handle carefully if it's text.
-- Postgres usually allows inserting any string if there is no check. Assuming no strict enum type was enforced (as we saw earlier).

-- 3. Crear tabla transaccional productiva
CREATE TABLE IF NOT EXISTS aportes_productores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_personalizado_id UUID REFERENCES pedidos_personalizados(id) ON DELETE CASCADE,
    productor_id UUID REFERENCES perfiles(id),
    cantidad_aportada NUMERIC NOT NULL CHECK (cantidad_aportada > 0),
    estado TEXT DEFAULT 'PENDIENTE_CONFIRMACION',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar RLS Security Bypass en modo admin
ALTER TABLE aportes_productores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir full access" ON aportes_productores FOR ALL USING (true);
"""

# Ejecutar mediante el endpoint RPC de PostgREST
# Si no existe, podemos simular la tabla insertando y dejando que Supabase la autogenere con un seed, o llamando a RPC.
# Generalmente supabase-py no tiene `.rpc("ejecutar_sql")` nativo. 
from postgrest import APIError

print("Como supabase_py no puede ejecutar raw SQL sin una funcion RPC (exec_sql), probaremos si podemos llamar a un backend o informarlo en log para que el usuario o nosotros lo copiemos al SQL Editor.")

with open("C:/Users/Usuario/.gemini/antigravity/scratch/siembra_mirandina/scripts/schema_fase2.sql", "w", encoding="utf-8") as file:
    file.write(sql_migration)

print("SQL Generado en scripts/schema_fase2.sql")
