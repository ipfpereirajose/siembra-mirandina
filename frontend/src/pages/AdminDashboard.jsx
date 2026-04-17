import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './Catalog.css' // Reutilizar paleta general

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [ofertaDemanda, setOfertaDemanda] = useState({ solicitudes: [], inventario_actual: [] })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('STATS') // STATS | INVENTARIO | PEDIDOS_ESP
  const [showSupport, setShowSupport] = useState(false)

  const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'

  useEffect(() => {
    cargarTodo()
  }, [])

  const cargarTodo = async () => {
    try {
      const [resStats, resOD] = await Promise.all([
        fetch(`${API}/admin/dashboard-stats`, { headers: { 'x-user-id': 'admin', 'x-empresa-id': 'admin' } }),
        fetch(`${API}/solicitudes/oferta-demanda`, { headers: { 'x-user-id': 'admin', 'x-empresa-id': 'admin' } })
      ])
      
      const dataStats = await resStats.json()
      const dataOD = await resOD.json()
      
      setStats(dataStats)
      setOfertaDemanda(dataOD)
      setLoading(false)
    } catch (err) {
      console.error("Error Admin", err)
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
                 ${stats?.kpis?.ingresos_globales_usd?.toLocaleString()}
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

      {/* TABS DE NAVEGACIÓN */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
         <button className={`btn-outline ${activeTab === 'STATS' ? 'miranda-tab-active' : ''}`} onClick={() => setActiveTab('STATS')}>📊 Estadísticas</button>
         <button className={`btn-outline ${activeTab === 'INVENTARIO' ? 'miranda-tab-active' : ''}`} onClick={() => setActiveTab('INVENTARIO')}>📦 Inventario Real-Time</button>
         <button className={`btn-outline ${activeTab === 'PEDIDOS_ESP' ? 'miranda-tab-active' : ''}`} onClick={() => setActiveTab('PEDIDOS_ESP')}>📝 Pedidos Personalizados</button>
      </div>

      {activeTab === 'STATS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3>Ventas Consolidadas</h3>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <BarChart data={stats.grafico_ventas}>
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
              {stats.top_productos.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--border-glass)' }}>
                  <span>{p.nombre}</span>
                  <span style={{ fontWeight: 'bold', color: p.stock_restante < 10 ? '#ef4444' : '#34D399' }}>{p.stock_restante} kg</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {activeTab === 'INVENTARIO' && (
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
                 {ofertaDemanda.inventario_actual.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                       <td style={{ padding: '12px' }}>{item.productos?.nombre}</td>
                       <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.stock_disponible} kg</td>
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
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {activeTab === 'PEDIDOS_ESP' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
           <h3>Tablero Oferta y Demanda (Personalizados)</h3>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              {ofertaDemanda.solicitudes.length === 0 ? <p className="text-muted">Sin solicitudes pendientes.</p> : (
                 ofertaDemanda.solicitudes.map(sol => (
                    <div key={sol.id} className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--miranda-primary)' }}>
                       <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{sol.productos?.nombre}</div>
                       <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cliente: {sol.perfiles?.nombre_completo}</div>
                       <div style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>{sol.cantidad} {sol.unidad_medida}</div>
                       <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Estado: {sol.estado}</p>
                       <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-primary" style={{ flex: 1, fontSize: '0.85rem' }}>Despachar Almacén</button>
                          <button className="btn-outline" style={{ flex: 1, fontSize: '0.85rem' }}>Poner en Espera</button>
                       </div>
                    </div>
                 ))
              )}
           </div>
        </div>
      )}

    </div>
  )
}
  )
}

export default AdminDashboard
