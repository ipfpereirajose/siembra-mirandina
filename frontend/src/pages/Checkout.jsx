import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../components/ProductCard.css'

const Checkout = ({ cart, setCart, user }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [successId, setSuccessId] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA_BANCARIA')

  const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'
  const total = cart.reduce((acc, item) => acc + ((item?.product?.precio_base_usd || 0) * (item?.quantity || 0)), 0)

  // Redirigir si no hay nada en el carrito
  if (cart.length === 0 && !successId) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <h2>Tu carrito está vacío</h2>
        <button className="btn-primary" onClick={() => navigate('/b2b')} style={{ marginTop: '2rem' }}>Volver al Catálogo</button>
      </div>
    )
  }

  const handleProcessPayment = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const payload = {
      metodo_pago: paymentMethod,
      lineas: cart.map(item => ({
        producto_id: item.product.id,
        cantidad: item.quantity
      }))
    }

    try {
      const res = await fetch(`${API}/pedidos/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '00000000-0000-0000-0000-000000000000',
          'x-empresa-id': user?.empresa_id || '00000000-0000-0000-0000-000000000000'
        },
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      if(res.ok) {
        setSuccessId(data.id)
        setCart([]) // Vaciar carrito tras la compra exitosa
      } else {
        alert("Error procesando pago: " + (data.detail || JSON.stringify(data)))
      }
    } catch (e) {
      alert("Error de red intentando procesar el pago.")
    } finally {
      setLoading(false)
    }
  }

  if (successId) {
    return (
      <div className="glass-panel fade-in" style={{ padding: '4rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ color: 'var(--miranda-primary)' }}>¡Pago Procesado Exitosamente!</h2>
        <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
          Tu orden <strong>#{successId.substring(0,8).toUpperCase()}</strong> ha sido registrada en nuestros servidores y el inventario ha sido asegurado para ti.
        </p>
        <button className="btn-outline" onClick={() => navigate('/cliente')}>Ir a mi Historial de Pedidos</button>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '3rem', alignItems: 'start' }}>
      
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <h2 style={{ borderBottom: '2px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '2rem' }}>Portal de Pagos</h2>
        
        <form onSubmit={handleProcessPayment}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Método de Facturación</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer' }}>
              <input type="radio" name="payment" value="TRANSFERENCIA_BANCARIA" checked={paymentMethod === 'TRANSFERENCIA_BANCARIA'} onChange={e => setPaymentMethod(e.target.value)} />
              <span>🏦 Transferencia Bancaria (Zelle / Banesco Panamá)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer' }}>
              <input type="radio" name="payment" value="TARJETA_CREDITO" checked={paymentMethod === 'TARJETA_CREDITO'} onChange={e => setPaymentMethod(e.target.value)} />
              <span>💳 Tarjeta de Crédito (Stripe)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer' }}>
              <input type="radio" name="payment" value="CREDITO_NET_30" checked={paymentMethod === 'CREDITO_NET_30'} onChange={e => setPaymentMethod(e.target.value)} />
              <span>📋 Crédito a 30 Días (Solo Clientes VIP)</span>
            </label>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '15px', fontSize: '1.2rem', background: 'var(--arco-primary)' }}>
            {loading ? 'Validando con el Banco...' : `Pagar $${total.toFixed(2)} USD y Procesar`}
          </button>
        </form>
      </div>

      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <h3 style={{ borderBottom: '2px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Resumen del Pedido</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cart.map((item, i) => (
             <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-glass)', paddingBottom: '0.8rem' }}>
               <div>
                 <p style={{ fontWeight: 'bold', margin: 0 }}>{item.product.nombre}</p>
                 <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>Cant: {item.quantity} {item.product.unidad_medida}</p>
               </div>
               <div style={{ fontWeight: 'bold' }}>
                 ${((item?.product?.precio_base_usd || 0) * item.quantity).toFixed(2)}
               </div>
             </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid var(--border-glass)' }}>
          <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Monto a Pagar:</span>
          <span style={{ fontSize: '1.5rem', color: 'var(--miranda-primary)', fontWeight: 'bold' }}>${total.toFixed(2)}</span>
        </div>
      </div>
      
    </div>
  )
}

export default Checkout
