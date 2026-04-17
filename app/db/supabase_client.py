import os
from supabase import create_client, Client
from app.core.config import get_settings

settings = get_settings()

# Inicializa el cliente global.
# Usamos el SERVICE_KEY para tener permisos de backend (bypass RLS localmente o hacer operaciones de admin)
# Para acciones a nombre del usuario, usaremos el token del usuario posteriormente.
supabase_instance: Client = create_client(
    supabase_url=settings.SUPABASE_URL,
    supabase_key=settings.SUPABASE_SERVICE_KEY
)

def get_supabase() -> Client:
    """Devuelve la instancia activa del cliente de Supabase."""
    return supabase_instance
