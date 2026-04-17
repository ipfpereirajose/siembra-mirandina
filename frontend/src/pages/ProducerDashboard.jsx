import React, { useState, useEffect } from 'react';

const ProducerDashboard = () => {
  const [rubros, setRubros] = useState([]);
  const [misDeclaraciones, setMisDeclaraciones] = useState([]);
  const [selection, setSelection] = useState({ producto_id: '', nuevo_nombre: '', cantidad: '', unidad: 'Kg', precio: '' });
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

  useEffect(() => {
    fetch(`${API_URL}/productos/`)
      .then(res => res.json())
      .then(data => setRubros(data));
    
    cargarDeclaraciones();
  }, []);

  const cargarDeclaraciones = () => {
    fetch(`${API_URL}/produccion/mis-declaraciones`, {
        headers: {
            'X-User-Id': '00000000-0000-0000-0000-000000000000',
            'X-Empresa-Id': '00000000-0000-0000-0000-000000000000'
        }
    })
      .then(res => res.json())
      .then(data => setMisDeclaraciones(data));
  };

  const handleDeclarar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${API_URL}/produccion/declarar`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-User-Id': '00000000-0000-0000-0000-000000000000',
            'X-Empresa-Id': '00000000-0000-0000-0000-000000000000'
        },
        body: JSON.stringify({
          producto_id: selection.producto_id === 'OTRO' ? null : selection.producto_id,
          nuevo_producto_nombre: selection.producto_id === 'OTRO' ? selection.nuevo_nombre : null,
          cantidad_disponible: parseFloat(selection.cantidad),
          unidad_medida: selection.unidad,
          precio_propuesto_usd: selection.precio ? parseFloat(selection.precio) : null
        })
      });
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
            'X-User-Id': '00000000-0000-0000-0000-000000000000',
            'X-Empresa-Id': '00000000-0000-0000-0000-000000000000'
        }
     });
     cargarDeclaraciones();
  };

  return (
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
            <div className="form-group" style={{ width: '120px' }}>
              <label>Unidad</label>
              <select className="glass-input" value={selection.unidad} onChange={e => setSelection({...selection, unidad: e.target.value})}>
                <option value="Kg">Kg</option>
                <option value="Sacos">Sacos</option>
                <option value="Huacales">Huacales</option>
                <option value="Cajas">Cajas</option>
                <option value="Unidades">Unidades</option>
              </select>
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
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '8px' }}>Rubro</th>
                  <th style={{ padding: '8px' }}>Cant.</th>
                  <th style={{ padding: '8px' }}>Unidad</th>
                  <th style={{ padding: '8px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {misDeclaraciones.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '8px' }}>{d.productos?.nombre || 'Desconocido'}</td>
                    <td style={{ padding: '8px' }}>{d.cantidad_disponible}</td>
                    <td style={{ padding: '8px' }}>{d.unidad_medida}</td>
                    <td style={{ padding: '8px' }}>
                      <button className="btn-outline" style={{ padding: '4px 8px', color: '#ef4444' }} onClick={() => eliminarDeclaracion(d.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProducerDashboard;
