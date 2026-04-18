import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './CartSidebar.css'

const CartSidebar = ({ cart, setCart, isAuthenticated, onClose }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [successId, setSuccessId] = useState(null)

  const total = cart.reduce((acc, item) => acc + ((item?.product?.precio_base_usd || 0) * (item?.quantity || 0)), 0)

  // Verificar si hay productos en el carrito
  const hasItems = cart.length > 0

  // Limpiar estado de éxito cuando se cierra el sidebar
  useEffect(() => {
    if (!onClose) return
    setSuccessId(null)
  }, [onClose])

  const handleGoToCheckout = () => {
    onClose()
    navigate('/checkout')
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
            <div style={{textAlign:'center', marginTop: '2rem'}}>
              <p className="text-muted">El carrito está vacío.</p>
              <p className="text-muted" style={{fontSize: '0.9rem', marginTop: '1rem'}}>
                🛒 <strong>Agrega productos</strong> para continuar. 
                <br />
                <span style={{color: 'var(--arco-primary)', cursor: 'pointer', textDecoration: 'underline'}} onClick={() => { onClose(); navigate('/login'); }}>¿Ya tienes cuenta? Inicia sesión</span>
              </p>
            </div>
          )}

          {!successId && cart.map((item, idx) => {
            if (!item?.product) return null; // Ignorar items corruptos
            return (
            <div key={idx} className="cart-item">
              <div className="cart-item-info">
                <h4>{item.product.nombre}</h4>
                <div className="text-muted" style={{fontSize: '0.85rem', display: 'flex', gap: '10px', alignItems: 'center'}}>
                  {item.quantity} {item.product.unidad_medida || 'Unidad(es)'} x ${item.product.precio_base_usd?.toFixed(2)}
                  <span 
                    style={{color: 'var(--acento-alerta, #ef4444)', cursor: 'pointer', padding: '2px 6px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px'}}
                    onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))}
                  >
                    🗑️ Borrar
                  </span>
                </div>
              </div>
              <div className="cart-item-total">
                ${(item.quantity * (item.product.precio_base_usd || 0)).toFixed(2)}
              </div>
            </div>
          )})}
        </div>

        {!successId && cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary">
              <span>Total Estimado (USD)</span>
              <span style={{fontSize: '1.5rem', fontWeight:'bold', color: 'var(--arco-primary)'}}>${total.toFixed(2)}</span>
            </div>
            <button 
              className="btn-primary" 
              style={{width: '100%', padding: '1rem'}} 
              onClick={() => {
                if (!isAuthenticated) {
                  alert('Para confirmar tu orden y facturar, por favor regístrate o inicia sesión.')
                  onClose()
                  navigate('/login')
                } else {
                  handleGoToCheckout()
                }
              }} 
            >
              {isAuthenticated ? 'Ir al Portal de Pagos ➔' : 'Inicia Sesión para Pagar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartSidebar
