import React, { useState, useEffect } from 'react';

const Profile = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ nombre_completo: '', telefono: '', direccion_fiscal: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';
  const headers = {
    'X-User-Id': user.id,
    'X-Empresa-Id': user.empresa_id
  };

  useEffect(() => {
    fetch(`${API}/auth/me`, { headers })
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setFormData({
          nombre_completo: data.nombre_completo,
          telefono: data.telefono || '',
          direccion_fiscal: data.empresas?.direccion_fiscal || '',
          password: ''
        });
        setLoading(false);
      });
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`${API}/auth/update-profile`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      alert("Perfil actualizado exitosamente.");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-state">Cargando identidad...</div>;

  return (
    <div className="glass-panel" style={{ padding: '3rem', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>👤 Centro de Control de <span className="text-gradient">Perfil</span></h2>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Gestiona tus datos de acceso y facturación fiscal.</p>

      <form onSubmit={handleUpdate} className="login-form">
        <div className="form-group">
          <label>Nombre Completo / Razón Social</label>
          <input type="text" className="glass-input" value={formData.nombre_completo} onChange={e => setFormData({...formData, nombre_completo: e.target.value})} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label>RIF / Documento (No editable)</label>
            <input type="text" className="glass-input" value={profile.empresas?.nit_rfc} disabled style={{ opacity: 0.6 }} />
          </div>
          <div className="form-group">
            <label>Teléfono de Contacto</label>
            <input type="text" className="glass-input" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
          </div>
        </div>

        <div className="form-group">
          <label>Dirección Fiscal Oficial</label>
          <textarea 
            className="glass-input" 
            style={{ height: '80px', padding: '1rem' }} 
            value={formData.direccion_fiscal} 
            onChange={e => setFormData({...formData, direccion_fiscal: e.target.value})}
          />
        </div>

        <div className="form-group" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
          <label>🔒 Cambiar Contraseña</label>
          <input 
            type="password" 
            className="glass-input" 
            placeholder="Dejar en blanco para mantener actual" 
            value={formData.password} 
            onChange={e => setFormData({...formData, password: e.target.value})} 
          />
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '2rem', padding: '1rem' }} disabled={saving}>
          {saving ? 'Guardando Cambios...' : 'ACTUALIZAR DATOS'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
