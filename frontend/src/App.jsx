import { useState, useEffect, useCallback, memo } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Catalog from './pages/Catalog'
import LoginPortal from './pages/LoginPortal'
import CartSidebar from './components/CartSidebar'
import Home from './pages/Home'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import ProducerDashboard from './pages/ProducerDashboard'
import Profile from './pages/Profile'
import CustomerDashboard from './pages/CustomerDashboard'
import Checkout from './pages/Checkout'

const App = memo(() => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('siembra_user')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  }) // { id, rol, empresa_id, nombre_completo }
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('siembra_user')
  })
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('siembra_cart')
      if(!saved) return []
      const parsed = JSON.parse(saved)
      if(!Array.isArray(parsed)) return []
      return parsed.filter(item => item?.product?.id && Number.isFinite(item.quantity) && item.quantity > 0)
    } catch {
      return []
    }
  })
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Sincronizar siempre el carrito con localStorage para no perder productos
  useEffect(() => {
    localStorage.setItem('siembra_cart', JSON.stringify(cart))
  }, [cart])

  const handleLogin = useCallback((userData) => {
    setIsAuthenticated(true)
    setUser(userData)
    localStorage.setItem('siembra_user', JSON.stringify(userData))
  }, [])

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false)
    setUser(null)
    setCart([]) // Limpiar carrito al hacer logout
    localStorage.removeItem('siembra_user')
  }, [])

  return (
    <BrowserRouter>
      <Navbar 
        cartCount={cart.length} 
        isAuthenticated={isAuthenticated} 
        userRole={user?.rol} 
        onLogout={handleLogout} 
        onOpenCart={() => setIsCartOpen(true)} 
      />
      
      {isCartOpen && <CartSidebar cart={cart} setCart={setCart} isAuthenticated={isAuthenticated} onClose={() => setIsCartOpen(false)} />}

      <main style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto', marginTop: '80px' }}>
        <Routes>
          <Route path="/" element={<Home cart={cart} setCart={setCart} />} />
          <Route path="/login" element={
            !isAuthenticated ? <LoginPortal onLogin={handleLogin} /> : <Navigate to="/b2b" replace />
          } />
          <Route path="/register" element={<Register />} />
          <Route path="/b2b" element={<Catalog cart={cart} setCart={setCart} />} />
          <Route path="/cliente" element={
            isAuthenticated ? <CustomerDashboard user={user} /> : <Navigate to="/login" replace />
          } />
          <Route path="/productor" element={
            isAuthenticated && user?.rol === 'PRODUCTOR' ? <ProducerDashboard user={user} /> : <Navigate to="/login" replace />
          } />
          <Route path="/checkout" element={
            isAuthenticated ? <Checkout cart={cart} setCart={setCart} user={user} /> : <Navigate to="/login" replace />
          } />
          <Route path="/admin" element={
            isAuthenticated && user?.rol === 'ADMINISTRADOR' ? <AdminDashboard user={user} /> : <Navigate to="/login" replace />
          } />
          <Route path="/perfil" element={
            isAuthenticated ? <Profile user={user} /> : <Navigate to="/login" replace />
          } />
        </Routes>
      </main>
    </BrowserRouter>
  )
})

export default App
