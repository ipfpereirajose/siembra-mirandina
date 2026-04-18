from fastapi import APIRouter, HTTPException, Depends
from app.db.supabase_client import get_supabase
from app.models.schemas import RequisicionMasivaCreate, ActualizarEstadoPedido, AporteProductorCreate, ValidarPagoPedido
from app.api.routers.comercio import get_user_context
from typing import List

router_solicitudes = APIRouter(prefix="/solicitudes", tags=["Pedidos Personalizados"])

@router_solicitudes.post("/crear")
def crear_solicitud_personalizada(payload: RequisicionMasivaCreate, auth_ctx: dict = Depends(get_user_context)):
    """
    Permite a un cliente empresarial crear un pedido a medida, con múltiples filas (bulk).
    """
    supabase = get_supabase()
    try:
        # Recuperar categoría automáticamente si no se envía
        # En el MVP armamos un array de records y lo lanzamos a supabase bulk insert
        records = []
        for row in payload.filas:
            records.append({
                "cliente_id": str(auth_ctx["usuario_id"]),
                "producto_id": str(row.producto_id),
                "cantidad": row.cantidad,
                "unidad_medida": row.unidad_medida,
                "estado": "PENDIENTE"
            })
            
        res = supabase.table('pedidos_personalizados').insert(records).execute()
        return {"mensaje": "Requisición masiva enviada al administrador.", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router_solicitudes.get("/mis-solicitudes")
def obtener_historial_solicitudes(auth_ctx: dict = Depends(get_user_context)):
    """
    Devuelve las solicitudes agrupadas para el Dashboard del Cliente 
    """
    supabase = get_supabase()
    res = supabase.table('pedidos_personalizados').select('*, productos(nombre)').eq('cliente_id', str(auth_ctx["usuario_id"])).order('created_at', desc=True).execute()
    return res.data

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

@router_solicitudes.put("/estado")
def actualizar_estado_solicitud(payload: ActualizarEstadoPedido, auth_ctx: dict = Depends(get_user_context)):
    """ Administrador avanza el estatus o Cliente Acepta Contra-oferta """
    supabase = get_supabase()
    res = supabase.table('pedidos_personalizados').update({'estado': payload.nuevo_estado}).eq('id', str(payload.id_orden)).execute()
    return {"mensaje": "Estado actualizado", "data": res.data}

@router_solicitudes.get("/subastas")
def obtener_subastas_abiertas(auth_ctx: dict = Depends(get_user_context)):
    """ Productores ven qué piezas faltan en el sistema """
    supabase = get_supabase()
    # Trae solicitudes en estado 'SUBASTA_ABIERTA' y calcular cuotas faltantes uniendo aportes
    res = supabase.table('pedidos_personalizados').select('*, productos(nombre), aportes_productores(*)').eq('estado', 'SUBASTA_ABIERTA').execute()
    return res.data

@router_solicitudes.post("/aportes")
def registrar_aporte(payload: AporteProductorCreate, auth_ctx: dict = Depends(get_user_context)):
    """ Un productor puja una cantidad para suplir el déficit de un pedido """
    supabase = get_supabase()
    res = supabase.table('aportes_productores').insert({
        "pedido_personalizado_id": str(payload.id_orden),
        "productor_id": str(auth_ctx["usuario_id"]),
        "cantidad_aportada": payload.cantidad,
        "estado": "COMPROMETIDO"
    }).execute()
    return {"mensaje": "Aporte registrado con éxito en el sistema ciego.", "data": res.data}

@router_solicitudes.post("/pago")
def validar_pago_cliente(payload: ValidarPagoPedido, auth_ctx: dict = Depends(get_user_context)):
    """ El cliente sube el recibo """
    supabase = get_supabase()
    res = supabase.table('pedidos_personalizados').update({
        'url_comprobante': payload.url_comprobante,
        'estado': 'PAGO_POR_VERIFICAR'
    }).eq('id', str(payload.id_orden)).execute()
    return {"mensaje": "Pago subido. Esperando verificación.", "data": res.data}
