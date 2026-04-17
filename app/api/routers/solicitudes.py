from fastapi import APIRouter, HTTPException, Depends
from app.db.supabase_client import get_supabase
from app.models.schemas import PedidoPersonalizadoCreate
from app.api.routers.comercio import get_user_context
from typing import List

router_solicitudes = APIRouter(prefix="/solicitudes", tags=["Pedidos Personalizados"])

@router_solicitudes.post("/crear")
def crear_solicitud_personalizada(payload: PedidoPersonalizadoCreate, auth_ctx: dict = Depends(get_user_context)):
    """
    Permite a un cliente empresarial crear un pedido a medida.
    """
    supabase = get_supabase()
    try:
        # Recuperar categoría automáticamente si no se envía
        # En el MVP usaremos lo que venga en el producto_id
        res = supabase.table('pedidos_personalizados').insert({
            "cliente_id": str(auth_ctx["usuario_id"]),
            "producto_id": str(payload.producto_id),
            "cantidad": payload.cantidad,
            "unidad_medida": payload.unidad_medida,
            # El administrador asignará el precio luego
            "estado": "PENDIENTE"
        }).execute()
        return {"mensaje": "Solicitud enviada al administrador.", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router_solicitudes.get("/oferta-demanda")
def dashboard_oferta_demanda(auth_ctx: dict = Depends(get_user_context)):
    """
    Para el administrador: Ver todas las solicitudes pendientes y compararlas con inventario.
    """
    supabase = get_supabase()
    # Solo admin
    # En un sistema real verificaríamos rol en auth_ctx
    res_solicitudes = supabase.table('pedidos_personalizados').select('*, perfiles(nombre_completo), productos(nombre)').execute()
    res_inventario = supabase.table('inventario').select('*, productos(nombre)').execute()
    
    return {
        "solicitudes": res_solicitudes.data,
        "inventario_actual": res_inventario.data
    }
