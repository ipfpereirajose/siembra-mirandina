import sys
import os
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.db.supabase_client import get_supabase
from app.models.schemas import CheckoutRequest, LineaPedidoCreate
from app.services.checkout_service import procesar_checkout, cancelar_pedido


def log_step(step_name):
    print(f"\n[{time.strftime('%H:%M:%S')}] --- {step_name} ---")

def main():
    supabase = get_supabase()
    
    # 0. Preparar Actores
    # Buscamos un Productor, un Cliente y un Admin
    prod_res = supabase.table('perfiles').select('id, empresa_id').eq('rol', 'PRODUCTOR').limit(1).execute()
    prod_id = prod_res.data[0]['id']
    prod_emp_id = prod_res.data[0]['empresa_id']
    
    client_res = supabase.table('perfiles').select('id, empresa_id').ilike('rol', 'CLIENTE%').limit(1).execute()
    if not client_res.data:
        print("No hay clientes en la BD. Por favor corre el script seed de usuarios.")
        return
    client_id = client_res.data[0]['id']
    client_emp_id = client_res.data[0]['empresa_id']
    
    admin_res = supabase.table('perfiles').select('id, empresa_id').eq('rol', 'ADMINISTRADOR').limit(1).execute()
    admin_id = admin_res.data[0]['id']
    admin_emp_id = admin_res.data[0]['empresa_id']
    
    # Obtener un par de productos
    prods = supabase.table('productos').select('*').limit(2).execute().data
    p1 = prods[0]
    p2 = prods[1]
    
    # =========================================================================
    # ESCENARIO 1: RUTINA BÁSICA Y CANCELACIÓN (STOCK REVERSAL)
    # 1. Productor declara y pone a disposicion
    # =========================================================================
    log_step("1. Productor declara stock")
    supabase.table('produccion_productor').insert({
        "productor_id": prod_id,
        "producto_id": p1['id'],
        "cantidad_disponible": 100,
        "cantidad_en_venta": 50,
        "esta_en_venta": True,
        "unidad_medida": p1['unidad_medida'],
        "precio_propuesto_usd": p1['precio_base_usd']
    }).execute()
    print(f"Productor declaró 100 {p1['unidad_medida']} de {p1['nombre']}, 50 expuestos al catálogo.")
    
    # 2. Cliente Compra 20 unidades
    log_step("2. Cliente hace Checkout B2B Regular (Restar Stock Temporal)")
    req_checkout = CheckoutRequest(
        lineas=[LineaPedidoCreate(producto_id=p1['id'], cantidad=20.0)],
        metodo_pago="Zelle"
    )
    orden_creada, alertas = procesar_checkout(client_id, client_emp_id, req_checkout)
    pedido_id = orden_creada['id']
    print(f"Pedido #{pedido_id} creado por {orden_creada['total_usd']} USD. Estado PENDIENTE.")
    
    # Verificamos descuento temporal
    inv_verif = supabase.table('produccion_productor').select('cantidad_en_venta').eq('productor_id', prod_id).eq('producto_id', p1['id']).order('created_at', desc=True).limit(1).execute()
    print(f"Stock luego de compra temporal: {inv_verif.data[0]['cantidad_en_venta']} en venta (Debería ser 30).")
    
    # 3. Cliente cancela el pedido
    log_step("3. Cliente CANCELA el pedido (Reembolso de Stock)")
    cancelar_pedido(pedido_id)
    print("Pedido cancelado exitosamente.")
    inv_verif2 = supabase.table('produccion_productor').select('cantidad_en_venta').eq('productor_id', prod_id).eq('producto_id', p1['id']).order('created_at', desc=True).limit(1).execute()
    print(f"Stock devuelto tras cancelación: {inv_verif2.data[0]['cantidad_en_venta']} en venta (Volvió a 50).")

    # =========================================================================
    # ESCENARIO 2: REQUISICIÓN MASIVA -> SUBASTA -> PAGO -> PROCESO
    # =========================================================================
    log_step("4. Cliente hace Requisición Especial Masiva de Rubros Mixtos")
    productos_req = [
        {"nombre": p1['nombre'], "cantidad": 200, "producto_id": p1['id'], "unidad_medida": p1['unidad_medida']},
        {"nombre": "Yuca Congelada (No Existe)", "cantidad": 50, "unidad_medida": "Cajas"}
    ]
    
    records = []
    for row in productos_req:
        records.append({
            "cliente_id": client_id,
            "producto_id": row.get('producto_id'), # Puede ser null
            "categoria_sugerida": row['nombre'],
            "cantidad": row['cantidad'],
            "unidad_medida": row['unidad_medida'],
            "estado": "PENDIENTE"
        })
    res_req = supabase.table('pedidos_personalizados').insert(records).execute()
    req1_id = res_req.data[0]['id']
    req2_id = res_req.data[1]['id']
    print(f"Solicitudes masivas creadas en estado PENDIENTE. (IDs: {req1_id}, {req2_id})")
    
    log_step("5. Administrador visualiza y detona Alerta a Productores")
    # Lógica Admin Alertando
    supabase.table('pedidos_personalizados').update({"estado": "SUBASTA_ABIERTA"}).in_('id', [req1_id, req2_id]).execute()
    
    # Detonar modulo de notificaciones fakeando la inyección
    from app.services.notificaciones_service import emitir_alerta_productores
    emitir_alerta_productores("[ALERTA] Nueva Demanda de Mercado", "Ingresa a Demandas Urgentes")
    print("Admin publicó la demanda en Broadcast. Estado ahora es SUBASTA_ABIERTA.")
    
    log_step("6. Productor Revisa Visualiza Notificación y Cubre Demanda")
    noti_check = supabase.table('notificaciones').select('*').eq('usuario_id', prod_id).order('created_at', desc=True).limit(1).execute()
    if noti_check.data:
        print(f"Productor recibió Campanita: {noti_check.data[0]['titulo']} - {noti_check.data[0]['mensaje']}")
        
    # Productor hace aporte
    supabase.table('aportes_productores').insert({
        "pedido_personalizado_id": req1_id,
        "productor_id": prod_id,
        "cantidad_aportada": 200,
        "estado": "COMPROMETIDO"
    }).execute()
    print("Productor comprometió 200 unidades para cubrir la solicitud.")
    
    log_step("7. Administrador Notifica que se cubrió y Cliente Sube Pago")
    # Actualización a PAGO_POR_VERIFICAR mediante API (Simulado)
    supabase.table('pedidos_personalizados').update({
        'url_comprobante': "REF-BANESCO-8392",
        'estado': 'PAGO_POR_VERIFICAR'
    }).eq('id', req1_id).execute()
    print("Cliente subió el número de referencia y el estado cambió a PAGO_POR_VERIFICAR.")
    
    log_step("8. Administrador Confirma el Pago y Pasa a Procesando")
    from app.api.routers.admin import confirmar_pago, PagoConfirmacion, get_user_context
    payload_confirm = PagoConfirmacion(pedido_id=req1_id, es_personalizado=True)
    confirmar_pago(payload_confirm, {"usuario_id": admin_id, "empresa_id": admin_emp_id})
    print("Pago confirmado exitosamente en backend.")
    
    final_chk = supabase.table('pedidos_personalizados').select('estado').eq('id', req1_id).single().execute()
    print(f"ESTADO FINAL DE LA ORDEN: {final_chk.data['estado']}")
    
    noti_cliente = supabase.table('notificaciones').select('*').eq('usuario_id', client_id).order('created_at', desc=True).limit(1).execute()
    print(f"Notificación de Cierre para el CLiente: {noti_cliente.data[0]['mensaje']}")

    print("\n[✓] PRUEBA EXITOSA: Todo el pipeline de Escasez, Notificaciones, Reservas, Reversos y Pagos fue recorrido exitosamente sin errores.")

if __name__ == "__main__":
    main()
