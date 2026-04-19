import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Catalog.css'
import ProductCard from '../components/ProductCard'

const Home = ({ cart, setCart }) => {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentSlide, setCurrentSlide] = useState(0)
  const [hideOutOfStock, setHideOutOfStock] = useState(false)
  const navigate = useNavigate()

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('siembra_cart')
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)) } catch(e){}
    }
  }, [setCart])

  // Guardar carrito en localStorage cuando cambie (usamos siembra_cart consistente con App.jsx)
  useEffect(() => {
    localStorage.setItem('siembra_cart', JSON.stringify(cart))
  }, [cart])

  const heroSlides = [
    { img: "/banners/suministros.webp", title: "Suministros Agrícolas Mayoristas", desc: "Mejores precios netos para clientes B2B. Aprobación y verificación fiscal garantizada." },
    { img: "/banners/maquinaria.webp", title: "Catálogo de Maquinaria Pesada", desc: "Equipos de última generación para precisión 100% industrial, listos en bodega." },
    { img: "/banners/tecnologia.webp", title: "Ecosistema Tecnológico Agrotech", desc: "Monitoreo por drones y sensores de humedad para optimizar tu rendimiento al máximo." },
    { img: "/banners/insumos.webp", title: "Insumos y Consumibles B2B", desc: "Fertilizantes, herbicidas y semillas certificadas con despacho inmediato a todo el país." },
    { img: "/banners/proteccion.webp", title: "Protección y Estructuras", desc: "Mallas sombra y plásticos reflectantes para el control climático superior de tus cultivos." }
  ]

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'
    setLoading(true)
    
    fetch(`${API_URL}/productos`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }
        return res.json()
      })
      .then(data => {
        setProductos(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error cargando productos:", err)
        setLoading(false)
      })
  }, [])

  // Auto-play interval para el slide con cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleAddToCart = (product, qty = 1) => {
    // Agregar producto al carrito usando la estructura { product, quantity } consistente con Catalog
    const existingIdx = cart.findIndex(item => item.product?.id === product.id)
    
    if (existingIdx >= 0) {
      // Si ya existe, aumentar cantidad
      const newCart = [...cart]
      newCart[existingIdx].quantity += qty
      setCart(newCart)
    } else {
      // Agregar nuevo producto
      setCart([...cart, { product, quantity: qty }])
    }
  }

  let productosFiltrados = productos.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  
  if (hideOutOfStock) {
    productosFiltrados = productosFiltrados.filter(p => (p.inventario?.stock_disponible || 0) > 0)
  }

  return (
    <div className="home-container" style={{ padding: '2rem 0' }}>
      
      {/* Carrusel Dinámico Real */}
      <div className="hero-section" style={{ 
          padding: '4rem 3rem', 
          marginBottom: '3rem', 
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          transition: 'all 0.5s ease-in-out'
      }}>
        {/* Capa de la foto de fondo 100% visible pero oscurecida para el texto */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundImage: `url(${heroSlides[currentSlide].img})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          zIndex: -2,
          transition: 'background-image 1s ease-in-out'
        }}></div>
        
        {/* Overaly protector para texto */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(10, 20, 30, 0.45)', /* Tono oscuro sutil */
          zIndex: -1
        }}></div>

        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
           {heroSlides[currentSlide].title}
        </h1>
        <p className="text-muted" style={{ fontSize: '1.25rem', maxWidth: '600px', textShadow: '0 1px 5px rgba(0,0,0,0.8)', color: '#fff' }}>
          {heroSlides[currentSlide].desc}
        </p>
        {/* Botonera de Acción Primaria */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button className="btn-primary" style={{ padding: '15px 30px', fontSize: '1.1rem' }} onClick={() => navigate('/register')}>
            Abrir Cuenta Empresarial Hoy
          </button>
          
          <button 
             className="btn-outline" 
             onClick={() => navigate('/cliente')} 
             style={{ fontSize: '1.1rem', padding: '15px 30px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.5)', boxShadow: '0 4px 15px var(--arco-glow)' }}
           >
             🚛 Generar Requisición Especial (B2B)
           </button>
        </div>

        {/* Dots del carrusel */}
        <div style={{ display: 'flex', gap: '8px', position: 'absolute', bottom: '20px', left: '3rem' }}>
           {heroSlides.map((_, idx) => (
             <div key={idx} onClick={() => setCurrentSlide(idx)} style={{
               width: '12px', height: '12px', borderRadius: '50%', cursor: 'pointer',
               background: currentSlide === idx ? 'var(--arco-primary)' : 'rgba(255,255,255,0.3)'
             }} />
           ))}
        </div>
      </div>

      <div className="catalog-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Explora nuestro catálogo</h2>
          <p className="text-muted" style={{marginTop:'0.5rem'}}>Para conocer precios con descuento y comprar, ingresa al portal.</p>
        </div>
        
        {/* Buscador Rápido y Filtro */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                 <input 
                   type="checkbox" 
                   checked={hideOutOfStock} 
                   onChange={() => setHideOutOfStock(!hideOutOfStock)} 
                   style={{ opacity: 0, width: 0, height: 0 }}
                 />
                 <span style={{ 
                   position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                   backgroundColor: hideOutOfStock ? 'var(--miranda-primary)' : '#ccc',
                   transition: '.4s', borderRadius: '20px' 
                 }}>
                   <span style={{
                      position: 'absolute', content: '""', height: '14px', width: '14px', left: hideOutOfStock ? '22px' : '3px', bottom: '3px',
                      backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                   }}></span>
                 </span>
              </label>
              <span style={{ fontSize: '0.85rem', color: hideOutOfStock ? 'var(--miranda-primary)' : 'var(--text-muted)' }}>Solo con stock</span>
          </div>

          <input 
            type="text" 
            placeholder="🔍 Buscar por nombre o SKU..." 
            className="glass-input"
            style={{ width: '300px', padding: '12px 20px', borderRadius: '20px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Cargando catálogo maestro...</div>
      ) : (
        <div className="products-grid">
          {productosFiltrados.map(p => (
            <div key={p.id} style={{ cursor: 'pointer' }}>
              <ProductCard product={p} onAdd={handleAddToCart} />
            </div>
          ))}
          {productosFiltrados.length === 0 && (
            <p className="text-muted">No se encontraron productos con esa búsqueda.</p>
          )}
        </div>
      )}

      {/* Botón Flotante WhatsApp */}
      <a 
        href="https://wa.me/584125819477?text=Hola,%20me%20interesa%20abrir%20una%20cuenta%20comercial%20en%20ARCO!"
        target="_blank" 
        rel="noreferrer"
        className="whatsapp-float btn-primary"
        style={{
          position: 'fixed', bottom: '30px', right: '30px', 
          borderRadius: '50px', padding: '15px 20px', 
          display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1000,
          boxShadow: '0 10px 40px rgba(16,185,129,0.5)'
        }}
      >
        <span style={{fontSize:'1.2rem'}}>💬</span> ¿Necesitas Ayuda?
      </a>
      
    </div>
  )
}

export default Home
