from fastapi import APIRouter, HTTPException, Depends
from app.db.supabase_client import get_supabase
from app.models.schemas import RequisicionMasivaCreate, ActualizarEstadoPedido, AporteProductorCreate, ValidarPagoPedido
from app.api.routers.comercio import get_user_context
from app.services.notificaciones_service import notificar_cambio_estado_pedido, notificar_admin

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
        
        # Notificar al Administrador
        notificar_admin(
            "📋 Nueva Requisición Especial",
            f"Un cliente ha solicitado {len(records)} rubros personalizados."
        )
        
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
    Ahora incluye pedidos regulares para unificar la gestión de pagos.
    """
    supabase = get_supabase()
    
    # 1. Traer solicitudes B2B (Especiales)
    res_solicitudes = supabase.table('pedidos_personalizados').select('*, perfiles(nombre_completo), productos(nombre, unidad_medida)').execute()
    solicitudes = res_solicitudes.data or []
    for s in solicitudes:
        s["es_personalizado"] = True
        
    # 2. Traer pedidos regulares que requieren atención (Pagos)
    res_regulares = supabase.table('pedidos').select('*, perfiles(nombre_completo)').in_('estado', ['ESPERA_PAGO', 'PENDIENTE']).execute()
    regulares = res_regulares.data or []
    for r in regulares:
        r["es_personalizado"] = False
        # Para regularizar el frontend
        r["url_comprobante"] = r.get("evidencia_pago") or r.get("codigo_referencia")
        
    # Unificar (Pedidos que requieren ACCIÓN del admin)
    all_solicitudes = solicitudes + regulares
    
    res_inventario = supabase.table('inventario').select('*, productos(nombre, unidad_medida)').execute()
    
    return {
        "solicitudes": all_solicitudes,
        "inventario_actual": res_inventario.data
    }


@router_solicitudes.put("/estado")
def actualizar_estado_solicitud(payload: ActualizarEstadoPedido, auth_ctx: dict = Depends(get_user_context)):
    """ Administrador avanza el estatus o Cliente Acepta Contra-oferta """
    supabase = get_supabase()
    # Buscar el cliente_id antes de actualizar
    orden_res = supabase.table('pedidos_personalizados').select('cliente_id').eq('id', str(payload.id_orden)).single().execute()
    cliente_id = orden_res.data.get('cliente_id') if orden_res.data else None
    
    res = supabase.table('pedidos_personalizados').update({'estado': payload.nuevo_estado}).eq('id', str(payload.id_orden)).execute()
    
    if cliente_id:
        notificar_cambio_estado_pedido(cliente_id, str(payload.id_orden), payload.nuevo_estado)
        
        # Si el cliente acepta o rechaza una contraoferta, notificar al ADMIN
        if payload.nuevo_estado in ["PAGO_POR_VERIFICAR", "CANCELADO"]:
             notificar_admin(
                 "🔔 Respuesta de Cliente B2B",
                 f"El cliente ha respondido a la propuesta con el estado: {payload.nuevo_estado}"
             )
        
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
    
    # Notificar al Administrador
    notificar_admin(
        "🚜 Demanda Cubierta",
        f"Un productor ha aportado {payload.cantidad} unidades a una solicitud masiva."
    )
    
    return {"mensaje": "Aporte registrado con éxito en el sistema ciego.", "data": res.data}


@router_solicitudes.post("/pago")
def validar_pago_cliente(payload: ValidarPagoPedido, auth_ctx: dict = Depends(get_user_context)):
    """ El cliente sube el recibo """
    supabase = get_supabase()
    res = supabase.table('pedidos_personalizados').update({
        'url_comprobante': payload.url_comprobante,
        'estado': 'PAGO_POR_VERIFICAR'
    }).eq('id', str(payload.id_orden)).execute()
    
    # Notificar al Administrador
    notificar_admin(
        "💳 Pago B2B Recibido",
        f"Un cliente empresarial ha reportado un pago. Referencia: {payload.url_comprobante}"
    )
    
    return {"mensaje": "Pago subido. Esperando verificación.", "data": res.data}

