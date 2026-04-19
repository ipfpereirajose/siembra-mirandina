import React from 'react'

const PaymentInstructions = ({ method, amountUsd, amountBs }) => {
  const instructions = {
    'TRANSFERENCIA_BANCARIA': {
      title: '🏦 Transferencia Bancaria Nacional',
      details: [
        { label: 'Banco', value: 'Banesco' },
        { label: 'Cuenta', value: '0134-XXXX-XX-XXXXXXXXXX' },
        { label: 'Beneficiario', value: 'Siembra Mirandina C.A.' },
        { label: 'RIF', value: 'J-XXXXXXXX-X' },
        { label: 'Tipo', value: 'Cuenta Corriente' }
      ]
    },
    'PAGO_MOVIL': {
      title: '📱 Pago Móvil',
      details: [
        { label: 'Banco', value: 'Banesco (0134)' },
        { label: 'Teléfono', value: '0412-1234567' },
        { label: 'CI/RIF', value: 'J-XXXXXXXX-X' }
      ]
    },
    'ZELLE': {
      title: '💵 Zelle (USD)',
      details: [
        { label: 'Email', value: 'pagos@siembramirandina.com' },
        { label: 'Beneficiario', value: 'Miranda Agrotech LLC' }
      ]
    },
    'PAYPAL': {
      title: '💳 PayPal',
      details: [
        { label: 'Email', value: 'admin@siembramirandina.com' },
        { label: 'Nota', value: 'Por favor añadir el número de orden en el concepto.' }
      ]
    }
  }

  const current = instructions[method] || instructions['TRANSFERENCIA_BANCARIA']

  return (
    <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1rem', border: '1px solid var(--miranda-primary)', background: 'rgba(52, 211, 153, 0.05)' }}>
      <h4 style={{ color: 'var(--miranda-primary)', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
        {current.title}
      </h4>
      <p style={{ fontSize: '0.85rem', marginBottom: '1rem', opacity: 0.8 }}>
        Por favor realice el pago por <strong>${amountUsd} USD</strong> (o <strong>{amountBs}</strong>) y conserve el comprobante.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
        {current.details.map((d, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
            <span style={{ opacity: 0.7 }}>{d.label}:</span>
            <span style={{ fontWeight: 'bold' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PaymentInstructions
