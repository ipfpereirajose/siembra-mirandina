import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Catalog.css'

const CustomerDashboard = ({ user }) => {
  const [historial, setHistorial] = useState([])
  const [rubros, setRubros] = useState([])
  const [showPedidoForm, setShowPedidoForm] = useState(false)
  const [pedido, setPedido] = useState({ producto_id: '', cantidad: '', unidad: 'Sacos' })
  const [loading, setLoading] = useState(false)

  const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'
  const isB2B = user?.rol === 'CLIENTE_EMPRESA'

  useEffect(() => {
    cargarDatos()
    fetch(`${API}/productos/`).then(res => {
      if(res.ok) return res.json()
      return []
    }).then(data => setRubros(data || []))
  }, [])

  const cargarDatos = () => {
    fetch(`${API}/pedidos/historial`, {
      method: 'GET',
      headers: {
        'x-user-id': user?.id,
        'x-empresa-id': user?.empresa_id
      }
    })
    .then(res => res.ok ? res.json() : [])
    .then(data => setHistorial(data || []))
    .catch(() => setHistorial([]))
  }

  const handleCustomPedido = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
       await fetch(`${API}/solicitudes/crear`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': user.id
          },
          body: JSON.stringify({
             producto_id: pedido.producto_id,
             cantidad: parseFloat(pedido.cantidad),
             unidad_medida: pedido.unidad
          })
       })
       alert("Pedido personalizado enviado. El administrador asignará el precio y te notificará por SMS/Web.")
       setShowPedidoForm(false)
       setPedido({ producto_id: '', cantidad: '', unidad: 'Sacos' })
    } catch (e) {
       console.error(e)
    } finally {
       setLoading(false)
    }
  }

  // Cálculos de KPIs Financieros
  const totalPedidos = historial.length
  const montoInvertido = historial.reduce((acc, obj) => acc + (obj.total_usd || 0), 0)
  
  const getStatusBadge = (estado) => {
    const st = (estado || 'PENDIENTE').toUpperCase()
    if(st === 'COMPLETADO' || st === 'ENTREGADO') return <span style={{padding: '4px 8px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.1)', color: '#10b981', fontSize: '0.8rem'}}>🟢 Completado</span>
    if(st === 'PROCESANDO' || st === 'APROBADO') return <span style={{padding: '4px 8px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '0.8rem'}}>🔵 En Proceso</span>
    return <span style={{padding: '4px 8px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.1)', color: '#f59e0b', fontSize: '0.8rem'}}>🟡 Pendiente / Por Pagar</span>
  }

  return (
    <div style={{ padding: '2rem 0' }} className="fade-in">
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1>{isB2B ? 'Portal B2B Corporativo' : 'Mi Mercado B2C'}</h1>
            <p className="text-muted">Bienvenido, {user?.nombre_completo || 'Cliente'}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/b2b">
              <button className="btn-outline">🛒 Ir al Catálogo</button>
            </Link>
            <button className="btn-primary" onClick={() => setShowPedidoForm(!showPedidoForm)}>
               {showPedidoForm ? 'Volver al Historial' : '🚀 Solicitar Requisición Especial'}
            </button>
          </div>
       </div>

       {/* Panel de Métricas Rápidas (KPIs) */}
       {!showPedidoForm && (
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Compras Realizadas</p>
              <h2 style={{ color: 'var(--arco-primary)' }}>{totalPedidos}</h2>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Monto Histórico Invertido</p>
              <h2 style={{ color: 'var(--miranda-primary)' }}>${montoInvertido.toFixed(2)}</h2>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Estatus de Último Pedido</p>
              <div>{totalPedidos > 0 ? getStatusBadge(historial[0].estado) : <span className="text-muted">N/A</span>}</div>
            </div>
         </div>
       )}

       {showPedidoForm ? (
          <div className="glass-panel fade-in" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
             <h3>Crear Requisición Especial</h3>
             <p className="text-muted" style={{ marginBottom: '2rem' }}>
                Selecciona el rubro y la cantidad corporativa que necesitas. Nuestro administrador evaluará los volúmenes, fijará el precio competitivo y <strong>te notificará inmediatamente al procesarlo</strong>.
             </p>
             <form onSubmit={handleCustomPedido} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                   <label>Verdura / Rubro Requerido</label>
                   <select className="glass-input" value={pedido.producto_id} onChange={e => setPedido({...pedido, producto_id: e.target.value})} required>
                      <option value="">Seleccione el rubro principal...</option>
                      {rubros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                   </select>
                </div>
                <div className="form-group">
                   <label>Cantidad Solicitada</label>
                   <input type="number" placeholder="Ej: 50" className="glass-input" value={pedido.cantidad} onChange={e => setPedido({...pedido, cantidad: e.target.value})} required />
                </div>
                <div className="form-group">
                   <label>Unidad de Medida (Logística)</label>
                   <select className="glass-input" value={pedido.unidad} onChange={e => setPedido({...pedido, unidad: e.target.value})}>
                      <option value="Sacos">Sacos Industriales</option>
                      <option value="Kg">Kilogramos</option>
                      <option value="Huacales">Huacales</option>
                      <option value="Cajas">Cajas</option>
                   </select>
                </div>
                <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2', padding: '1rem' }} disabled={loading}>
                   {loading ? 'Transmitiendo Requisición...' : 'Confirmar Solicitud de Pedido Especial'}
                </button>
             </form>
          </div>
       ) : (
          <div className="glass-panel fade-in" style={{ padding: '2.5rem' }}>
             <h3 style={{ marginBottom: '2rem' }}>Operaciones Autorizadas (Historial)</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {historial.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📦</div>
                    <p className="text-muted">Aún no tienes facturas registradas en el sistema.</p>
                    <Link to="/b2b">
                      <button className="btn-primary" style={{ marginTop: '1.5rem' }}>Explorar el Catálogo B2B</button>
                    </Link>
                  </div>
                ) : (
                   historial.map(ped => (
                      <div key={ped.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Orden Tracking: #{ped.id.substring(0,8).toUpperCase()}</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                              <span>📅 {new Date(ped.created_at).toLocaleDateString()}</span>
                              <span>💳 {ped.metodo_pago.replace(/_/g, ' ')}</span>
                            </div>
                         </div>
                         <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                            <div>{getStatusBadge(ped.estado)}</div>
                            <div style={{ textAlign: 'right' }}>
                               <div style={{ fontWeight: 'bold', color: 'var(--miranda-primary)', fontSize: '1.3rem' }}>${ped.total_usd.toFixed(2)}</div>
                               <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Monto Neto (USD)</div>
                            </div>
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>
       )}

       {/* Banner Fijo de Pedidos Especiales (Restaurado para mayor visibilidad) */}
       {!showPedidoForm && (
         <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', marginTop: '3rem', borderTop: '2px solid var(--miranda-primary)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🚛</div>
            <h3 style={{ color: 'var(--miranda-primary)' }}>¿Necesitas volúmenes especiales o rubros fuera de catálogo?</h3>
            <p className="text-muted" style={{ marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
              Utiliza nuestro canal de requisición especial. Especifica el rubro, la cantidad y nos encargaremos de cotizarte el mejor precio nacional.
            </p>
            <button className="btn-primary" onClick={() => {
              setShowPedidoForm(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              🚀 Iniciar Requisición Especial
            </button>
         </div>
       )}
    </div>
  )
}

export default CustomerDashboard
