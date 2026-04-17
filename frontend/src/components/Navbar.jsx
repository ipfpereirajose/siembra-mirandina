import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Navbar.css'

const Navbar = ({ cartCount, isAuthenticated, onLogout, onOpenCart, user }) => {
  const navigate = useNavigate()
  const [showContact, setShowContact] = React.useState(false)
  const userRole = user?.rol;

  return (
    <nav className="navbar glass-panel">
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
              <div className="cart-indicator" onClick={onOpenCart} style={{ cursor: 'pointer', fontSize: '1.2rem' }}>
                <span className="cart-badge">{cartCount}</span>
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
              <div className="cart-indicator" onClick={onOpenCart} style={{ cursor: 'pointer', fontSize: '1.2rem' }}>
                <span className="cart-badge">{cartCount}</span>
              </div>

              {/* Campana de Notificaciones */}
              <div className="notif-bell" style={{ cursor: 'pointer', fontSize: '1.2rem' }}>
                🔔 <span className="cart-badge">3</span>
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
