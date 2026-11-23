import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../../../components/Icon'
import { editorLink, formatCode, viewerLink } from '../cloud'

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

// Partage d'un tournoi : activation, code, liens spectateur / organisateur, état de synchro.
export default function SharePanel({ tournament, syncStatus, onShare, onUnshare }) {
  const { t } = useTranslation()
  const [busy, setBusy]     = useState(false)
  const [error, setError]   = useState(null)
  const [copied, setCopied] = useState(null)
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
  const editor = !!share.key

  return (
    <section className="shr">
      <div className="shr-head">
        <div className="shr-code-block">
          <span className="shr-code-label">{t('tournament.share.codeLabel')}</span>
          <span className="shr-code">{formatCode(share.code)}</span>
        </div>
        <span className={`shr-status shr-status-${status}`} role="status">
          <span className="shr-dot" aria-hidden="true" />
          {t(`tournament.share.status.${status}`)}
        </span>
      </div>

      {editor ? (
        <>
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
        </>
      ) : (
        <p className="shr-viewer">
          <Icon name="eye" size={18} />
          {t('tournament.share.viewerMode')}
        </p>
      )}
    </section>
  )
}
