from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi import APIRouter, HTTPException, Depends, Header, BackgroundTasks
from typing import List, Optional
from app.db.supabase_client import get_supabase
from app.models.schemas import ProductoResponse, CheckoutRequest, PedidoResponse
from app.services.checkout_service import procesar_checkout
from app.services import n8n_integration

router_productos = APIRouter(prefix="/productos", tags=["Catálogo Agrícola"])
router_pedidos = APIRouter(prefix="/pedidos", tags=["Ventas y Checkout B2B"])

def get_user_context(
    x_user_id: str = Header(default="00000000-0000-0000-0000-000000000000"),
    x_empresa_id: str = Header(default="00000000-0000-0000-0000-000000000000")
):
    # En desarrollo real esto vendrá decodificado del middleware JWT Bearer auth.
    # Por ahora extraeremos de Headers para poder hacer nuestros Tests con IDs reales.
    return {
        "usuario_id": x_user_id,
        "empresa_id": x_empresa_id
    }

@router_productos.get("/", response_model=List[ProductoResponse])
def listar_productos():
    """
    Devuelve todo el catálogo B2B activo.
    Ideal para llenar el frontend de inmediato.
    """
    supabase = get_supabase()
    res = supabase.table('productos').select('*, inventario(*)').eq('activo', True).execute()
    
    productos_formateados = []
    for item in res.data:
        # Aplanar inventario para el modelo si viene en array o dict
        inv = item.get('inventario')
        if inv:
            if isinstance(inv, list) and len(inv) > 0:
                inv = inv[0]
            inv['umbral_alerta'] = inv.get('umbral_alerta', 5)
            item['inventario'] = inv
        productos_formateados.append(item)
        
    return productos_formateados

@router_pedidos.post("/checkout", response_model=PedidoResponse)
def crear_pedido_b2b(payload: CheckoutRequest, background_tasks: BackgroundTasks, auth_ctx: dict = Depends(get_user_context)):
    """
    Endpoint principal de ventas B2B. Recibe el carrito, deduce inventario y crea el pedido.
    """
    orden_creada, alertas_stock = procesar_checkout(auth_ctx["usuario_id"], auth_ctx["empresa_id"], payload)
    
    # 1. Ejecutar Webhook de Ventas en segundo plano (para no hacer esperar al cliente)
    background_tasks.add_task(n8n_integration.notificar_nueva_venta, orden_creada)
    
    # 2. Ejecutar Webhooks de Alertas de Stock (si hubo productos críticos)
    for alerta in alertas_stock:
        background_tasks.add_task(
            n8n_integration.alertar_stock_bajo, 
            alerta["producto_id"], 
            alerta["stock_actual"], 
            alerta["umbral"]
        )
        
    orden_creada["lineas"] = []
    return orden_creada

@router_pedidos.get("/historial", response_model=List[PedidoResponse])
def obtener_historial_compras(auth_ctx: dict = Depends(get_user_context)):
    """
    Retorna todo el histórico de compras de una empresa en específico para su Dashboard B2B.
    """
    supabase = get_supabase()
    
    # Hacer fetch a supabase filtrando por empresa
    res = supabase.table('pedidos').select('*').eq('empresa_id', str(auth_ctx["empresa_id"])).order('created_at', desc=True).execute()
    
    if not res.data:
        return []
    
    # En un ambiente real, haríamos join con lineas_pedido, aqui mockeamos la estrcutura para Pydantic.
    historico = []
    for p in res.data:
        p["lineas"] = []
        historico.append(p)
        
    return historico
