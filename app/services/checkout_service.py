from uuid import UUID
from fastapi import HTTPException, status
from app.db.supabase_client import get_supabase
from app.models.schemas import CheckoutRequest

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
                "umbral_alerta": inv_res.data.get('umbral_alerta', 5) if inv_res.data else 5
            })
            
        # 1. Crear el Pedido Master
        orden_data = {
            "empresa_id": empresa_id,
            "usuario_id": usuario_id,
            "estado": "PENDIENTE",
            "metodo_pago": payload.metodo_pago,
            "total_usd": total_usd
        }
        
        orden_res = supabase.table('pedidos').insert(orden_data).execute()
        orden_creada = orden_res.data[0]
        pedido_id = orden_creada['id']
        
        # 2. Insertar Líneas
        for l_proc in lineas_procesadas:
            l_proc["pedido_id"] = pedido_id
        
        supabase.table('lineas_pedido').insert(lineas_procesadas).execute()
        
        # 3. Deducir Inventario y Calcular Alertas
        alertas_stock = []
        for pd in productos_a_descontar:
            supabase.table('inventario').update({"stock_disponible": pd["nuevo_stock"]}).eq("producto_id", pd["producto_id"]).execute()
            if pd["nuevo_stock"] <= pd["umbral_alerta"]:
                alertas_stock.append({
                    "producto_id": pd["producto_id"],
                    "stock_actual": pd["nuevo_stock"],
                    "umbral": pd["umbral_alerta"]
                })
            
        return orden_creada, alertas_stock
        
    except Exception as e:
        # Rebotar la excepción a FastAPI si falla
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Transacción abortada: {str(e)}")
