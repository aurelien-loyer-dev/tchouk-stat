import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from './Icon'
import { canShareFiles, canvasBlob, downloadBlob, shareBlob } from '../lib/shareImage'
import './ShareImage.css'

// Bouton « Image » : prépare l'image (format story), la montre en aperçu,
// puis la partage (téléphone) ou la télécharge.
// getSpec : () => ({ title, filename, build: async () => canvas })
export default function ShareImage({ getSpec, className = 'btn-ghost', label }) {
  const { t } = useTranslation()
  const ref = useRef(null)
  const [state, setState] = useState({ status: 'idle' })
  const canShare = canShareFiles()

  useEffect(() => () => { if (state.url) URL.revokeObjectURL(state.url) }, [state.url])

  async function open() {
    ref.current?.showModal()
    setState({ status: 'building' })
    try {
      const spec = getSpec()
      const blob = await canvasBlob(await spec.build())
      if (!blob) throw new Error('toBlob')
      setState({ status: 'ready', blob, url: URL.createObjectURL(blob), spec })
    } catch {
      setState({ status: 'error' })
    }
  }

  const close = () => ref.current?.close()

  async function share() {
    const r = await shareBlob(state.blob, state.spec.filename, state.spec.title)
    if (r === 'failed') downloadBlob(state.blob, state.spec.filename)
  }

  return (
    <>
      <button className={className} onClick={open} aria-haspopup="dialog" title={t('shareImg.hint')}>
        <Icon name="image" size={className === 'btn-mini' ? 16 : 18} />{label || t('shareImg.button')}
      </button>
      <dialog ref={ref} className="si-dialog" aria-labelledby="si-title" onClick={e => { if (e.target === ref.current) close() }}>
        <div className="si-card">
          <div className="si-head">
            <h2 id="si-title">{t('shareImg.title')}</h2>
            <button className="icon-btn" onClick={close} aria-label={t('tournament.share.close')}><Icon name="close" size={20} /></button>
          </div>
          <div className="si-preview" aria-busy={state.status === 'building'}>
            {state.status === 'ready' && <img src={state.url} alt={state.spec.title} />}
            {state.status === 'building' && <span className="si-wait">{t('shareImg.building')}</span>}
            {state.status === 'error' && <span className="si-wait" role="alert">{t('shareImg.error')}</span>}
          </div>
          <p className="si-hint">{t('shareImg.hint')}</p>
          <div className="si-actions">
            {canShare && (
              <button className="btn-acc" onClick={share} disabled={state.status !== 'ready'}>
                <Icon name="share" size={18} />{t('shareImg.share')}
              </button>
            )}
            <button className={canShare ? 'btn-ghost' : 'btn-acc'} onClick={() => downloadBlob(state.blob, state.spec.filename)} disabled={state.status !== 'ready'}>
              <Icon name="download" size={18} />{t('shareImg.download')}
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
