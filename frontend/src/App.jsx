import { useState } from 'react'
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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null) // ADMINISTRADOR, PRODUCTOR, CLIENTE_EMPRESA, etc.
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const handleLogin = (role = 'CLIENTE_NATURAL') => {
    setIsAuthenticated(true)
    setUserRole(role)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserRole(null)
  }

  return (
    <BrowserRouter>
      <Navbar 
        cartCount={cart.length} 
        isAuthenticated={isAuthenticated} 
        userRole={userRole} 
        onLogout={handleLogout} 
        onOpenCart={() => setIsCartOpen(true)} 
      />
      
      {isCartOpen && <CartSidebar cart={cart} setCart={setCart} onClose={() => setIsCartOpen(false)} />}

      <main style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto', marginTop: '80px' }}>
        <Routes>
          <Route path="/" element={<Home cart={cart} setCart={setCart} />} />
          <Route path="/login" element={
            !isAuthenticated ? <LoginPortal onLogin={handleLogin} /> : <Navigate to="/b2b" replace />
          } />
          <Route path="/register" element={<Register />} />
          <Route path="/b2b" element={
            isAuthenticated ? <Catalog cart={cart} setCart={setCart} /> : <Navigate to="/login" replace />
          } />
          <Route path="/cliente" element={
            isAuthenticated ? <CustomerDashboard /> : <Navigate to="/login" replace />
          } />
          <Route path="/productor" element={
            isAuthenticated && userRole === 'PRODUCTOR' ? <ProducerDashboard /> : <Navigate to="/login" replace />
          } />
          <Route path="/admin" element={
            isAuthenticated && userRole === 'ADMINISTRADOR' ? <AdminDashboard /> : <Navigate to="/login" replace />
          } />
          <Route path="/perfil" element={
            isAuthenticated ? <Profile /> : <Navigate to="/login" replace />
          } />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
