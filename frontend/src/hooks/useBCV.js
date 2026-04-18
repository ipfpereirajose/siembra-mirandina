import { useState, useEffect } from 'react'

// Tasa BCV de fallback (última conocida) — se usa mientras carga o si el backend falla
const TASA_FALLBACK = 481.22

/**
 * useBCV — Obtiene la tasa de cambio oficial BCV (USD → VES) del día.
 * 
 * Arquitectura con triple redundancia:
 *   1. Caché en memoria del servidor FastAPI (0 llamadas externas si ya fue consultada hoy)
 *   2. Persistencia en Supabase (sobrevive reinicios del servidor)
 *   3. Fallback estático si todo falla
 */
export function useBCV() {
  const [tasa, setTasa] = useState(TASA_FALLBACK)
  const [fecha, setFecha] = useState(new Date().toLocaleDateString('es-VE'))
  const [fuente, setFuente] = useState('fallback')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'
    
    fetch(`${API}/admin/tasa-bcv`)
      .then(r => r.json())
      .then(data => {
        if (data?.tasa) {
          setTasa(Number(data.tasa))
          setFecha(data.fecha || new Date().toLocaleDateString('es-VE'))
          setFuente(data.fuente || 'api')
        }
      })
      .catch(() => {
        // Silently use fallback — the UI still shows a rate
        setFecha(new Date().toLocaleDateString('es-VE'))
      })
      .finally(() => setLoading(false))
  }, [])

  /**
   * Convierte un monto en USD a Bs. formateado
   * @param {number} usd
   * @returns {string} "Bs. X.XXX,XX"
   */
  const aBs = (usd) => {
    if (!usd) return 'Bs. 0,00'
    const bs = usd * tasa
    return `Bs. ${bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return { tasa, fecha, fuente, loading, aBs }
}

