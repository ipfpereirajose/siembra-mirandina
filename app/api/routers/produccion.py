from fastapi import APIRouter, HTTPException, Depends
from app.db.supabase_client import get_supabase
from typing import List, Optional
from app.models.schemas import ProduccionCreate, ProduccionUpdateVenta, NotificacionResponse
from app.api.routers.comercio import get_user_context
from typing import List

router_produccion = APIRouter(prefix="/produccion", tags=["Producción Agrícola"])
router_notificaciones = APIRouter(prefix="/notificaciones", tags=["Sistema de Notificaciones"])

def categorizar_automaticamente(nombre: str) -> str:
    """Mapea nombres a categorías existentes en la Base de Datos"""
    nombre = nombre.lower()
    mapping = {
        "hortalizas": ["tomate", "pimentón", "ají", "cebolla", "ajo", "pepino", "lechuga", "brócoli", "repollo"],
        "tubérculos": ["papa", "zanahoria", "remolacha", "yuca", "ocumo", "ñame", "batata"],
        "frutas": ["cambur", "plátano", "mandarina", "naranja", "limón", "fresa", "durazno"],
        "leguminosas": ["caraota", "frijol", "lenteja", "garbanzo"]
    }
    for cat, keywords in mapping.items():
        if any(k in nombre for k in keywords):
            return cat
    return "misceláneos"

@router_produccion.post("/declarar")
def declarar_produccion(payload: ProduccionCreate, auth_ctx: dict = Depends(get_user_context)):
    """
    Permite a un productor declarar lo que tiene a disposición.
    """
    supabase = get_supabase()
    producto_id = payload.producto_id
    
    try:
        # Si es un rubro nuevo, lo creamos primero
        if not producto_id and payload.nuevo_producto_nombre:
            cat_nombre = categorizar_automaticamente(payload.nuevo_producto_nombre)
            cat_res = supabase.table('categorias').select('id').ilike('nombre', f"%{cat_nombre}%").limit(1).execute()
            cat_id = cat_res.data[0]['id'] if cat_res.data else None
            
            prod_res = supabase.table('productos').insert({
                "nombre": payload.nuevo_producto_nombre,
                "categoria_id": cat_id,
                "sku": f"PROD-NEW-{payload.nuevo_producto_nombre[:3].upper()}",
                "precio_base_usd": payload.precio_propuesto_usd or 0.0,
                "activo": True
            }).execute()
            producto_id = prod_res.data[0]['id']

        if not producto_id:
            raise HTTPException(status_code=400, detail="Debe seleccionar un producto o indicar el nombre del nuevo rubro.")

        res = supabase.table('produccion_productor').insert({
            "productor_id": str(auth_ctx["usuario_id"]),
            "producto_id": str(producto_id),
            "cantidad_disponible": payload.cantidad_disponible,
            "cantidad_en_venta": payload.cantidad_en_venta or 0.0,
            "esta_en_venta": payload.esta_en_venta or False,
            "unidad_medida": payload.unidad_medida,
            "precio_propuesto_usd": payload.precio_propuesto_usd
        }).execute()
        
        return {"mensaje": "Producción declarada exitosamente.", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al declarar producción: {str(e)}")

@router_produccion.post("/actualizar-venta")
def actualizar_oferta_venta(payload: ProduccionUpdateVenta, auth_ctx: dict = Depends(get_user_context)):
    """
    Permite al productor cambiar cuánto pone a la venta de lo que ya declaró.
    """
    supabase = get_supabase()
    try:
        res = supabase.table('produccion_productor').update({
            "cantidad_en_venta": payload.cantidad_en_venta,
            "esta_en_venta": payload.esta_en_venta
        }).eq('id', str(payload.id)).eq('productor_id', str(auth_ctx["usuario_id"])).execute()
        
        if not res.data:
             raise HTTPException(status_code=404, detail="Declaración no encontrada o no tienes permiso.")
             
        return {"mensaje": "Estado de venta actualizado correctamente.", "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router_produccion.get("/mis-declaraciones")
def obtener_mis_declaraciones(auth_ctx: dict = Depends(get_user_context)):
    supabase = get_supabase()
    res = supabase.table('produccion_productor').select('*, productos(nombre)').eq('productor_id', str(auth_ctx["usuario_id"])).execute()
    return res.data

@router_produccion.delete("/{declaracion_id}")
def eliminar_declaracion(declaracion_id: str, auth_ctx: dict = Depends(get_user_context)):
    supabase = get_supabase()
    # En un sistema real, esto debería restar del inventario global. 
    # El trigger de la BD actual maneja INSERT/UPDATE, necesitaríamos un trigger para DELETE.
    try:
        res = supabase.table('produccion_productor').delete().eq('id', declaracion_id).eq('productor_id', str(auth_ctx["usuario_id"])).execute()
        return {"mensaje": "Declaración eliminada."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router_notificaciones.get("/", response_model=List[NotificacionResponse])
def listar_notificaciones(auth_ctx: dict = Depends(get_user_context)):
    supabase = get_supabase()
    res = supabase.table('notificaciones').select('*').eq('usuario_id', str(auth_ctx["usuario_id"])).order('created_at', desc=True).limit(5).execute()
    return res.data
