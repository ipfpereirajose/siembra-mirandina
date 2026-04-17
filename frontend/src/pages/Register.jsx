import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../pages/LoginPortal.css'

const Register = () => {
  const [tipo, setTipo] = useState('EMPRESA') // EMPRESA | PERSONA
  const [rol, setRol] = useState('CLIENTE_EMPRESA')
  const [tipoPersonalidad, setTipoPersonalidad] = useState('J')
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', documento: '', direccion_fiscal: '', telefono: '', correo: '', password: ''
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value})

  const handleTipoToggle = (newTipo) => {
    setTipo(newTipo)
    if (newTipo === 'EMPRESA') {
       setRol('CLIENTE_EMPRESA')
       setTipoPersonalidad('J')
    } else {
       setRol('CLIENTE_NATURAL')
       setTipoPersonalidad('V')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'
    
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          tipo, 
          rol, 
          tipo_personalidad: tipoPersonalidad 
        })
      })
      const data = await res.json()
      if(res.ok) {
        setSuccess(true)
        setTimeout(() => navigate('/login'), 3000)
      } else {
        setError(data.detail)
      }
    } catch(err) {
      setError("Fallo al conectar con el servidor de Siembra Mirandina.")
    }
  }

  if (success) {
    return (
      <div className="login-wrapper">
        <div className="glass-card login-card" style={{textAlign:'center'}}>
           <h2>✅ ¡Registro Exitoso!</h2>
           <p className="text-muted" style={{marginTop:'1rem'}}>Redirigiendo al portal de acceso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-wrapper" style={{ marginTop: '2rem', marginBottom: '4rem' }}>
      <div className="glass-card login-card" style={{ maxWidth: '600px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="slogan-banner">"Del campo a tu mesa, siempre con la mejor frescura"</div>
          <h2>Crea tu cuenta en <span className="text-gradient">Siembra Mirandina</span></h2>
          <p className="text-muted">Únete a la mayor red de productores y clientes agrotech</p>
        </div>
        
        {/* Toggle para tipo de entidad */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button type="button" className={`btn-outline ${tipo === 'EMPRESA' ? 'active-tab' : ''}`} style={{flex:1, borderColor: tipo==='EMPRESA' ? 'var(--miranda-primary)' : ''}} onClick={() => handleTipoToggle('EMPRESA')}>
             🏢 Persona Jurídica
          </button>
          <button type="button" className={`btn-outline ${tipo === 'PERSONA' ? 'active-tab' : ''}`} style={{flex:1, borderColor: tipo==='PERSONA' ? 'var(--miranda-primary)' : ''}} onClick={() => handleTipoToggle('PERSONA')}>
             👤 Persona Natural
          </button>
        </div>

        {/* Selector de Rol */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>¿Cuál es tu rol?</label>
            <select className="glass-input" value={rol} onChange={(e) => setRol(e.target.value)}>
               {tipo === 'EMPRESA' ? (
                 <>
                   <option value="CLIENTE_EMPRESA">Cliente Empresarial</option>
                   <option value="PRODUCTOR">Productor Agrícola</option>
                 </>
               ) : (
                 <>
                   <option value="CLIENTE_NATURAL">Consumidor Final</option>
                   <option value="PRODUCTOR">Productor (Persona Natural)</option>
                 </>
               )}
            </select>
        </div>

        {error && <div style={{background:'rgba(239, 68, 68, 0.1)', color:'#ef4444', padding:'1rem', borderRadius:'8px', marginBottom:'1.5rem', border:'1px solid rgba(239, 68, 68, 0.2)'}}>{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{flex:1}}>
              <label>{tipo === 'EMPRESA' ? 'Nombre / Razón Social' : 'Nombre'}</label>
              <input type="text" className="glass-input" name="nombre" value={formData.nombre} onChange={handleChange} required />
            </div>
            {tipo === 'PERSONA' && (
              <div className="form-group" style={{flex:1}}>
                <label>Apellido</label>
                <input type="text" className="glass-input" name="apellido" value={formData.apellido} onChange={handleChange} required />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
             <div className="form-group" style={{ width: '80px' }}>
                <label>Tipo</label>
                <select className="glass-input" value={tipoPersonalidad} onChange={(e) => setTipoPersonalidad(e.target.value)}>
                   {tipo === 'EMPRESA' ? (
                     <>
                       <option value="J">J</option>
                       <option value="G">G</option>
                       <option value="V">V</option>
                     </>
                   ) : (
                     <>
                       <option value="V">V</option>
                       <option value="E">E</option>
                     </>
                   )}
                </select>
             </div>
             <div className="form-group" style={{flex:1}}>
                <label>{tipo === 'EMPRESA' ? 'Número de RIF' : 'Cédula de Identidad'}</label>
                <input type="text" className="glass-input" name="documento" placeholder="12345678" value={formData.documento} onChange={handleChange} required />
             </div>
          </div>

          <div className="form-group">
            <label>Dirección Fiscal / Ubicación</label>
            <input type="text" className="glass-input" name="direccion_fiscal" value={formData.direccion_fiscal} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Teléfono de Contacto</label>
            <input type="text" className="glass-input" name="telefono" placeholder="+58 4..." value={formData.telefono} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Correo Electrónico</label>
            <input type="email" className="glass-input" name="correo" value={formData.correo} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Contraseña Acceso</label>
            <input type="password" className="glass-input" name="password" minLength="6" value={formData.password} onChange={handleChange} required />
          </div>
          
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1.1rem' }}>
            REGISTRAR
          </button>
          
          <p style={{textAlign:'center', marginTop:'1.5rem', fontSize:'0.9rem'}}>
            ¿Ya tienes cuenta? <span style={{color:'var(--miranda-primary)', cursor:'pointer', fontWeight:'600'}} onClick={() => navigate('/login')}>Ingresa aquí</span>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Register
