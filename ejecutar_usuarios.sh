#!/bin/bash
"""
Script para ejecutar la creación de usuarios de prueba
"""

echo "🌱 Siembra Mirandina - Ejecución de Usuarios de Prueba"
echo "=================================================="

# Configurar variables de entorno
export SUPABASE_URL="https://mspbptlfgalddeoowase.supabase.co"
export SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcGJwdGxmZ2FsZGRlb293YXNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg0OTIyMywiZXhwIjoyMDg5NDI1MjIzfQ.ezIiJxLlanXv_6-KRetdJZ8rDFDz-QpFE6FLkHOh0bU"

echo "📊 Variables de entorno configuradas"
echo "🔐 URL: $SUPABASE_URL"
echo "🔑 KEY: ${SUPABASE_SERVICE_KEY:0:20}..."

# Ejecutar el script
echo ""
echo "🔄 Ejecutando script de creación de usuarios..."
python crear_usuarios_prueba.py

echo ""
echo "✅ Proceso completado"
