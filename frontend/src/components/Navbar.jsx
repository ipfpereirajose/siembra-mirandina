import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Navbar.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Navbar = ({ cartCount, isAuthenticated, onLogout, onOpenCart, user }) => {
  const navigate = useNavigate()
  const [showContact, setShowContact] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs] = useState([])
  const userRole = user?.rol;

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Basic polling every 15s to keep it simple and real-time-ish
      const fetchNotifs = async () => {
        try {
          // AÑADIMOS PREFIJO /api QUE FALTABA
          const res = await fetch(`${API_URL}/api/notificaciones/`, {
            headers: {
              'x-user-id': user.id,
              'x-empresa-id': user.empresa_id || ''
            }
          })
          if (res.ok) {
            const data = await res.json()
            setNotifs(data)
          }
        } catch (e) {
          console.error("Error fetching notifs", e)
        }
      }
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const markAsRead = async (notifId) => {
    try {
      await fetch(`${API_URL}/api/notificaciones/${notifId}/leer`, {
        method: 'PUT',
        headers: {
          'x-user-id': user.id
        }
      })
      // Update local state for immediate feedback
      setNotifs(prev => prev.map(n => n.id === notifId ? {...n, leido: true} : n))
    } catch (e) {
      console.error("Error marking as read", e)
    }
  }

  const unreadCount = notifs.filter(n => !n.leido).length;

  return (
    <nav className="navbar glass-panel">
      {/* ... (rest of the navbar header) */}
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span className="logo-icon">🌱</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="logo-text">SIEMBRA <span className="text-gradient">MIRANDINA</span></span>
            <span style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '-4px' }}>v16042026</span>
          </div>
        </div>

        <div className="navbar-center-slogan" style={{ display: 'none' }}>
           {/* Se activará en CSS para pantallas grandes */}
           "Del campo a tu mesa, siempre con la mejor frescura"
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Botón de Contacto Oficina */}
          <div style={{ position: 'relative' }}>
            <button className="btn-outline" style={{ padding: '8px 16px' }} onClick={() => setShowContact(!showContact)}>
              📞 Contacto Oficina
            </button>
            {showContact && (
              <div className="glass-panel" style={{ position: 'absolute', top: '100%', right: 0, width: '220px', padding: '1rem', marginTop: '10px', zIndex: 1000 }}>
                <p style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Atención al Productor:</p>
                <p style={{ fontWeight: 'bold' }}>XXXX-XXXXXXX</p>
                <hr style={{ margin: '8px 0', opacity: 0.1 }} />
                <p style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Atención al Cliente:</p>
                <p style={{ fontWeight: 'bold' }}>XXXX-XXXXXXX</p>
              </div>
            )}
          </div>

          {!isAuthenticated ? (
            <div className="navbar-menu" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              {/* Carrito para usuarios no autenticados */}
              <div className="cart-indicator" onClick={onOpenCart} style={{ cursor: 'pointer', fontSize: '1.2rem', position: 'relative' }}>
                🛒 
                <span className="cart-badge" style={{ position: 'absolute', top: '-10px', right: '-15px', background: 'var(--arco-primary)', color: 'black', borderRadius: '50%', padding: '2px 6px', fontSize: '0.8rem', fontWeight: 'bold' }}>{cartCount}</span>
              </div>
              
              <button className="btn-outline" style={{ border: 'none', color: 'var(--text-main)', cursor: 'pointer' }} onClick={() => navigate('/login')}>
                Ingresar
              </button>
              <button className="btn-primary" onClick={() => navigate('/register')}>
                REGISTRAR
              </button>
            </div>
          ) : (
            <div className="navbar-menu" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              {/* Carrito para todos los usuarios autenticados */}
              <div className="cart-indicator" onClick={onOpenCart} style={{ cursor: 'pointer', fontSize: '1.2rem', position: 'relative' }}>
                🛒 
                <span className="cart-badge" style={{ position: 'absolute', top: '-10px', right: '-15px', background: 'var(--arco-primary)', color: 'black', borderRadius: '50%', padding: '2px 6px', fontSize: '0.8rem', fontWeight: 'bold' }}>{cartCount}</span>
              </div>

              {/* Campana de Notificaciones */}
              <div style={{position: 'relative'}}>
                <div className="notif-bell" onClick={() => setShowNotifs(!showNotifs)} style={{ cursor: 'pointer', fontSize: '1.2rem', position: 'relative' }}>
                  🔔 {unreadCount > 0 && <span className="cart-badge" style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'red', color: 'white', borderRadius: '50%', padding: '2px 5px', fontSize: '0.7rem' }}>{unreadCount}</span>}
                </div>
                {showNotifs && (
                  <div className="glass-panel" style={{ position: 'absolute', top: '100%', right: '-50px', width: '300px', padding: '1rem', marginTop: '10px', zIndex: 1000, maxHeight: '400px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{margin: 0}}>Notificaciones</h4>
                      {unreadCount > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--miranda-primary)', cursor: 'pointer' }} onClick={() => notifs.filter(n => !n.leido).forEach(n => markAsRead(n.id))}>Leído todo</span>}
                    </div>
                    {notifs.length === 0 ? (
                      <p style={{fontSize: '0.9rem', color: 'gray'}}>No tienes nuevas notificaciones.</p>
                    ) : (
                      notifs.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => !n.leido && markAsRead(n.id)}
                          style={{ 
                            padding: '10px', 
                            borderBottom: '1px solid rgba(255,255,255,0.1)', 
                            background: n.leido ? 'transparent' : 'rgba(52, 211, 153, 0.05)',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            marginBottom: '4px'
                          }}
                        >
                          <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 'bold', color: n.leido ? 'inherit' : 'var(--miranda-primary)' }}>{n.titulo}</p>
                          <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>{n.mensaje}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', opacity: 0.5 }}>{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>


              {userRole === 'ADMINISTRADOR' && (
                <span style={{ cursor: 'pointer', color: 'var(--miranda-primary)', fontWeight: 'bold' }} onClick={() => navigate('/admin')}>⚙️ Dashboard Admin</span>
              )}

              {userRole === 'PRODUCTOR' && (
                <span style={{ cursor: 'pointer', color: 'var(--miranda-primary)', fontWeight: 'bold' }} onClick={() => navigate('/productor')}>🚜 Mi Producción</span>
              )}

              {(userRole === 'CLIENTE_EMPRESA' || userRole === 'CLIENTE_NATURAL' || userRole === 'CLIENTE') && (
                <span style={{ cursor: 'pointer', color: 'var(--miranda-primary)', fontWeight: 'bold' }} onClick={() => navigate('/cliente')}>👤 Mi Panel</span>
              )}

              <div className="profile-btn" onClick={() => navigate('/perfil')} style={{ cursor: 'pointer' }}>
                👤 {user?.nombre_completo || 'Perfil'}
              </div>

              <button className="btn-outline" style={{ padding: '8px 16px' }} onClick={() => {
                  onLogout();
                  navigate('/');
              }}>Salir</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
