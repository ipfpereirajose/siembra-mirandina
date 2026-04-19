from uuid import UUID
from fastapi import HTTPException, status
from app.db.supabase_client import get_supabase
from app.models.schemas import CheckoutRequest
from app.services.notificaciones_service import notificar_cambio_estado_pedido, notificar_admin


def procesar_checkout(usuario_id: str, empresa_id: str, payload: CheckoutRequest):
    """
    Simula la lógica dura de procesar un pedido B2B:
    1. Verifica Stock de todos los productos en Supabase.
    2. Calcula precios (incluyendo listas de precios especiales si tuvieran).
    3. Registra el Pedido y las Líneas de Pedido.
    4. Cierra la orden.
    """
    supabase = get_supabase()
    
    total_usd = 0.0
    lineas_procesadas = []
    productos_a_descontar = []
    
    try:
        # Aquí se simularía una transacción. En PostgREST las transacciones nativas
        # se logran mediante supa.rpc() o chequeos pesimistas.
        # Por seguridad del MVP, comprobamos iterativamente.
        
        for linea in payload.lineas:
            # Traer producto
            prod_res = supabase.table('productos').select('*').eq('id', str(linea.producto_id)).single().execute()
            if not prod_res.data:
                raise HTTPException(status_code=404, detail=f"Producto {linea.producto_id} no encontrado")
            
            producto = prod_res.data
            
            # Verificar inventario
            inv_res = supabase.table('inventario').select('stock_disponible, umbral_alerta').eq('producto_id', str(linea.producto_id)).single().execute()
            stock = inv_res.data['stock_disponible'] if inv_res.data else 0
            
            if stock < linea.cantidad:
                raise HTTPException(status_code=400, detail=f"Stock insuficiente para el producto {producto['nombre']}. Solicitas {linea.cantidad}, pero hay {stock}.")
            
            # Calcular Precio (Normalmente aquí se cruzaría con `listas_precios`)
            # Para este MVP asumimos precio base de venta.
            precio_unitario = float(producto['precio_base_usd'])
            subtotal = precio_unitario * linea.cantidad
            total_usd += subtotal
            
            lineas_procesadas.append({
                "producto_id": str(linea.producto_id),
                "cantidad": linea.cantidad,
                "precio_unitario_usd": precio_unitario,
                "subtotal_usd": subtotal
            })
            
            productos_a_descontar.append({
                "producto_id": str(linea.producto_id),
                "nuevo_stock": stock - linea.cantidad,
                "cantidad": linea.cantidad,
                "umbral_alerta": inv_res.data.get('umbral_alerta', 5) if inv_res.data else 5
            })
            
        # 1. Crear el Pedido Master
        orden_data = {
            "cliente_id": usuario_id,
            "estado": "PENDIENTE",
            "metodo_pago": payload.metodo_pago,
            "total_usd": total_usd
        }
        
        orden_res = supabase.table('pedidos').insert(orden_data).execute()
        orden_creada = orden_res.data[0]
        pedido_id = orden_creada['id']
        
        # 2 & 3. Deducir Inventario por Productor (FIFO) y Preparar Lineas
        alertas_stock = []
        for l_proc in lineas_procesadas:
            l_proc["pedido_id"] = pedido_id
            prod_id = l_proc["producto_id"]
            restante_a_descontar = l_proc["cantidad"]
            
            # Buscar dict original en productos_a_descontar si fuera distinto, pero l_proc tiene lo que necesitamos
            trazabilidad = []
            
            # Traer ofertas de productores para este producto ordendas por antigüedad (FIFO)
            ofertas_res = supabase.table('produccion_productor').select('*').eq('producto_id', prod_id).eq('esta_en_venta', True).gt('cantidad_en_venta', 0).order('created_at', desc=False).execute()
            
            for oferta in ofertas_res.data:
                if restante_a_descontar <= 0:
                    break
                
                disp_venta = float(oferta['cantidad_en_venta'])
                disp_total = float(oferta['cantidad_disponible'])
                
                if disp_venta <= restante_a_descontar:
                    # Se consume toda esta oferta
                    tomado = disp_venta
                    restante_a_descontar -= disp_venta
                    # Actualizar a 0 y sacar de venta
                    supabase.table('produccion_productor').update({
                        "cantidad_en_venta": 0,
                        "esta_en_venta": False,
                        "cantidad_disponible": disp_total - tomado
                    }).eq('id', oferta['id']).execute()
                    
                    trazabilidad.append({"oferta_id": oferta['id'], "productor_id": oferta['productor_id'], "cantidad_tomada": tomado})
                else:
                    # Se consume parcialmente esta oferta
                    tomado = restante_a_descontar
                    supabase.table('produccion_productor').update({
                        "cantidad_en_venta": disp_venta - tomado,
                        "cantidad_disponible": disp_total - tomado
                    }).eq('id', oferta['id']).execute()
                    
                    trazabilidad.append({"oferta_id": oferta['id'], "productor_id": oferta['productor_id'], "cantidad_tomada": tomado})
                    restante_a_descontar = 0
                    
            l_proc["siembra_trazabilidad"] = trazabilidad

        # 4. Insertar Lineas con Integridad de Trazabilidad
        supabase.table('lineas_pedido').insert(lineas_procesadas).execute()
            
        # El trigger de la DB actualiza automáticamente el 'inventario' global
        
        for pd in productos_a_descontar:
            if pd["nuevo_stock"] <= pd["umbral_alerta"]:
                alertas_stock.append({
                    "producto_id": pd["producto_id"],
                    "stock_actual": pd["nuevo_stock"],
                    "umbral": pd["umbral_alerta"]
                })
            
        # Notificar al cliente sobre su nueva orden regular
        notificar_cambio_estado_pedido(usuario_id, pedido_id, "PENDIENTE")
        
        # Notificar al Administrador sobre nueva venta
        notificar_admin(
            "🛒 Nueva Venta Regular",
            f"Un cliente ha realizado un pedido por {total_usd} USD."
        )
        
        return orden_creada, alertas_stock

        
    except Exception as e:
        # Rebotar la excepción a FastAPI si falla
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Transacción abortada: {str(e)}")

def cancelar_pedido(pedido_id: str):
    """
    Revierte una orden (Cancelación) usando la trazabilidad almacenada.
    Devuelve las cantidades retenidas a sus productores originales.
    """
    supabase = get_supabase()
    try:
        # 1. Traer lineas con trazabilidad
        lineas_res = supabase.table('lineas_pedido').select('*').eq('pedido_id', pedido_id).execute()
        
        for linea in lineas_res.data:
            trazabilidad = linea.get("siembra_trazabilidad") or []
            for t in trazabilidad:
                oferta_id = t.get("oferta_id") # Usamos .get para tolerar viejos formatos
                if not oferta_id: continue
                tomado = float(t.get("cantidad_tomada", 0))
                
                # Obtener estado actual de la oferta
                of_res = supabase.table('produccion_productor').select('*').eq('id', oferta_id).single().execute()
                if of_res.data:
                    of_actual = of_res.data
                    nueva_venta = float(of_actual["cantidad_en_venta"]) + tomado
                    nueva_disp = float(of_actual["cantidad_disponible"]) + tomado
                    
                    supabase.table('produccion_productor').update({
                        "cantidad_en_venta": nueva_venta,
                        "cantidad_disponible": nueva_disp,
                        "esta_en_venta": True # Si estaba apagado, al recibir stock vuelve a vender
                    }).eq('id', oferta_id).execute()
        
        # 2. Marcar pedido como cancelado
        supabase.table('pedidos').update({"estado": "CANCELADO"}).eq('id', pedido_id).execute()
        
        return True
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al cancelar pedido: {str(e)}")
