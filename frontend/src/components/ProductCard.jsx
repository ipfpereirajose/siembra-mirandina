import React, { useState, memo } from 'react'
import './ProductCard.css'

const ProductCard = memo(({ product, onAdd }) => {
  const [qty, setQty] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const stockInfo = product.inventario || { stock_disponible: 0 }
  const inStock = stockInfo.stock_disponible > 0

  return (
    <div className="glass-card product-card">
      <div className="product-image-container">
        {product.imagen_url ? (
          <img 
            src={product.imagen_url} 
            alt={product.nombre} 
            className="product-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/400x300?text=🌱';
            }}
          />
        ) : (
          <div className="product-image-fallback">🌱</div>
        )}
      </div>
      
      <div className="product-content">
        <div className="product-meta">
          <span className="product-sku">SKU: {product.sku}</span>
          <span className={`stock-badge ${inStock ? 'in-stock' : 'out-stock'}`}>
            {inStock ? `${stockInfo.stock_disponible} en bodega` : 'Agotado'}
          </span>
        </div>
        
        <h3 className="product-title">{product.nombre}</h3>
        {product.descripcion_tecnica && (
          <p className="product-desc">{product.descripcion_tecnica}</p>
        )}
        
        <div className="product-footer">
          <div className="product-price">
            ${product.precio_base_usd.toFixed(2)} <span style={{fontSize: '0.75rem', fontWeight:'normal', color: 'var(--text-muted)'}}>USD</span>
            <div style={{ fontSize: '0.65rem', color: 'var(--miranda-accent)', marginTop: '2px', opacity: 0.8 }}>
              * Precio referencial a tasa BCV
            </div>
          </div>
          
          <div className="product-action">
            <input 
              type="number" 
              min="1" 
              max={stockInfo.stock_disponible} 
              value={qty} 
              onChange={e => setQty(Number(e.target.value))}
              disabled={!inStock}
              className="qty-input glass-input"
            />
            <button 
              className="btn-primary" 
              onClick={() => {
                onAdd(product)
                setShowSuccess(true)
                setTimeout(() => setShowSuccess(false), 2000)
              }} 
              disabled={!inStock}
            >
              {showSuccess ? 'Agregado' : 'Añadir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});


export default memo(ProductCard)
