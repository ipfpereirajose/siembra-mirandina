import React, { useState } from 'react'
import './CartSidebar.css'

const CartSidebar = ({ cart, setCart, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [successId, setSuccessId] = useState(null)

  const total = cart.reduce((acc, item) => acc + (item.product.precio_base_usd * item.quantity), 0)

  const handleCheckout = async () => {
    setLoading(true)
    const payload = {
      metodo_pago: 'CREDITO_NET_30', // Fijo para MVP
      lineas: cart.map(item => ({
        producto_id: item.product.id,
        cantidad: item.quantity
      }))
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'
      // En entorno de pruebas pasamos los headers ficticios correspondientes a la empresa mock de tests_api
      // Nota: Si usaste IDs dinámicos en Supabase, debes ponerlos aquí en el front!
      // Como esto es un MVP, pasamos IDs hardcodeados que deberán ser extraídos del Context/Autenticación real:
      const res = await fetch(`${API_URL}/pedidos/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '00000000-0000-0000-0000-000000000000',
          'x-empresa-id': '00000000-0000-0000-0000-000000000000'
        },
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      if(res.ok) {
        setSuccessId(data.id)
        setCart([]) // Vaciamos carrito
      } else {
        alert("Error en la orden: " + (data.detail || JSON.stringify(data)))
      }
    } catch (e) {
      alert("Error de red contactando API")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cart-overlay">
      <div className="cart-sidebar glass-panel">
        <div className="cart-header">
          <h2>Bandeja de Despacho</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <div className="cart-items">
          {successId && (
            <div className="checkout-success">
              <span style={{fontSize: '3rem'}}>✅</span>
              <h3>¡Factura Generada!</h3>
              <p>ID: {successId.substring(0,8)}...</p>
              <p>El pedido está siendo procesado e inventario fue descontado.</p>
            </div>
          )}
          
          {!successId && cart.length === 0 && (
            <p className="text-muted" style={{textAlign:'center', marginTop: '2rem'}}>El carrito está vacío.</p>
          )}

          {!successId && cart.map((item, idx) => (
            <div key={idx} className="cart-item">
              <div className="cart-item-info">
                <h4>{item.product.nombre}</h4>
                <div className="text-muted" style={{fontSize: '0.85rem'}}>
                  {item.quantity} x ${item.product.precio_base_usd.toFixed(2)}
                </div>
              </div>
              <div className="cart-item-total">
                ${(item.quantity * item.product.precio_base_usd).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {!successId && cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary">
              <span>Total Estimado (USD)</span>
              <span style={{fontSize: '1.5rem', fontWeight:'bold', color: 'var(--arco-primary)'}}>${total.toFixed(2)}</span>
            </div>
            <button className="btn-primary" style={{width: '100%', padding: '1rem'}} onClick={handleCheckout} disabled={loading}>
              {loading ? 'Procesando Venta Segura...' : 'Confirmar Orden B2B'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartSidebar
