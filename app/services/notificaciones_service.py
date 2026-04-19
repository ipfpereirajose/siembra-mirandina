from app.db.supabase_client import get_supabase
import uuid

def emitir_alerta_productores(titulo: str, mensaje: str):
    """Envia una notificacion a todos los productores activos."""
    supabase = get_supabase()
    
    # 1. Obtener todos los productores
    res_productores = supabase.table('perfiles').select('id').eq('rol', 'PRODUCTOR').execute()
    
    if not res_productores.data:
        return
        
    # 2. Preparar el lote de notificaciones
    notificaciones_lote = []
    for prod in res_productores.data:
        notificaciones_lote.append({
            "usuario_id": prod['id'],
            "titulo": titulo,
            "mensaje": mensaje,
            "leido": False
        })
        
    # 3. Insertar
    if notificaciones_lote:
        supabase.table('notificaciones').insert(notificaciones_lote).execute()

def notificar_cambio_estado_pedido(cliente_id: str, pedido_id: str, nuevo_estado: str):
    """Notifica al cliente sobre el cambio de estado (Ej: Procesando, Cancelado)."""
    supabase = get_supabase()
    
    mensajes = {
        "ESPERA_PAGO": "Tu comprobante está en verificación por la administración.",
        "PROCESANDO": "Tu pago ha sido confirmado. Estamos procesando tu pedido a nivel de granja.",
        "DESPACHADO": "Tu mercancía va en camino.",
        "CANCELADO": "Tu pedido ha sido cancelado y los fondos/stock han sido reversados."
    }
    
    msg = mensajes.get(nuevo_estado, f"Tu pedido ha cambiado al estado: {nuevo_estado}")
    
    supabase.table('notificaciones').insert({
        "usuario_id": cliente_id,
        "titulo": f"Pedido {nuevo_estado}",
        "mensaje": msg,
        "leido": False
    }).execute()


def notificar_admin(titulo: str, mensaje: str):
    """Envía una notificación a todos los administradores del sistema."""
    supabase = get_supabase()
    res_admins = supabase.table('perfiles').select('id').eq('rol', 'ADMINISTRADOR').execute()
    
    if not res_admins.data:
        return
        
    lote = [{
        "usuario_id": adm['id'],
        "titulo": titulo,
        "mensaje": mensaje,
        "leido": False
    } for adm in res_admins.data]
    
    supabase.table('notificaciones').insert(lote).execute()

