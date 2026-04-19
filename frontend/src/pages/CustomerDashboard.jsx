import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Catalog.css'
import PaymentInstructions from '../components/PaymentInstructions'
import { useBCV } from '../hooks/useBCV'


const CustomerDashboard = ({ user }) => {
  const [historial, setHistorial] = useState([])
  const [misSolicitudes, setMisSolicitudes] = useState([])
  const [rubros, setRubros] = useState([])
  const [fullProfile, setFullProfile] = useState(null)
  
  // Dinámica de Lotes y Requisición Masiva
  const [showPedidoForm, setShowPedidoForm] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [reqRows, setReqRows] = useState([{ id: Date.now(), producto_id: '', cantidad: 1 }])
  const [loading, setLoading] = useState(false)
  
  // Checkout Modal B2B
  const [ordenActivaPago, setOrdenActivaPago] = useState(null)
  const [reciboBase64, setReciboBase64] = useState('')

  const { aBs } = useBCV()
  const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'
  const isB2B = user?.rol === 'CLIENTE_EMPRESA'


  useEffect(() => {
    cargarDatos()
    // Traer Catálogo B2B para referencias
    fetch(`${API}/productos/`).then(res => res.ok ? res.json() : []).then(data => setRubros(data || []))
    // Traer Perfil Fiscal Completo
    fetch(`${API}/auth/me`, {
       headers: { 'x-user-id': user?.id }
    }).then(res => res.ok ? res.json() : null).then(data => setFullProfile(data))
  }, [])

  const cargarDatos = () => {
    const headers = { 'x-user-id': user?.id, 'x-empresa-id': user?.empresa_id }
    
    // Historial Compras Regulares
    fetch(`${API}/pedidos/historial`, { headers })
    .then(res => res.ok ? res.json() : []).then(data => setHistorial(data || [])).catch(() => {})

    // Historial Solicitudes
    fetch(`${API}/solicitudes/mis-solicitudes`, { headers })
    .then(res => res.ok ? res.json() : []).then(data => setMisSolicitudes(data || [])).catch(() => {})
  }

  const handleAddRow = () => {
    if (reqRows.length >= 20) return alert("Máximo 20 líneas por nota de requisición.")
    setReqRows([...reqRows, { id: Date.now(), producto_id: '', cantidad: 1 }])
  }

  const handleRemoveRow = (id) => {
    if (reqRows.length === 1) return
    setReqRows(reqRows.filter(r => r.id !== id))
  }

  const handleRowChange = (id, field, value) => {
    setReqRows(reqRows.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  // Lógica de Previsualización Matemática
  const getProductInfo = (pid) => rubros.find(r => r.id === pid)
  const subtotalReferencial = reqRows.reduce((acc, row) => {
     const p = getProductInfo(row.producto_id);
     if(!p) return acc;
     return acc + (parseFloat(p.precio_base_usd || 0) * parseFloat(row.cantidad || 0));
  }, 0)

  const handleTransmitirFactura = async () => {
    if (reqRows.some(r => !r.producto_id || r.cantidad <= 0)) {
       return alert("Por favor completa válidamente todas las filas antes de emitir.")
    }

    setLoading(true)
    const lineasPay = reqRows.map(r => {
        const p = getProductInfo(r.producto_id)
        return {
           producto_id: r.producto_id,
           cantidad: parseFloat(r.cantidad),
           unidad_medida: p ? p.unidad_medida : "N/A"
        }
    })

    try {
       const res = await fetch(`${API}/solicitudes/crear`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
          body: JSON.stringify({ filas: lineasPay })
       })
       if(res.ok) {
           alert("Requisición masiva transmitida. El administrador negociará y le notificará el estatus.")
           setShowPedidoForm(false)
           setIsPreviewMode(false)
           setReqRows([{ id: Date.now(), producto_id: '', cantidad: 1 }])
           cargarDatos() // Refrescar tablas
       } else {
           alert("Hubo un error contactando el sistema B2B.")
       }
    } catch (e) {
       console.error(e)
    } finally {
       setLoading(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if(!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
       setReciboBase64(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const enviarRecibo = async () => {
    if(!reciboBase64) return alert("Por favor cargue la foto de su factura/transferencia.")
    setLoading(true)
    try {
      const res = await fetch(`${API}/solicitudes/pago`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
         body: JSON.stringify({ id_orden: ordenActivaPago, url_comprobante: reciboBase64 })
      })
      if(res.ok) {
         alert("¡Pago procesado exitosamente! El administrador lo verificará para el despacho.")
         setOrdenActivaPago(null)
         setReciboBase64('')
         cargarDatos()
      } else {
         alert("Error procesando pago.")
      }
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (estado) => {
    const st = (estado || 'PENDIENTE').toUpperCase()
    if(st === 'COMPLETADO' || st === 'EJECUTADO' || st === 'ENTREGADO' || st === 'APROBADO_FINAL') return <span style={{padding: '4px 8px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.1)', color: '#10b981', fontSize: '0.8rem'}}>🟢 Aprobado / Listo</span>
    if(st === 'CONTRA_OFERTA') return <span style={{padding: '4px 8px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #ef4444'}}>🚨 ACCIÓN REQUERIDA (OFERTA LISTA)</span>
    if(st === 'PAGO_POR_VERIFICAR') return <span style={{padding: '4px 8px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '0.8rem'}}>⏳ Recibo Anexado (Auditoría)</span>
    if(st === 'PROCESANDO' || st === 'SUBASTA_ABIERTA' || st === 'APROBADO' || st === 'PENDIENTE_COTIZACION') return <span style={{padding: '4px 8px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '0.8rem'}}>🔵 Negociando/Evaluando</span>
    return <span style={{padding: '4px 8px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.1)', color: '#f59e0b', fontSize: '0.8rem'}}>🟡 Pendiente Base</span>
  }

  const handleCancelarPedido = async (pedido_id) => {
    if (!window.confirm("¿Seguro que deseas cancelar este pedido? Se liberará la mercancía retenida.")) return;
    setLoading(true)
    try {
      const res = await fetch(`${API}/pedidos/${pedido_id}/cancelar`, {
        method: 'POST',
        headers: { 'x-user-id': user.id, 'x-empresa-id': user.empresa_id || '' }
      })
      if (res.ok) {
        alert("Pedido cancelado y stock retornado exitosamente.")
        cargarDatos()
      } else {
        alert("Error al cancelar.")
      }
    } catch(e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleReportarPago = async (pedido_id) => {
    const ref = window.prompt("Por favor, introduzca el Número de Referencia Bancaria (Ej: 00452312):")
    if (!ref) return;
    setLoading(true)
    try {
      const res = await fetch(`${API}/pagos/reportar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id, 'x-empresa-id': user.empresa_id || '' },
        body: JSON.stringify({ pedido_id, referencia: ref })
      })
      if(res.ok){
        alert("Pago enviado a verificación. El administrador lo revisará brevemente.")
        cargarDatos()
      } else {
        alert("Error contactando al servidor de reportes.")
      }
    } catch(e) {
      console.error(e)
    }
    setLoading(false)
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
            <button className="btn-primary" onClick={() => { setShowPedidoForm(!showPedidoForm); setIsPreviewMode(false); }}>
               {showPedidoForm ? 'Volver al Historial' : '🚀 Solicitar Requisición Especial'}
            </button>
          </div>
       </div>

       {/* Panel KPIs */}
       {!showPedidoForm && (
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Operaciones Históricas</p>
              <h2 style={{ color: 'var(--arco-primary)' }}>{historial.length + misSolicitudes.length}</h2>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Estatus de Último Presupuesto</p>
              <div>{misSolicitudes.length > 0 ? getStatusBadge(misSolicitudes[0].estado) : <span className="text-muted">N/A</span>}</div>
            </div>
         </div>
       )}

       {showPedidoForm ? (
          <div className="glass-panel fade-in" style={{ padding: '3rem', margin: '0 auto', background: isPreviewMode ? '#fff' : 'var(--bg-panel)', color: isPreviewMode ? '#1e293b' : 'var(--text-main)' }}>
             {!isPreviewMode ? (
                <>
                   <h3>Elaborar Requisición (Varias Líneas)</h3>
                   <p className="text-muted" style={{ marginBottom: '2rem' }}>Añada los rubros en el contenedor a continuación.</p>
                   
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '2rem', marginBottom: '2rem' }}>
                      {reqRows.map((row, index) => (
                         <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                               <label>Línea de Rubro</label>
                               <select className="glass-input" value={row.producto_id} onChange={e => handleRowChange(row.id, 'producto_id', e.target.value)} required>
                                  <option value="">Seleccione el rubro...</option>
                                  {rubros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                               </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                               <label>Cant. Numérica</label>
                               <input type="number" min="1" className="glass-input" value={row.cantidad} onChange={e => handleRowChange(row.id, 'cantidad', e.target.value)} required />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                               <label>Ref. Unidad</label>
                               <input type="text" className="glass-input" value={getProductInfo(row.producto_id)?.unidad_medida || '---'} disabled style={{ background: 'rgba(0,0,0,0.05)' }} />
                            </div>
                            <button className="btn-outline" onClick={() => handleRemoveRow(row.id)} style={{ padding: '12px 16px', borderColor: 'var(--acento-alerta, #ef4444)', color: 'var(--acento-alerta, #ef4444)' }}>❌</button>
                         </div>
                      ))}
                   </div>
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <button className="btn-outline" onClick={handleAddRow}>+ Agregar Otra Fila</button>
                      <button className="btn-primary" onClick={() => {
                        if (reqRows.some(r => !r.producto_id || r.cantidad <= 0)) return alert('Complete los datos numéricos.')
                        setIsPreviewMode(true)
                      }}>Pre-visualizar e Imprimir Petición 📄</button>
                   </div>
                </>
             ) : (
                /* PREVIEW FACTURA PROFORMA FISCAL */
                <div style={{ padding: '2rem 1rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '2rem', marginBottom: '2rem' }}>
                      <div>
                         <h2 style={{ color: '#2E7D32', fontSize: '2rem', marginBottom: '0.5rem' }}>SIEMBRA MIRANDINA</h2>
                         <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Coordinación Agrícola B2B</p>
                         <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Fecha: {new Date().toLocaleDateString()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <h2 style={{ color: '#1e293b', letterSpacing: '2px' }}>PROFORMA / REQUISICIÓN</h2>
                         <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'left', minWidth: '250px' }}>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>{fullProfile?.empresas?.[0]?.nombre || fullProfile?.nombre_completo || user?.nombre_completo}</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>RIF / CI: {fullProfile?.empresas?.[0]?.nit_rfc || 'J-123456789'}</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>Dir: {fullProfile?.empresas?.[0]?.direccion_fiscal || 'Sin Registro Habitacional'}</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>Telf: {fullProfile?.empresas?.[0]?.telefono_contacto || '+58'}</p>
                         </div>
                      </div>
                   </div>

                   <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3rem' }}>
                      <thead>
                         <tr style={{ backgroundColor: '#2E7D32', color: 'white', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>Descripción del Producto</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Cantidad</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Costo Unitario ($)</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Subtotal Ref ($)</th>
                         </tr>
                      </thead>
                      <tbody style={{ borderBottom: '1px solid #cbd5e1' }}>
                         {reqRows.map((row, i) => {
                            const p = getProductInfo(row.producto_id);
                            return (
                               <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '12px', color: '#1e293b' }}>{p?.nombre}</td>
                                  <td style={{ padding: '12px', textAlign: 'center', color: '#1e293b' }}>{row.cantidad} {p?.unidad_medida}</td>
                                  <td style={{ padding: '12px', textAlign: 'right', color: '#1e293b' }}>{p?.precio_base_usd?.toFixed(2)}</td>
                                  <td style={{ padding: '12px', textAlign: 'right', color: '#1e293b' }}>{(p?.precio_base_usd * row.cantidad).toFixed(2)}</td>
                               </tr>
                            )
                         })}
                      </tbody>
                   </table>

                   <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3rem' }}>
                      <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '300px' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.1rem' }}>
                            <span style={{ color: '#64748b' }}>TOTAL ESTIMADO:</span>
                            <span style={{ color: '#1e293b', fontWeight: 'bold' }}>USD ${subtotalReferencial.toFixed(2)}</span>
                         </div>
                         <p style={{ fontSize: '0.75rem', color: '#ef4444', textAlign: 'right', margin: 0 }}>* Referencial a Espera de Aprobación Logística del Sistema.</p>
                      </div>
                   </div>

                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <button className="btn-outline" onClick={() => setIsPreviewMode(false)} style={{ borderColor: '#64748b', color: '#64748b' }}>Atrás (Ajustar Filas)</button>
                      <button className="btn-primary" onClick={handleTransmitirFactura} disabled={loading} style={{ background: '#E65100', padding: '12px 30px', fontSize: '1.2rem', boxShadow: '0 4px 15px rgba(230,81,0,0.3)' }}>
                         {loading ? 'Transmitiendo...' : '📤 Confirmar y Transmitir Cotización a Central'}
                      </button>
                   </div>
                </div>
             )}
          </div>
       ) : (
          <div className="glass-panel fade-in" style={{ padding: '2.5rem' }}>
             <h3 style={{ marginBottom: '2rem' }}>Documentos Emitidos (Operaciones y Requisiciones)</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {misSolicitudes.length === 0 && historial.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📦</div>
                    <p className="text-muted">Aún no tienes Tracking Histórico.</p>
                  </div>
                ) : (
                   <>
                     {/* TABLA DE SOLICITUDES ESPECIALES */}
                     {misSolicitudes.map(ped => (
                        <div key={ped.id || Math.random()} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: ped.estado === 'CONTRA_OFERTA' ? '4px solid #ef4444' : '4px solid var(--arco-focus)' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <div>
                                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Requisición Especial: #{ped.id?.substring(0,8).toUpperCase() || 'N/A'}</div>
                                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <span>📅 {ped.created_at ? new Date(ped.created_at).toLocaleDateString() : 'N/A'}</span>
                                    <span>📑 {ped.productos?.nombre || 'Producto'} (x{ped.cantidad || 0} {ped.unidad_medida || 'Unidades'})</span>
                                  </div>
                               </div>
                               <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                  <div>{getStatusBadge(ped.estado)}</div>
                               </div>
                           </div>

                           {/* WIDGET DE PAGO Y APROBACIÓN */}
                           {ped.estado === 'CONTRA_OFERTA' && ordenActivaPago !== ped.id && (
                              <div style={{ marginTop: '1rem', background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                 <p style={{ margin: 0, fontSize: '0.9rem' }}>Su pedido fue abastecido. Puede confirmar el pago para liberar el inventario.</p>
                                 <button className="btn-primary" style={{ background: '#ef4444' }} onClick={() => setOrdenActivaPago(ped.id)}>💵 Aceptar Presupuesto & Pagar</button>
                              </div>
                           )}

                           {ordenActivaPago === ped.id && (
                              <div className="fade-in" style={{ marginTop: '1rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                 <h4 style={{ margin: '0 0 1rem 0' }}>Anexar Soporte de Transacción 🧾</h4>
                                 <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Cargue la imagen de su transferencia bancaria o captura de pantalla del pago. Esto asegurará logísticamente su Proforma.</p>
                                 
                                 <input type="file" accept="image/*" onChange={handleFileUpload} style={{ marginBottom: '1rem', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%', background: 'white' }} />
                                 {reciboBase64 && <div style={{ marginBottom: '1rem' }}><img src={reciboBase64} alt="Preview" style={{ maxWidth: '150px', borderRadius: '8px', border: '2px solid #34D399' }} /></div>}

                                 <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button className="btn-outline" onClick={() => {setOrdenActivaPago(null); setReciboBase64('')}}>Cancelar</button>
                                    <button className="btn-primary" style={{ background: '#10b981' }} onClick={enviarRecibo} disabled={loading}>{loading ? 'Subiendo...' : 'Verificar Pago & Concluir Orden'}</button>
                                 </div>
                              </div>
                           )}
                        </div>
                     ))}
                     {/* TABLA DE COMPRAS CARRITO REGULAR */}
                     {historial.map(ped => (
                        <div key={ped.id || Math.random()} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <div>
                              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Despacho Estándar: #{ped.id?.substring(0,8).toUpperCase() || 'N/A'}</div>
                              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <span>📅 {ped.created_at ? new Date(ped.created_at).toLocaleDateString() : 'N/A'}</span>
                                <span>💳 {(ped.metodo_pago || 'PREVIO_ACUERDO').replace(/_/g, ' ')}</span>
                              </div>
                           </div>
                           <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                              <div>{getStatusBadge(ped.estado)}</div>
                              <div style={{ textAlign: 'right' }}>
                                 <div style={{ fontWeight: 'bold', color: 'var(--miranda-primary)', fontSize: '1.3rem' }}>${(ped.total_usd || 0).toFixed(2)}</div>
                                 <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Monto Neto (USD)</div>
                              </div>
                           </div>
                           
                           {/* Botonera Transaccional Adicional para Pedidos Normales */}
                           {ped.estado === 'PENDIENTE' && (
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', marginLeft: 'auto' }}>
                                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.9rem' }} onClick={() => setOrdenActivaPago(ordenActivaPago === ped.id ? null : ped.id)}>📋 Ver Datos de Pago</button>
                                    <button className="btn-primary" style={{ background: '#10b981', padding: '6px 12px', fontSize: '0.9rem' }} onClick={() => handleReportarPago(ped.id)}>💵 Reportar Pago</button>
                                 </div>
                                 <button className="btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444', padding: '6px 12px', fontSize: '0.9rem' }} onClick={() => handleCancelarPedido(ped.id)}>❌ Cancelar Compra</button>
                             </div>
                           )}
                           
                           {/* Instrucciones Inline */}
                           {ordenActivaPago === ped.id && ped.estado === 'PENDIENTE' && (
                             <div className="fade-in" style={{ width: '100%', marginTop: '1rem' }}>
                                <PaymentInstructions 
                                  method={ped.metodo_pago} 
                                  amountUsd={ped.total_usd?.toFixed(2)} 
                                  amountBs={aBs(ped.total_usd)} 
                                />
                             </div>
                           )}
                        </div>

                     ))}
                   </>
                )}
             </div>
          </div>
       )}

       {!showPedidoForm && (
         <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', marginTop: '3rem', borderTop: '2px solid var(--miranda-primary)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🚛</div>
            <h3 style={{ color: 'var(--miranda-primary)' }}>¿Armado de Lotes Multiplicativos o Rubros de Tonelaje?</h3>
            <p className="text-muted" style={{ marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
              Utiliza nuestro canal fiscal de requisición en bloque. Levanta un documento de pedido de múltiples filas (Ej: Sacos, Huacales masivos) de cara a toda nuestra red cooperativa de productores.
            </p>
            <button className="btn-primary" onClick={() => { setShowPedidoForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              🚀 Levantar Nueva Proforma de Solicitud
            </button>
         </div>
       )}
    </div>
  )
}

export default CustomerDashboard
