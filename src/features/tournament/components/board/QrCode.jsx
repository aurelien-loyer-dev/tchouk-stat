import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

// QR code en SVG (noir sur blanc, toujours lisible quel que soit le thème).
export default function QrCode({ value, label, className = '' }) {
  const [svg, setSvg] = useState('')

  useEffect(() => {
    let alive = true
    QRCode.toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' } })
      .then(s => { if (alive) setSvg(s) })
      .catch(() => {})
    return () => { alive = false }
  }, [value])

  return <div className={`qr ${className}`} role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />
}
