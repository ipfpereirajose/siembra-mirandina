import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import './Catalog.css'

const Catalog = ({ cart, setCart }) => {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [filteredProductos, setFilteredProductos] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)

  const promoSlides = [
    { img: "https://loremflickr.com/1200/400/vegetables,farm?lock=301", title: "Cosecha Fresca de la Semana", desc: "Zanahorias y Papas directo de productores locales con precios referenciales BCV." },
    { img: "https://loremflickr.com/1200/400/lettuce,agriculture?lock=302", title: "Verdes de Primera", desc: "Lechugas hidropónicas y hortalizas de hoja con la máxima frescura garantizada." },
    { img: "https://loremflickr.com/1200/400/tomato,farm?lock=303", title: "Oferta de Tomate Perita", desc: "Calidad de exportación para tu negocio. Compra por cestas y ahorra." }
  ]

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'
    
    fetch(`${API_URL}/productos`)
      .then(res => res.json())
      .then(data => {
        setProductos(data)
        setFilteredProductos(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error cargando productos:", err)
        setLoading(false)
      })

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % promoSlides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const results = productos.filter(p => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredProductos(results)
  }, [searchTerm, productos])

  const handleAddToCart = (product, quantity) => {
    const existingIdx = cart.findIndex(item => item.product.id === product.id)
    if(existingIdx >= 0) {
      const newCart = [...cart]
      newCart[existingIdx].quantity += quantity
      setCart(newCart)
    } else {
      setCart([...cart, { product, quantity }])
    }
  }

  if (loading) return <div className="loading-state">Cosechando catálogo de Siembra Mirandina...</div>

  return (
    <div className="catalog-container">
      <div className="catalog-header" style={{marginBottom: '2rem', textAlign: 'center'}}>
        <div className="slogan-banner">"Cultivamos calidad, te llevamos frescura ésta es la mejor"</div>
        <h1 style={{ fontSize: '2.8rem' }}>Catálogo <span className="text-gradient">Siembra Mirandina</span></h1>
        <p className="text-muted">Productos frescos del campo a tu mesa.</p>
        
        {/* Call to Action: Pedidos Especiales (Visible en el Catálogo) */}
        <div style={{ marginTop: '1.5rem' }}>
           <button 
             className="btn-primary" 
             onClick={() => navigate('/cliente')} 
             style={{ fontSize: '1.1rem', padding: '12px 30px', boxShadow: '0 4px 15px var(--arco-glow)' }}
           >
             🚛 Requisición Especial de Alto Volumen
           </button>
        </div>
      </div>

      {/* Buscador de Productos */}
      <div className="glass-panel" style={{ padding: '1rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
         <span style={{ fontSize: '1.2rem' }}>🔍</span>
         <input 
           type="text" 
           className="glass-input" 
           placeholder="Buscar rubros (Tomate, Papa, Cebolla...)" 
           value={searchTerm}
           onChange={e => setSearchTerm(e.target.value)}
           style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '1.1rem' }}
         />
      </div>

      {/* Carrusel de Promociones */}
      <div style={{ 
          padding: '2.5rem 3rem', 
          marginBottom: '3rem', 
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          minHeight: '220px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundImage: `url(${promoSlides[currentSlide].img})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          zIndex: -2,
          transition: 'background-image 0.8s ease-in-out'
        }}></div>

        {/* Overlay oscuro protector para que las imágenes mantengan su vivacidad mientras el texto resalta */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(15, 25, 35, 0.55)', /* Tono de oscurecimiento */
          zIndex: -1
        }}></div>

        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
           🍃 {promoSlides[currentSlide].title}
        </h2>
        <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: '800px', color: '#fff' }}>
          {promoSlides[currentSlide].desc}
        </p>

        <div style={{ display: 'flex', gap: '6px', position: 'absolute', bottom: '15px', right: '2rem' }}>
           {promoSlides.map((_, idx) => (
             <div key={idx} onClick={() => setCurrentSlide(idx)} style={{
               width: '10px', height: '10px', borderRadius: '50%', cursor: 'pointer',
               background: currentSlide === idx ? 'var(--miranda-primary)' : 'rgba(255,255,255,0.4)',
               transition: 'all 0.3s'
             }} />
           ))}
        </div>
      </div>

      <div className="products-grid">
        {filteredProductos.map(p => (
          <ProductCard key={p.id} product={p} onAdd={handleAddToCart} />
        ))}
        {filteredProductos.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
             <p className="text-muted">No se encontraron productos que coincidan con tu búsqueda.</p>
             <button className="btn-outline" style={{ marginTop: '1rem' }} onClick={() => setSearchTerm('')}>Ver todo el catálogo</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Catalog
