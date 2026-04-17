from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "Siembra Mirandina - Backend Agrotech"
    VERSION: str = "16042026"
    
    # Credenciales de Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_ANON_KEY: str

    # Webhooks de N8N
    N8N_WEBHOOK_SALES_URL: str = ""
    N8N_WEBHOOK_INVENTORY_URL: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()
