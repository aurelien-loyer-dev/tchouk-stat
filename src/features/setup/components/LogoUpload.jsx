import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../../../components/Icon'

export default function LogoUpload({ label, logo, onChange, color }) {
  const { t } = useTranslation()
  const ref = useRef(null)
  return (
    <>
      <button
        type="button"
        className="logo-upload"
        onClick={() => ref.current.click()}
        style={{ '--tc': color }}
        aria-label={`${t('setup.logo')} — ${label}`}
      >
        {logo
          ? <img src={logo} alt={label} className="logo-preview" />
          : <span className="logo-placeholder">
              <Icon name="image" size={22} />
              <span>{t('setup.logo')}</span>
            </span>
        }
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={e => {
          const file = e.target.files[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = ev => onChange(ev.target.result)
          reader.readAsDataURL(file)
        }}
      />
    </>
  )
}
