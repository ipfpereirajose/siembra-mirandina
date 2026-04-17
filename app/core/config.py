from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # Updated for Vercel deployment - 2026-04-17
    PROJECT_NAME: str = "Siembra Mirandina - Backend Agrotech"
    VERSION: str = "16042026"
    
    # Credenciales de Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_ANON_KEY: str

    # Webhooks de N8N
    N8N_WEBHOOK_SALES_URL: str = ""
    N8N_WEBHOOK_INVENTORY_URL: str = ""
    
    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow"  # Permitir campos adicionales
    )

@lru_cache()
def get_settings() -> Settings:
    return Settings()
