import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../components/ProductCard.css'
import { useBCV } from '../hooks/useBCV'
import PaymentInstructions from '../components/PaymentInstructions'


const Checkout = ({ cart, setCart, user }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [successId, setSuccessId] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA_BANCARIA')

  const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'
  const total = cart.reduce((acc, item) => acc + ((item?.product?.precio_base_usd || 0) * (item?.quantity || 0)), 0)
  const { tasa, fecha, aBs } = useBCV()

  // Redirigir si no hay nada en el carrito
  if (cart.length === 0 && !successId) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <h2>Tu carrito está vacío</h2>
        <button className="btn-primary" onClick={() => navigate('/b2b')} style={{ marginTop: '2rem' }}>Volver al Catálogo</button>
      </div>
    )
  }

  const [finalTotal, setFinalTotal] = useState(0)

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
        setFinalTotal(total)
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
      <div className="glass-panel fade-in" style={{ padding: '4rem', textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ color: 'var(--miranda-primary)' }}>¡Órden Generada con Éxito!</h2>
        <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
          Tu pedido <strong>#{successId.substring(0,8).toUpperCase()}</strong> ha sido reservado.
        </p>

        <PaymentInstructions 
          method={paymentMethod} 
          amountUsd={finalTotal.toFixed(2)} 
          amountBs={aBs(finalTotal)} 
        />

        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-outline" onClick={() => navigate('/cliente')}>Ver Historial y Reportar Pago</button>
          <button className="btn-primary" onClick={() => navigate('/b2b')}>Seguir Comprando</button>
        </div>
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'TRANSFERENCIA_BANCARIA' ? 'rgba(52, 211, 153, 0.05)' : 'transparent' }}>
              <input type="radio" name="payment" value="TRANSFERENCIA_BANCARIA" checked={paymentMethod === 'TRANSFERENCIA_BANCARIA'} onChange={e => setPaymentMethod(e.target.value)} />
              <span>🏦 Transferencia Bancaria Nacional</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'PAGO_MOVIL' ? 'rgba(52, 211, 153, 0.05)' : 'transparent' }}>
              <input type="radio" name="payment" value="PAGO_MOVIL" checked={paymentMethod === 'PAGO_MOVIL'} onChange={e => setPaymentMethod(e.target.value)} />
              <span>📱 Pago Móvil (Instante)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'ZELLE' ? 'rgba(52, 211, 153, 0.05)' : 'transparent' }}>
              <input type="radio" name="payment" value="ZELLE" checked={paymentMethod === 'ZELLE'} onChange={e => setPaymentMethod(e.target.value)} />
              <span>💵 Zelle (USD)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'PAYPAL' ? 'rgba(52, 211, 153, 0.05)' : 'transparent' }}>
              <input type="radio" name="payment" value="PAYPAL" checked={paymentMethod === 'PAYPAL'} onChange={e => setPaymentMethod(e.target.value)} />
              <span>💳 PayPal</span>
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
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', color: 'var(--miranda-primary)', fontWeight: 'bold' }}>$ {total.toFixed(2)} USD</div>
            <div style={{ fontSize: '1.1rem', color: '#34D399', fontWeight: 'bold' }}>{aBs(total)}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tasa BCV: Bs. {tasa.toLocaleString('es-VE')} · {fecha}</div>
          </div>
        </div>
      </div>
      
    </div>
  )
}

export default Checkout
