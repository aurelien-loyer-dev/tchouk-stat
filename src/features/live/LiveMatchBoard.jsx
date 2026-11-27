import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../../components/Icon'
import { Link } from '../../lib/router'
import { fmtClock } from '../../lib/format'
import { teamTextStyle } from '../../lib/teamColor'
import { formatCode, normalizeCode } from '../tournament/cloud'
import { fetchLive, remainingOf } from './liveCloud'
import './live.css'

const POLL_MS = 1500

// Écran d'un match diffusé (/m/CODE) : pour la télé de la salle ou le
// téléphone d'un spectateur. Lecture seule, mis à jour toutes les 1,5 s, le
// chrono tourne entre deux mises à jour.
export default function LiveMatchBoard({ code: rawCode }) {
  const { t } = useTranslation()
  const code = normalizeCode(rawCode)
  const rootRef = useRef(null)
  const [entry, setEntry] = useState(null)
  const [state, setState] = useState('loading') // loading | ok | notFound | notConfigured | offline
  const [, tick] = useState(0)
  const [isFull, setIsFull] = useState(false)

  useEffect(() => {
    let alive = true
    let timer
    let lastRev = 0
    async function load() {
      if (document.visibilityState === 'visible') {
        const r = await fetchLive(code)
        if (!alive) return
        if (r.ok) {
          if (r.rev !== lastRev) { lastRev = r.rev; setEntry({ data: r.data, updatedAt: r.updatedAt, now: r.now, receivedAt: Date.now() }) }
          setState('ok')
        } else if (r.status === 404) { setState('notFound') }
        else if (r.status === 503) { setState('notConfigured'); return }
        else setState(s => (s === 'ok' || s === 'offlineOk' ? 'offlineOk' : 'offline'))
      }
      timer = setTimeout(load, POLL_MS)
    }
    load()
    const onVisible = () => { if (document.visibilityState === 'visible') { clearTimeout(timer); load() } }
    document.addEventListener('visibilitychange', onVisible)
    return () => { alive = false; clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [code])

  // Chrono : rafraîchi 4 fois par seconde.
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 250)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onChange = () => setIsFull(document.fullscreenElement === rootRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const data = entry?.data
  useEffect(() => {
    document.title = data ? `${data.teams.map(tm => `${tm.name} ${tm.score}`).join(' – ')} · ${t('live.liveTag')}` : t('live.title')
  }, [data, t])

  if (!data) {
    const msg = state === 'notFound' ? t('live.notFound', { code: formatCode(code) })
      : state === 'notConfigured' ? t('live.errorNotConfigured')
      : state === 'offline' ? t('live.offlineLoading')
      : t('live.loading', { code: formatCode(code) })
    return (
      <div className="lvb lvb-empty">
        <p>{msg}</p>
        {state !== 'loading' && <Link className="btn-ghost" to="/">{t('nav.notFound.home')}</Link>}
      </div>
    )
  }

  const remaining = remainingOf(entry)
  const two = data.teams.length === 2
  const [a, b] = data.teams
  const lead = two && !data.finished ? null : two ? (a.score > b.score ? 0 : b.score > a.score ? 1 : null) : null
  const offline = state === 'offlineOk'
  const canFullscreen = !!document.documentElement.requestFullscreen

  return (
    <div className={`lvb${isFull ? ' lvb-full' : ''}`} ref={rootRef}>
      <header className="lvb-top">
        <span className={`lvb-live${offline ? ' lvb-live-off' : data.finished ? ' lvb-live-end' : ''}`}>
          <span className="lv-dot" aria-hidden="true" />
          {offline ? t('live.reconnecting') : data.finished ? t('live.finished') : t('live.liveTag')}
        </span>
        {data.label && <span className="lvb-label">{data.label}</span>}
        <span className="lvb-code">{formatCode(code)}</span>
        {canFullscreen && (
          <button className="icon-btn lvb-full-btn" onClick={() => (document.fullscreenElement ? document.exitFullscreen?.() : rootRef.current?.requestFullscreen?.().catch(() => {}))}
                  aria-label={isFull ? t('tournament.board.exitFull') : t('tournament.board.full')}>
            <Icon name={isFull ? 'shrink' : 'expand'} size={20} />
          </button>
        )}
      </header>

      {data.clock && !data.finished && (
        <div className="lvb-clock-row">
          <span className={`lvb-clock${data.clock.running ? '' : ' lvb-clock-paused'}`}>{fmtClock(remaining)}</span>
          <span className="lvb-half">{t('scorer.halfBadge', { current: data.clock.half, total: data.clock.halves })}{data.clock.running ? '' : ` · ${t('live.paused')}`}</span>
        </div>
      )}

      <div className={`lvb-board${two ? ' lvb-two' : ''}`}>
        {data.teams.map((tm, i) => (
          <div key={i} className={`lvb-team${lead === i ? ' lvb-win' : ''}`} style={{ '--tc': tm.color || 'var(--txt)' }}>
            <div className="lvb-name">{tm.name}</div>
            <div className="lvb-score" style={tm.color ? teamTextStyle(tm.color) : undefined}>{tm.score}</div>
          </div>
        ))}
      </div>

      <footer className="lvb-foot">
        <img src="/icons/logo.svg" alt="" width="20" height="20" />
        <span>Tchoukball Assistant</span>
      </footer>
    </div>
  )
}
