import React, { useState, useEffect } from 'react';

const ProducerDashboard = ({ user }) => {
  const [rubros, setRubros] = useState([]);
  const [misDeclaraciones, setMisDeclaraciones] = useState([]);
  const [selection, setSelection] = useState({ producto_id: '', nuevo_nombre: '', cantidad: '', unidad: 'Kg', precio: '' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('PRODUCCION'); 
  const [subastas, setSubastas] = useState([]);
  const [pujaQty, setPujaQty] = useState({});

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

  useEffect(() => {
    fetch(`${API_URL}/productos/`)
      .then(res => res.json())
      .then(data => setRubros(data));
    
    cargarDeclaraciones();
    cargarSubastas();
  }, []);

  const cargarSubastas = () => {
    fetch(`${API_URL}/solicitudes/subastas`, {
        headers: { 'X-User-Id': user.id }
    })
      .then(res => res.json())
      .then(data => setSubastas(data || []));
  }

  const cargarDeclaraciones = () => {
    fetch(`${API_URL}/produccion/mis-declaraciones`, {
        headers: {
            'X-User-Id': user.id,
            'X-Empresa-Id': user.empresa_id
        }
    })
      .then(res => res.json())
      .then(data => setMisDeclaraciones(data));
  };

  const handleDeclarar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/produccion/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id,
            'X-Empresa-Id': user.empresa_id || ''
        },
        body: JSON.stringify({
          producto_id: selection.producto_id === 'OTRO' ? null : selection.producto_id,
          nuevo_producto_nombre: selection.producto_id === 'OTRO' ? selection.nuevo_nombre : null,
          cantidad_disponible: parseFloat(selection.cantidad),
          cantidad_en_venta: 0.0, // Inicia sin estar en venta por defecto
          esta_en_venta: false,
          unidad_medida: selection.unidad,
          precio_propuesto_usd: selection.precio ? parseFloat(selection.precio) : null
        })
      });
      if (!res.ok) {
         const err = await res.json();
         alert("ERROR: " + (err.detail || JSON.stringify(err)));
      } else {
         alert("Registrado en tu Finca. Recuerda presionar el botón 'Activar' en la tabla para mandarlo al catálogo.")
      }
      cargarDeclaraciones();
      setSelection({ ...selection, cantidad: '', precio: '', nuevo_nombre: '', producto_id: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const eliminarDeclaracion = async (id) => {
     await fetch(`${API_URL}/produccion/${id}`, { 
         method: 'DELETE',
         headers: {
            'X-User-Id': user.id,
            'X-Empresa-Id': user.empresa_id
        }
     });
     cargarDeclaraciones();
  };

  const toggleVenta = async (d) => {
      // Toggle the boolean state
      const newState = !d.esta_en_venta;
      // If we are activating but have 0 assigned to sale, assign max available
      const newCant = newState && (d.cantidad_en_venta === 0 || d.cantidad_en_venta == null) ? d.cantidad_disponible : d.cantidad_en_venta;

      await fetch(`${API_URL}/produccion/actualizar-venta`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id, 'X-Empresa-Id': user.empresa_id },
          body: JSON.stringify({
              id: d.id,
              esta_en_venta: newState,
              cantidad_en_venta: parseFloat(newCant || 0)
          })
      });
      cargarDeclaraciones();
  };

  const updateCantVenta = async (d, newCantStr) => {
      let val = parseFloat(newCantStr);
      if(isNaN(val) || val < 0) val = 0;
      if(val > d.cantidad_disponible) val = d.cantidad_disponible;

      await fetch(`${API_URL}/produccion/actualizar-venta`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id, 'X-Empresa-Id': user.empresa_id },
          body: JSON.stringify({
              id: d.id,
              esta_en_venta: val > 0, // auto turn on if val > 0
              cantidad_en_venta: val
          })
      });
      cargarDeclaraciones();
  };

  const submitPuja = async (ordenId) => {
    const qty = parseFloat(pujaQty[ordenId] || 0)
    if(qty <= 0) return alert("Ingrese una cantidad válida")
    
    try {
        await fetch(`${API_URL}/solicitudes/aportes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id },
            body: JSON.stringify({ id_orden: ordenId, cantidad: qty })
        })
        alert("Aporte registrado en sistema. Se le notificará si el cliente acepta la orden global.")
        setPujaQty({...pujaQty, [ordenId]: ''})
        cargarSubastas()
    } catch(e) {
        alert("Error de subasta")
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
         <button className={`btn-outline ${activeTab === 'PRODUCCION' ? 'miranda-tab-active' : ''}`} onClick={() => setActiveTab('PRODUCCION')}>🚜 Mi Producción Base</button>
         <button className={`btn-outline ${activeTab === 'DEMANDA' ? 'miranda-tab-active' : ''}`} onClick={() => setActiveTab('DEMANDA')}>📈 Demandas Urgentes del Mercado</button>
      </div>

    {activeTab === 'PRODUCCION' ? (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>🌱 Declarar Nueva Producción</h3>
        <form onSubmit={handleDeclarar} className="login-form">
          <div className="form-group">
            <label>Rubro Agrícola</label>
            <select className="glass-input" value={selection.producto_id} onChange={e => setSelection({...selection, producto_id: e.target.value})} required>
              <option value="">Seleccione un rubro...</option>
              {rubros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              <option value="OTRO" style={{ fontWeight: 'bold', color: 'var(--miranda-primary)' }}>+ Otro (Especificar)</option>
            </select>
          </div>

          {selection.producto_id === 'OTRO' && (
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
               <label>Nombre del Nuevo Rubro</label>
               <input type="text" className="glass-input" value={selection.nuevo_nombre} onChange={e => setSelection({...selection, nuevo_nombre: e.target.value})} placeholder="Ej: Cilantro, Perejil..." required />
               <p style={{ fontSize: '0.75rem', color: 'var(--miranda-accent)', marginTop: '5px' }}>* Se categorizará automáticamente.</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Cantidad Disponible</label>
              <input type="number" className="glass-input" value={selection.cantidad} onChange={e => setSelection({...selection, cantidad: e.target.value})} step="0.01" required />
            </div>
            <div className="form-group" style={{ width: '150px' }}>
              <label>Unidad</label>
              <input 
                type="text" 
                list="unidades-list" 
                className="glass-input" 
                value={selection.unidad} 
                onChange={e => setSelection({...selection, unidad: e.target.value})} 
                required 
                placeholder="Ej: Kg, Sacos, Manos"
              />
              <datalist id="unidades-list">
                <option value="Kg" />
                <option value="Sacos" />
                <option value="Huacales" />
                <option value="Cajas" />
                <option value="Unidades" />
                <option value="Manos" />
                <option value="Mallas" />
                <option value="Racimos" />
              </datalist>
            </div>
          </div>
          <div className="form-group">
            <label>Precio Propuesto ($ Ref BCV)</label>
            <input type="number" className="glass-input" value={selection.precio} onChange={e => setSelection({...selection, precio: e.target.value})} step="0.01" placeholder="Opcional" />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Procesando...' : 'Añadir a Disponibilidad'}
          </button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>📋 Mi Disponibilidad Actual</h3>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {misDeclaraciones.length === 0 ? <p className="text-muted">No has declarado producción aún.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '8px' }}>Silo / Rubro</th>
                  <th style={{ padding: '8px' }}>Total (Tu Finca)</th>
                  <th style={{ padding: '8px' }}>Publicado (Catálogo)</th>
                  <th style={{ padding: '8px' }}>Catálogo B2B</th>
                  <th style={{ padding: '8px' }}>🗑️</th>
                </tr>
              </thead>
              <tbody>
                {misDeclaraciones.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{d.productos?.nombre || 'Desconocido'}</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{d.cantidad_disponible} {d.unidad_medida}</td>
                    <td style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input 
                                type="number" 
                                className="glass-input" 
                                style={{ width: '70px', padding: '4px', textAlign: 'center', background: d.esta_en_venta ? 'rgba(52, 211, 153, 0.1)' : 'var(--bg-glass)' }}
                                defaultValue={d.cantidad_en_venta || 0}
                                onBlur={(e) => updateCantVenta(d, e.target.value)}
                            />
                            <span style={{ fontSize: '0.8rem' }}>{d.unidad_medida}</span>
                        </div>
                    </td>
                    <td style={{ padding: '8px' }}>
                        <button 
                            className="btn-outline" 
                            style={{ 
                                padding: '4px 10px', 
                                background: d.esta_en_venta ? 'var(--arco-primary)' : 'transparent',
                                color: d.esta_en_venta ? '#000' : 'var(--text-main)',
                                border: d.esta_en_venta ? 'none' : '1px solid var(--border-glass)'
                            }} 
                            onClick={() => toggleVenta(d)}
                        >
                            {d.esta_en_venta ? '👁️ Activo' : '⏸️ Pausado'}
                        </button>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button className="btn-outline" style={{ padding: '4px 8px', color: '#ef4444', border: 'none' }} onClick={() => eliminarDeclaracion(d.id)}>✖</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
    ) : (
      <div className="glass-panel fade-in" style={{ padding: '2rem' }}>
         <h3 style={{ marginBottom: '1.5rem', color: 'var(--arco-primary)' }}>🆘 Mercado Ciego: Requisiciones Corporativas</h3>
         <p className="text-muted" style={{ marginBottom: '2rem' }}>Las siguientes requisiciones no pudieron ser abastecidas 100% por el Acopio Central. ¡Aporta lo que tengas disponible para consolidar el bulto y asegurar tu venta!</p>
         
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {subastas.length === 0 ? <p className="text-muted">No hay subastas abiertas por los momentos.</p> : (
               subastas.map((sub) => {
                  const aportadoLog = (sub.aportes_productores || [])
                  const aportadoTotal = aportadoLog.reduce((acc, a) => acc + a.cantidad_aportada, 0)
                  const meta = sub.cantidad
                  const restante = meta - aportadoTotal
                  const miAportePrevio = aportadoLog.find(a => a.productor_id === user.id)

                  if(restante <= 0) return null // Ya la consiguieron

                  return (
                     <div key={sub.id} className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                        {miAportePrevio && <div style={{position:'absolute', top: 5, right: 10, fontSize: '0.8rem', background: 'rgba(52,211,153,0.2)', color: '#10b981', padding: '2px 8px', borderRadius: '10px'}}>Ya aportaste {miAportePrevio.cantidad_aportada}</div>}
                        
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{sub.productos?.nombre}</div>
                        <div style={{ marginTop: '1rem' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <span>Faltan:</span>
                              <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{restante} {sub.unidad_medida}</span>
                           </div>
                           <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                              <div style={{ width: `${(aportadoTotal / meta)*100}%`, height: '100%', background: 'var(--arco-primary)', borderRadius: '4px' }}></div>
                           </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                           <input type="number" min="1" max={restante} className="glass-input" placeholder="Tu Aporte" value={pujaQty[sub.id] || ''} onChange={e => setPujaQty({...pujaQty, [sub.id]: e.target.value})} style={{ width: '100px' }} />
                           <button className="btn-primary" style={{ flex: 1 }} onClick={() => submitPuja(sub.id)}>Inyectar Pujar</button>
                        </div>
                     </div>
                  )
               })
            )}
         </div>
      </div>
    )}
    </div>
  );
};

export default ProducerDashboard;
