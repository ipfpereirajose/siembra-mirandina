import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './Catalog.css' // Reutilizar paleta general

const AdminDashboard = ({ user }) => {
  const [stats, setStats] = useState(null)
  const [ofertaDemanda, setOfertaDemanda] = useState({ solicitudes: [], inventario_actual: [] })
  const [pedidosRegulares, setPedidosRegulares] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSupport, setShowSupport] = useState(false)

  const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'

  useEffect(() => {
    cargarTodo()
  }, [])

  const cargarTodo = async () => {
    try {
      const [resStats, resOD] = await Promise.all([
        fetch(`${API}/admin/dashboard-stats`, { headers: { 'x-user-id': user.id, 'x-empresa-id': user.empresa_id } }),
        fetch(`${API}/solicitudes/oferta-demanda`, { headers: { 'x-user-id': user.id, 'x-empresa-id': user.empresa_id } })
      ])
      
      const dataStats = await resStats.json()
      const dataOD = await resOD.json()
      
      setStats(resStats.ok ? dataStats : null)
      setOfertaDemanda(resOD.ok ? dataOD : { solicitudes: [], inventario_actual: [] })
      
      setPedidosRegulares([])
      setLoading(false)
    } catch (err) {
      console.error("Error Admin", err)
    } finally {
      setLoading(false)
    }
  }

  const broadcastAlerta = async (id_solicitud) => {
    try {
      await fetch(`${API}/admin/solicitudes/${id_solicitud}/alertar`, {
        method: 'POST',
        headers: { 'x-user-id': user.id, 'x-empresa-id': user.empresa_id }
      })
      alert("Demanda lanzada a los productores.")
      cargarTodo()
    } catch (err) {
      alert("Error al alertar")
    }
  }

  const confirmarPago = async (pedido_id, esPersonalizado) => {
    try {
      await fetch(`${API}/admin/pagos/confirmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id, 'x-empresa-id': user.empresa_id },
        body: JSON.stringify({ pedido_id: pedido_id, es_personalizado: esPersonalizado })
      })
      alert("Pago verificado. Se notificará para despachos.")
      cargarTodo()
    } catch (err) {
      alert("Error verificando pago.")
    }
  }

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await fetch(`${API}/solicitudes/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-empresa-id': user.empresa_id
        },
        body: JSON.stringify({ id_orden: id, nuevo_estado: nuevoEstado })
      })
      cargarTodo()
    } catch (err) {
      alert("Error contactando backend")
    }
  }

  if (loading) return <div className="loading-state">Desplegando Oasis Administrativo...</div>

  return (
    <div style={{ padding: '2rem 0' }}>
      
      {/* HEADER SIEMBRA MIRANDINA */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Siembra <span className="text-gradient">Mirandina</span> Admin</h2>
          <p className="text-muted">Gestión de inventario real-time y solicitudes personalizadas.</p>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', gap: '2rem', alignItems: 'center' }}>
           <div style={{ textAlign: 'left' }}>
               <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ventas (USD Ref BCV)</div>
               <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--miranda-primary)' }}>
                 ${(stats?.kpis?.ingresos_globales_usd || 0).toLocaleString()}
               </div>
           </div>
           
           {/* Botón de Soporte Oculto */}
           <div style={{ position: 'relative' }}>
              <button className="btn-outline" onClick={() => setShowSupport(!showSupport)}>🛠️ Soporte</button>
              {showSupport && (
                <div className="glass-panel" style={{ position: 'absolute', top: '100%', right: 0, width: '250px', padding: '1rem', marginTop: '10px', zIndex: 1000 }}>
                   <p style={{ fontSize: '0.85rem' }}>Contacto Desarrollador:</p>
                   <p style={{ fontWeight: 'bold', color: 'var(--miranda-accent)' }}>+58 412 5819477</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* BLOQUE ESTADÍSTICAS Y VENTAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
         <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3>Ventas Consolidadas</h3>
            <div style={{ width: '100%', height: 350 }}>
               <ResponsiveContainer>
                  <BarChart data={stats?.grafico_ventas || []}>
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                     <XAxis dataKey="mes" stroke="var(--text-muted)" />
                     <YAxis stroke="var(--text-muted)" />
                     <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--miranda-primary)' }} />
                     <Bar dataKey="ventas" name="Monto (USD)" fill="var(--miranda-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
         <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3>Alertas de Abastecimiento</h3>
            {(stats?.top_productos || []).map((p, idx) => (
               <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--border-glass)' }}>
                  <span>{p.nombre}</span>
                  <span style={{ fontWeight: 'bold', color: p.stock_restante < 10 ? '#ef4444' : '#34D399' }}>{p.stock_restante} {p.um || 'Unidades'}</span>
               </div>
            ))}
         </div>
           {/* BLOQUE REQUISICIONES / SUBASTAS / PAGOS REGULARES */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Evaluador Central: Requisiciones y Pagos (B2B & Regular)</h3>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>Verificando {ofertaDemanda.solicitudes?.length || 0} operaciones</span>
         </div>
         
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            {(!ofertaDemanda?.solicitudes || ofertaDemanda.solicitudes.length === 0) ? <p className="text-muted">Sin flujo transaccional activo.</p> : (
               ofertaDemanda.solicitudes.map(sol => (
                  <div key={sol.id} className="glass-card fade-in" style={{ 
                     padding: '1.5rem', 
                     borderLeft: sol.estado === 'PENDIENTE' ? '4px solid var(--miranda-primary)' : 
                                sol.estado === 'ESPERA_PAGO' || sol.estado === 'PAGO_POR_VERIFICAR' ? '4px solid #34D399' : 
                                sol.estado === 'EJECUTAR' ? '4px solid #10b981' : '4px solid #F59E0B' 
                  }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{sol.es_personalizado ? (sol.productos?.nombre || 'Especial') : 'Orden Regular'}</div>
                        <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>#{sol.id?.substring(0,8).toUpperCase()}</span>
                     </div>
                     
                     <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cliente: {sol.perfiles?.nombre_completo || 'N/A'}</div>
                     
                     {sol.es_personalizado ? (
                        <div style={{ marginTop: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Solicita: {sol.cantidad} {sol.unidad_medida}</div>
                     ) : (
                        <div style={{ marginTop: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Total: ${sol.total_usd} USD</div>
                     )}
                     
                     <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>ESTADO: <strong style={{ color: 'var(--arco-primary)' }}>{sol.estado}</strong></p>
                     
                     {/* COMPROBANTE UNIFICADO */}
                     {sol.url_comprobante && (
                        <div style={{ marginTop: '1rem', background: 'rgba(52,211,153,0.1)', padding: '10px', borderRadius: '8px' }}>
                           <p style={{fontSize:'0.8rem', marginBottom:'5px'}}>💳 Comprobante / Referencia:</p>
                           {sol.url_comprobante.startsWith('http') || sol.url_comprobante.startsWith('data:image') ? (
                              <a href={sol.url_comprobante} target="_blank" rel="noreferrer" style={{color: '#34D399', fontSize: '0.85rem', fontWeight: 'bold', textDecoration: 'underline'}}>Ver Imagen Adjunta ↗</a>
                           ) : (
                              <span style={{color: '#34D399', fontSize: '0.9rem', fontWeight: 'bold'}}>{sol.url_comprobante}</span>
                           )}
                        </div>
                     )}
                     
                     <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {sol.estado === 'PENDIENTE' && sol.es_personalizado && (
                           <>
                             <button className="btn-primary" style={{ flex: 1, fontSize: '0.75rem', padding: '8px' }} onClick={() => cambiarEstado(sol.id, 'CONTRA_OFERTA')}>✅ Abastecer Central</button>
                             <button className="btn-outline" style={{ flex: 1, fontSize: '0.75rem', padding: '8px' }} onClick={() => broadcastAlerta(sol.id)}>📡 Auxilio a Productores</button>
                           </>
                        )}
                        
                        {sol.estado === 'SUBASTA_ABIERTA' && (
                           <button className="btn-primary" style={{ width: '100%', fontSize: '0.85rem' }} onClick={() => cambiarEstado(sol.id, 'CONTRA_OFERTA')}>Cerrar Subasta & Mover Contra-Oferta</button>
                        )}

                        {(sol.estado === 'PAGO_POR_VERIFICAR' || sol.estado === 'ESPERA_PAGO') && (
                           <button className="btn-primary" style={{ width: '100%', background: '#34D399', color: 'black', fontWeight: 'bold', fontSize: '0.85rem' }} onClick={() => confirmarPago(sol.id, sol.es_personalizado)}>🛠 Verificar Pago & Procesar Despachos</button>
                        )}

                        {sol.estado === 'PROCESANDO' && (
                           <button className="btn-outline" style={{ width: '100%', fontSize: '0.85rem', color: '#10b981', borderColor: '#10b981' }} disabled>Pedido en Despacho Logístico</button>
                        )}
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>

      {/* BLOQUE INVENTARIO SENCILLO (ANTES PESTAÑA) */}

      <div className="glass-panel" style={{ padding: '2rem' }}>
         <h3>Inventario Centralizado</h3>
         <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
               <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '12px' }}>Producto</th>
                  <th style={{ padding: '12px' }}>Stock Global</th>
                  <th style={{ padding: '12px' }}>Estado</th>
                  <th style={{ padding: '12px' }}>Última Actualización</th>
               </tr>
            </thead>
            <tbody>
               {(ofertaDemanda?.inventario_actual || []).length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay inventario centralizado registrado.</td></tr>
               ) : (
                 (ofertaDemanda?.inventario_actual || []).map((item, idx) => (
                   <tr key={idx} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '12px' }}>{item.productos?.nombre || 'Desconocido'}</td>
                     <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.stock_disponible} {item.productos?.unidad_medida || 'Unidades'}</td>
                     <td style={{ padding: '12px' }}>
                        <span style={{ 
                           padding: '4px 8px', 
                           borderRadius: '4px', 
                           fontSize: '0.75rem',
                           background: item.stock_disponible > 50 ? 'rgba(52, 211, 153, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                           color: item.stock_disponible > 50 ? '#34D399' : '#ef4444'
                        }}>
                           {item.stock_disponible > 50 ? 'SUFICIENTE' : 'BAJO'}
                        </span>
                     </td>
                     <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(item.ultima_actualizacion).toLocaleString()}</td>
                  </tr>
                 ))
               )}
            </tbody>
         </table>
      </div>

    </div>
  )
}

export default AdminDashboard
