from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings

# Importar los routers
from app.api.routers.comercio import router_productos, router_pedidos
from app.api.routers.auth import router_auth
from app.api.routers.admin import router_admin
from app.api.routers.produccion import router_produccion, router_notificaciones
from app.api.routers.solicitudes import router_solicitudes

settings = get_settings()

app = FastAPI(
    title="Siembra Mirandina",
    version="16042026",
    description="Plataforma Agrotech: Del campo a tu mesa, siempre con la mejor frescura."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rutas en la app
app.include_router(router_auth)
app.include_router(router_admin)
app.include_router(router_productos)
app.include_router(router_pedidos)
app.include_router(router_produccion)
app.include_router(router_notificaciones)
app.include_router(router_solicitudes)

@app.get("/")
def read_root():
    return {
        "sistema": "Siembra Mirandina",
        "version": "16042026",
        "estado": "Operativo",
        "slogans": [
            "Del campo a tu mesa, siempre con la mejor frescura",
            "Cultivamos calidad, te llevamos frescura está es la mejor"
        ]
    }

