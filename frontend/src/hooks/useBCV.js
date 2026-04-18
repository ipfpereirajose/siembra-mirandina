import { useState, useEffect } from 'react'

// Tasa BCV de fallback (última conocida) — se actualiza automáticamente via API
const TASA_FALLBACK = 481.22

/**
 * useBCV — Obtiene la tasa de cambio oficial BCV (USD → VES) del día.
 * Consume el endpoint público de ExchangeRate-API como proxy confiable.
 * Si falla, usa la última tasa conocida como fallback.
 */
export function useBCV() {
  const [tasa, setTasa] = useState(TASA_FALLBACK)
  const [fecha, setFecha] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Intentar con un proxy gratuito de tasa VES/USD
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(data => {
        if (data?.rates?.VES) {
          setTasa(Number(data.rates.VES.toFixed(2)))
          setFecha(data.date || new Date().toLocaleDateString('es-VE'))
        }
      })
      .catch(() => {
        // Fallback silencioso: usar la tasa estática del día
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

  return { tasa, fecha, loading, aBs }
}
