import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../../../components/Icon'
import QrCode from './board/QrCode'
import { editorLink, formatCode, hallLink, viewerLink } from '../cloud'

function errorKey(r) {
  if (r?.status === 503) return 'tournament.share.errorNotConfigured'
  if (r?.status === 0)   return 'tournament.share.errorOffline'
  return 'tournament.share.errorGeneric'
}

function LinkRow({ label, hint, url, copied, onCopy }) {
  const { t } = useTranslation()
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share
  return (
    <div className="shr-link">
      <div className="shr-link-text">
        <span className="shr-link-label">{label}</span>
        {hint && <span className="shr-link-hint">{hint}</span>}
      </div>
      <div className="shr-link-actions">
        <button className="btn-mini" onClick={onCopy}>
          <Icon name="copy" size={16} />{copied ? t('tournament.share.copied') : t('tournament.share.copyLink')}
        </button>
        {canNativeShare && (
          <button className="btn-mini" onClick={() => navigator.share({ url }).catch(() => {})}>
            <Icon name="share" size={16} />{t('tournament.share.send')}
          </button>
        )}
      </div>
    </div>
  )
}

// QR code plein écran, à montrer au public ou à projeter dans la salle.
function QrOverlay({ tournament, onClose }) {
  const { t } = useTranslation()
  const share = tournament.share
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="qro" role="dialog" aria-modal="true" aria-label={t('tournament.share.qrTitle')} onClick={onClose}>
      <div className="qro-card" onClick={e => e.stopPropagation()}>
        <button className="icon-btn qro-close" onClick={onClose} aria-label={t('tournament.share.close')} autoFocus>
          <Icon name="close" size={20} />
        </button>
        <p className="qro-kicker">{t('tournament.share.qrKicker')}</p>
        <h2 className="qro-name">{tournament.name}</h2>
        <QrCode value={viewerLink(share)} label={t('tournament.share.viewerLink')} className="qro-qr" />
        <p className="qro-alt">{t('tournament.share.qrAlt')}</p>
        <p className="qro-code">{formatCode(share.code)}</p>
      </div>
    </div>
  )
}

// Partage côté organisateur : activation, puis barre compacte (code, état, QR)
// qui se déplie sur les liens.
export default function SharePanel({ tournament, syncStatus, onShare, onUnshare }) {
  const { t } = useTranslation()
  const [busy, setBusy]     = useState(false)
  const [error, setError]   = useState(null)
  const [copied, setCopied] = useState(null)
  const [open, setOpen]     = useState(false)
  const [qrBig, setQrBig]   = useState(false)
  const share = tournament.share

  async function run(action) {
    setBusy(true)
    setError(null)
    const r = await action()
    setBusy(false)
    if (r && !r.ok) setError(errorKey(r))
  }

  async function copy(which, url) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(which)
      setTimeout(() => setCopied(c => (c === which ? null : c)), 2000)
    } catch {
      window.prompt(t('tournament.share.copyFallback'), url)
    }
  }

  if (!share) {
    return (
      <section className="shr shr-intro">
        <div className="shr-intro-text">
          <h2>{t('tournament.share.introTitle')}</h2>
          <p>{t('tournament.share.introText')}</p>
          {error && <p className="shr-error">{t(error)}</p>}
        </div>
        <button className="btn-acc" onClick={() => run(onShare)} disabled={busy}>
          {busy ? t('tournament.share.enabling') : t('tournament.share.enable')}
        </button>
      </section>
    )
  }

  const status = syncStatus || 'ok'

  return (
    <section className={`shr${open ? ' shr-open' : ''}`}>
      <div className="shr-bar">
        <div className="shr-code-block">
          <span className="shr-code-label">{t('tournament.share.codeLabel')}</span>
          <span className="shr-code">{formatCode(share.code)}</span>
        </div>
        <span className={`shr-status shr-status-${status}`} role="status">
          <span className="shr-dot" aria-hidden="true" />
          {t(`tournament.share.status.${status}`)}
        </span>
        <div className="shr-bar-actions">
          <button className="btn-mini" onClick={() => setQrBig(true)}>
            <Icon name="qr" size={16} />{t('tournament.share.showQr')}
          </button>
          <a className="btn-mini" href={hallLink(share)} target="_blank" rel="noopener" title={t('tournament.hall.hint')}>
            <Icon name="scoreboard" size={16} />{t('tournament.hall.open')}
          </a>
          <button className="btn-mini" onClick={() => setOpen(o => !o)} aria-expanded={open}>
            {t('tournament.share.links')}
            <Icon name="down" size={16} className="shr-chev" />
          </button>
        </div>
      </div>

      {open && (
        <div className="shr-body">
          <button className="shr-qr-btn" onClick={() => setQrBig(true)} aria-label={t('tournament.share.showQr')}>
            <QrCode value={viewerLink(share)} label={t('tournament.share.viewerLink')} />
          </button>
          <div className="shr-links">
            <LinkRow
              label={t('tournament.share.viewerLink')}
              hint={t('tournament.share.viewerHint')}
              url={viewerLink(share)}
              copied={copied === 'viewer'}
              onCopy={() => copy('viewer', viewerLink(share))}
            />
            <LinkRow
              label={t('tournament.share.editorLink')}
              hint={t('tournament.share.editorHint')}
              url={editorLink(share)}
              copied={copied === 'editor'}
              onCopy={() => copy('editor', editorLink(share))}
            />
            <div className="shr-foot">
              {error && <p className="shr-error">{t(error)}</p>}
              <button
                className="btn-link shr-stop"
                disabled={busy}
                onClick={() => window.confirm(t('tournament.share.stopConfirm')) && run(onUnshare)}
              >
                {t('tournament.share.stop')}
              </button>
            </div>
          </div>
        </div>
      )}

      {qrBig && <QrOverlay tournament={tournament} onClose={() => setQrBig(false)} />}
    </section>
  )
}
