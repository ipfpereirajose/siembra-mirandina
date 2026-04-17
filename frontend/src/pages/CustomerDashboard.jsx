import React, { useState, useEffect } from 'react'
import './Catalog.css'

const CustomerDashboard = () => {
  const [historial, setHistorial] = useState([])
  const [rubros, setRubros] = useState([])
  const [showPedidoForm, setShowPedidoForm] = useState(false)
  const [pedido, setPedido] = useState({ producto_id: '', cantidad: '', unidad: 'Sacos' })
  const [loading, setLoading] = useState(false)

  const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'

  useEffect(() => {
    cargarDatos()
    fetch(`${API}/productos/`).then(res => res.json()).then(data => setRubros(data))
  }, [])

  const cargarDatos = () => {
    fetch(`${API}/pedidos/historial`, {
      method: 'GET',
      headers: {
        'x-user-id': '00000000-0000-0000-0000-000000000000',
        'x-empresa-id': '00000000-0000-0000-0000-000000000000'
      }
    })
    .then(res => res.json())
    .then(data => setHistorial(data))
  }

  const handleCustomPedido = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
       await fetch(`${API}/solicitudes/crear`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': '00000000-0000-0000-0000-000000000000'
          },
          body: JSON.stringify({
             producto_id: pedido.producto_id,
             cantidad: parseFloat(pedido.cantidad),
             unidad_medida: pedido.unidad
          })
       })
       alert("Pedido personalizado enviado. El administrador asignará el precio y notificará la disponibilidad.")
       setShowPedidoForm(false)
       setPedido({ producto_id: '', cantidad: '', unidad: 'Sacos' })
    } catch (e) {
       console.error(e)
    } finally {
       setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem 0' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Mi Panel <span className="text-gradient">Siembra Mirandina</span></h1>
          <button className="btn-primary" onClick={() => setShowPedidoForm(!showPedidoForm)}>
             {showPedidoForm ? 'Ver Historial' : '🚀 Nuevo Pedido Personalizado'}
          </button>
       </div>

       {showPedidoForm ? (
          <div className="glass-panel" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
             <h3>Crear Pedido a Medida</h3>
             <p className="text-muted" style={{ marginBottom: '2rem' }}>Selecciona el rubro y la cantidad necesaria. El administrador procesará tu solicitud.</p>
             <form onSubmit={handleCustomPedido} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                   <label>Verdura / Rubro</label>
                   <select className="glass-input" value={pedido.producto_id} onChange={e => setPedido({...pedido, producto_id: e.target.value})} required>
                      <option value="">Seleccione...</option>
                      {rubros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                   </select>
                </div>
                <div className="form-group">
                   <label>Cantidad</label>
                   <input type="number" className="glass-input" value={pedido.cantidad} onChange={e => setPedido({...pedido, cantidad: e.target.value})} required />
                </div>
                <div className="form-group">
                   <label>Unidad de Medida</label>
                   <select className="glass-input" value={pedido.unidad} onChange={e => setPedido({...pedido, unidad: e.target.value})}>
                      <option value="Sacos">Sacos</option>
                      <option value="Kg">Kg</option>
                      <option value="Huacales">Huacales</option>
                      <option value="Cajas">Cajas</option>
                   </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2', textAlign: 'center', background: 'rgba(52, 211, 153, 0.05)', padding: '1rem', borderRadius: '8px' }}>
                   <p style={{ fontSize: '0.85rem' }}>* Los precios serán establecidos por el administrador según el mercado actual.</p>
                </div>
                <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2', padding: '1rem' }} disabled={loading}>
                   {loading ? 'Enviando...' : 'Confirmar Solicitud de Pedido'}
                </button>
             </form>
          </div>
       ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
             <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3>Historial de Pedidos</h3>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   {historial.length === 0 ? <p className="text-muted">No hay facturas registradas aún.</p> : (
                      historial.map(ped => (
                         <div key={ped.id} className="glass-card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                               <div style={{ fontWeight: 'bold' }}>Pedido Agrotech #{ped.id.substring(0,8)}</div>
                               <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(ped.created_at).toLocaleDateString()} • {ped.metodo_pago}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                               <div style={{ fontWeight: 'bold', color: 'var(--miranda-primary)', fontSize: '1.2rem' }}>${ped.total_usd.toFixed(2)}</div>
                               <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>USD Ref BCV</div>
                            </div>
                         </div>
                      ))
                   )}
                </div>
             </div>

             <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                <h3>¿Necesitas algo más?</h3>
                <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Si no encuentras lo que buscas en el catálogo, usa el pedido personalizado.</p>
                <button className="btn-outline" onClick={() => setShowPedidoForm(true)}>Hacer Pedido Especial</button>
             </div>
          </div>
       )}
    </div>
  )
}

export default CustomerDashboard
