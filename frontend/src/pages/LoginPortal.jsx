import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LoginPortal.css'

const LoginPortal = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'
    
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email.trim(), password })
      })
      
      const data = await res.json()
      
      if(res.ok) {
        onLogin(data.user)
        // Redirección basada en rol real
        if(data.user.rol === 'ADMINISTRADOR') navigate('/admin')
        else if(data.user.rol === 'PRODUCTOR') navigate('/productor')
        else navigate('/b2b')
      } else {
        setError(data.detail || "Error al iniciar sesión. Verifique sus credenciales.")
      }
    } catch(err) {
      setError("Fallo al conectar con el servidor de Siembra Mirandina.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrapper">
      <div className="glass-card login-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem' }}>Acceso <span className="text-gradient">Empresarial</span></h2>
          <p className="text-muted">A.R.C.O. OS Portal de Distribuidores</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}
          <div className="form-group">
            <label>Correo Electrónico Corporativo</label>
            <input 
              type="email" 
              className="glass-input" 
              placeholder="compras@empresa.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Contraseña / PIN B2B</label>
            <input 
              type="password" 
              className="glass-input" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>
            Ingresar al Sistema
          </button>
          
          <div style={{display:'flex', justifyContent:'space-between', marginTop:'1rem', fontSize:'0.9rem'}}>
            <span style={{color:'var(--text-muted)', cursor:'pointer', textDecoration:'underline'}} onClick={async () => {
               if(!email) return alert("Por favor ingresa tu correo primero para enviarte el código.")
               try {
                 const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'
                 await fetch(`${API}/auth/reset-password`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({correo: email})})
                 alert("Si tu correo está validado, recibirás el enlace pronto.")
               } catch(e) {}
            }}>Olvidé mi contraseña</span>
            
            <span style={{color:'var(--arco-primary)', cursor:'pointer'}} onClick={() => navigate('/register')}>Abre tu cuenta fiscal aquí</span>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPortal
