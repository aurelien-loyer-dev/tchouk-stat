import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../../components/Icon'
import QrCode from '../tournament/components/board/QrCode'
import { formatCode } from '../tournament/cloud'
import { screenLink } from './liveCloud'
import './live.css'

// Bouton « Diffuser » des écrans de match, et sa fenêtre : lancer la
// diffusion, lien et QR code de l'écran (télé, public), arrêt.
// variant : 'mini' (feuille de stats, stats joueurs) ou 'scorer'.
export default function LiveShareControl({ live, variant = 'mini' }) {
  const { t } = useTranslation()
  const ref = useRef(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)
  const on = !!live.share

  useEffect(() => { if (!copied) return undefined; const id = setTimeout(() => setCopied(false), 1500); return () => clearTimeout(id) }, [copied])

  const open = () => { setError(null); ref.current?.showModal() }
  const close = () => ref.current?.close()

  async function start() {
    setError(null)
    const r = await live.start()
    if (!r.ok) setError(r.status === 503 ? t('live.errorNotConfigured') : r.status === 0 ? t('live.errorOffline') : t('live.errorGeneric'))
  }

  async function copy() {
    try { await navigator.clipboard.writeText(screenLink(live.share)); setCopied(true) } catch {}
  }

  const btnClass = variant === 'scorer' ? 'sc-ctrl-btn' : 'btn-mini'
  const statusKey = live.status === 'offline' ? 'offline' : live.status === 'saving' || live.status === 'starting' ? 'saving' : 'ok'

  return (
    <>
      <button className={`${btnClass} lv-btn${on ? ' lv-btn-on' : ''}`} onClick={open} aria-haspopup="dialog">
        {on ? <span className={`lv-dot lv-dot-${statusKey}`} aria-hidden="true" /> : <Icon name="share" size={16} />}
        {on ? t('live.onAir') : t('live.button')}
      </button>

      <dialog ref={ref} className="lv-dialog" aria-labelledby="lv-title" onClick={e => { if (e.target === ref.current) close() }}>
        <div className="lv-card">
          <div className="lv-head">
            <h2 id="lv-title">{t('live.title')}</h2>
            <button className="icon-btn" onClick={close} aria-label={t('tournament.share.close')}><Icon name="close" size={20} /></button>
          </div>

          {!on ? (
            <>
              <p className="lv-text">{t('live.intro')}</p>
              <ul className="lv-uses">
                <li>{t('live.useTv')}</li>
                <li>{t('live.usePublic')}</li>
              </ul>
              {error && <p className="lv-error" role="alert">{error}</p>}
              <button className="btn-acc lv-start" onClick={start} disabled={live.status === 'starting'}>
                {live.status === 'starting' ? t('live.starting') : t('live.start')}
              </button>
            </>
          ) : (
            <>
              <div className="lv-status" role="status">
                <span className={`lv-dot lv-dot-${statusKey}`} aria-hidden="true" />
                {t(`live.status.${statusKey}`)}
              </div>
              <div className="lv-share">
                <QrCode value={screenLink(live.share)} label={t('live.screenLink')} className="lv-qr" />
                <div className="lv-share-text">
                  <span className="lv-label">{t('live.codeLabel')}</span>
                  <span className="lv-code">{formatCode(live.share.code)}</span>
                  <span className="lv-url">{screenLink(live.share).replace(/^https?:\/\//, '')}</span>
                  <p className="lv-hint">{t('live.screenHint')}</p>
                </div>
              </div>
              <div className="lv-actions">
                <button className="btn-mini" onClick={copy}><Icon name="copy" size={16} />{copied ? t('tournament.share.copied') : t('tournament.share.copyLink')}</button>
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button className="btn-mini" onClick={() => navigator.share({ url: screenLink(live.share) }).catch(() => {})}>
                    <Icon name="share" size={16} />{t('tournament.share.send')}
                  </button>
                )}
                <a className="btn-mini" href={screenLink(live.share)} target="_blank" rel="noopener">
                  <Icon name="expand" size={16} />{t('live.openScreen')}
                </a>
              </div>
              <p className="lv-text lv-small">{t('live.keepNote')}</p>
              <button className="btn-link lv-stop" onClick={() => { if (window.confirm(t('live.stopConfirm'))) live.stop() }}>{t('live.stop')}</button>
            </>
          )}
        </div>
      </dialog>
    </>
  )
}
