from fastapi import APIRouter, Depends, HTTPException
from app.db.supabase_client import get_supabase
from app.api.routers.comercio import get_user_context 
from datetime import datetime, date
from collections import defaultdict
import httpx

router_admin = APIRouter(prefix="/admin", tags=["Modo Dios C-Level"])

# ─── Tasa BCV con caché diario ────────────────────────────────────────────────
_cache_tasa = {"tasa": 481.22, "fecha": "", "fuente": "fallback"}

from app.services.notificaciones_service import emitir_alerta_productores, notificar_cambio_estado_pedido
from pydantic import BaseModel

class PagoConfirmacion(BaseModel):
    pedido_id: str
    es_personalizado: bool = False

@router_admin.get("/tasa-bcv")
async def obtener_tasa_bcv():
    """
    Devuelve la tasa de cambio USD/VES actualizada.
    - Si ya la consultamos hoy, devuelve el valor en caché (0 llamadas externas extra).
    - Si es un día nuevo, la descarga de ExchangeRate-API y la actualiza en Supabase.
    """
    hoy = date.today().isoformat()
    
    # 1. Si el caché ya es de hoy, devolver sin llamada externa
    if _cache_tasa["fecha"] == hoy:
        return _cache_tasa

    # 2. Intentar leer de Supabase (persistencia entre reinicios del servidor)
    supabase = get_supabase()
    try:
        res = supabase.table('config_sistema').select('*').eq('clave', 'tasa_bcv_usd').single().execute()
        if res.data and res.data.get('fecha_actualizacion', '')[:10] == hoy:
            tasa = float(res.data['valor'])
            _cache_tasa.update({"tasa": tasa, "fecha": hoy, "fuente": "supabase"})
            return _cache_tasa
    except Exception:
        pass  # La tabla puede no existir todavía, continuamos

    # 3. Buscar tasa actualizada en ExchangeRate-API (gratuita, límite: 1500 req/mes)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get("https://api.exchangerate-api.com/v4/latest/USD")
            data = r.json()
            tasa = round(float(data["rates"]["VES"]), 4)
            fecha_api = data.get("date", hoy)
    except Exception:
        # Si la API falla, usar fallback y devolver lo que tenemos
        _cache_tasa["fecha"] = hoy
        return _cache_tasa

    # 4. Actualizar caché en memoria
    _cache_tasa.update({"tasa": tasa, "fecha": hoy, "fuente": "exchangerate-api", "fecha_bcv": fecha_api})

    # 5. Persistir en Supabase para sobrevivir reinicios del servidor
    try:
        supabase.table('config_sistema').upsert({
            "clave": "tasa_bcv_usd",
            "valor": str(tasa),
            "fecha_actualizacion": datetime.utcnow().isoformat()
        }).execute()
    except Exception:
        pass  # No crítico si falla el guardado

    return _cache_tasa


@router_admin.get("/dashboard-stats")
def obtener_metricas_c_level(auth_ctx: dict = Depends(get_user_context)):
    """
    Computa ventas mensuales, ganancias y los productos top.
    En producción exigiremos que el rol del usuario sea SUPER_ADMIN.
    """
    # En un sistema real de MVP simulamos el check.
    # if auth_ctx.get("rol") != "SUPER_ADMIN":
    #    raise HTTPException(status_code=403, detail="No tienes acceso C-Level.")
        
    supabase = get_supabase()
    
    # 1. Traer todos los pedidos B2B o regulares
    try:
        res_pedidos = supabase.table('pedidos').select('*').execute()
        pedidos = res_pedidos.data
    except Exception:
        pedidos = []
    
    # 2. Computar Ventas por Mes y Ganancias
    ventas_por_mes = defaultdict(float)
    ingresos_totales = 0.0
    for p in pedidos:
        mes = p['created_at'][:7] # YYYY-MM
        ventas_por_mes[mes] += p['total_usd']
        ingresos_totales += p['total_usd']
        
    ventas_formateadas = [{"mes": m, "ventas": v} for m, v in ventas_por_mes.items()]
    
    # 3. Top Productos (Mockeado para MVP sin un JOIN masivo desde lineas_pedido)
    res_inv = supabase.table('inventario').select('producto_id, stock_disponible').order('stock_disponible', desc=False).limit(5).execute()
    top_rotacion = []
    for item in res_inv.data:
         p_info = supabase.table('productos').select('nombre, unidad_medida').eq('id', item['producto_id']).limit(1).execute()
         p_data = p_info.data[0] if p_info.data else None
         nombre = p_data['nombre'] if p_data else "Item Desconocido"
         um = p_data.get('unidad_medida', 'Unidad') if p_data else "Unidad"
         top_rotacion.append({"nombre": nombre, "stock_restante": item['stock_disponible'], "um": um})
         
    # 4. Traer los tickets pendientes
    try:
        tickets = supabase.table('solicitudes_cambios').select('id, empresa_id, campo_modificado, valor_nuevo, estado').eq('estado', 'PENDIENTE').execute()
        tickets_list = tickets.data
        for t in tickets_list:
            emp = supabase.table('empresas').select('nombre').eq('id', t['empresa_id']).limit(1).execute()
            t["empresa_nombre"] = emp.data[0]['nombre'] if emp.data else "Empresa Desconocida"
    except Exception as e:
        tickets_list = []
         
    return {
        "kpis": {
            "ingresos_globales_usd": ingresos_totales,
            "total_facturas": len(pedidos),
            "tickets_pendientes": len(tickets_list)
        },
        "grafico_ventas": ventas_formateadas,
        "top_productos": top_rotacion,
        "solicitudes": tickets_list
    }

@router_admin.post("/pagos/confirmar")
def confirmar_pago(payload: PagoConfirmacion, auth_ctx: dict = Depends(get_user_context)):
    supabase = get_supabase()
    tabla = 'pedidos_personalizados' if payload.es_personalizado else 'pedidos'
    
    try:
        # Obtener el pedido para saber el cliente
        # Usamos limit(1) en vez de single() para evitar que Supabase explote si no encuentra nada o hay inconsistencias
        ped_res = supabase.table(tabla).select('*').eq('id', payload.pedido_id).limit(1).execute()
        
        if not ped_res.data:
            raise HTTPException(status_code=404, detail=f"Pedido no encontrado en tabla {tabla}")
            
        pedido_data = ped_res.data[0]
        cliente_id = pedido_data.get('cliente_id')
        
        # Actualizar estado a PROCESANDO
        supabase.table(tabla).update({"estado": "PROCESANDO"}).eq('id', payload.pedido_id).execute()
        
        # Notificar al cliente
        if cliente_id:
            notificar_cambio_estado_pedido(cliente_id, payload.pedido_id, "PROCESANDO")
        
        # Notificar a los productores involucrados (Broadcast)
        emitir_alerta_productores(
            "¡Pedido Listo para Despacho!", 
            f"El administrador ha confirmado el pago de una orden y requiere despachos inmediatos."
        )
        
        return {"mensaje": "Pago confirmado y procesado exitosamente."}
    except Exception as e:
        print(f"Error en confirmar_pago: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en el servidor: {str(e)}")


@router_admin.post("/solicitudes/{id_solicitud}/alertar")
def lanzar_alerta_demanda(id_solicitud: str, auth_ctx: dict = Depends(get_user_context)):
    supabase = get_supabase()
    # 1. Cambiar estado a SUBASTA_ABIERTA
    supabase.table('pedidos_personalizados').update({"estado": "SUBASTA_ABIERTA"}).eq('id', id_solicitud).execute()
    
    # 2. Alertar por notificacion
    emitir_alerta_productores(
        "🔥 Nueva Demanda del Mercado",
        "El Administrador ha abierto una solicitud masiva. Revisa la pestaña de Demandas Urgentes para ofrecer tus rubros."
    )
    
    return {"mensaje": "Demanda difusa lanzada a todos los productores."}

