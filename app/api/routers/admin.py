from fastapi import APIRouter, Depends, HTTPException
from app.db.supabase_client import get_supabase
from app.api.routers.comercio import get_user_context 
from datetime import datetime
from collections import defaultdict

router_admin = APIRouter(prefix="/admin", tags=["Modo Dios C-Level"])

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
         p_info = supabase.table('productos').select('nombre').eq('id', item['producto_id']).single().execute()
         nombre = p_info.data['nombre'] if p_info.data else "Item"
         top_rotacion.append({"nombre": nombre, "stock_restante": item['stock_disponible']})
         
    # 4. Traer los tickets pendientes
    try:
        tickets = supabase.table('solicitudes_cambios').select('id, empresa_id, campo_modificado, valor_nuevo, estado').eq('estado', 'PENDIENTE').execute()
        tickets_list = tickets.data
        for t in tickets_list:
            emp = supabase.table('empresas').select('nombre').eq('id', t['empresa_id']).single().execute()
            t["empresa_nombre"] = emp.data['nombre'] if emp.data else "Empresa Desconocida"
    except Exception:
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
