import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

export default function LogoUpload({ label, logo, onChange, color }) {
  const { t } = useTranslation()
  const ref = useRef(null)
  return (
    <div className="logo-upload" onClick={() => ref.current.click()} style={{ borderColor: color + '55' }}>
      {logo
        ? <img src={logo} alt={label} className="logo-preview" />
        : <div className="logo-placeholder" style={{ color }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <span>{t('setup.logo')}</span>
          </div>
      }
      <input
        ref={ref}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = ev => onChange(ev.target.result)
          reader.readAsDataURL(file)
        }}
      />
    </div>
  )
}
