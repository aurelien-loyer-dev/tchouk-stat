import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../../../../components/Icon'
import { clockRemainingMs } from '../../overview'

function fmt(ms) {
  const total = Math.ceil(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(h ? 2 : 1, '0')
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

function useNow(active) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [active])
  return now
}

// Chrono du tournoi, purement informatif (pause, temps d'un créneau…).
// `editable` : réglages et boutons pour l'organisateur ; sinon simple affichage.
export default function TournamentClock({ clock, editable, onChange, variant = 'bar' }) {
  const { t } = useTranslation()
  const now = useNow(!!clock?.running)
  const [minutes, setMinutes] = useState(() => String(Math.round((clock?.durationSec || 600) / 60)))
  const [label, setLabel]     = useState(clock?.label || '')

  const remaining = clockRemainingMs(clock, now)
  const set = remaining !== null
  const over = set && remaining === 0
  const running = !!clock?.running && !over

  if (!editable && !set) return null

  function apply(next) { onChange({ ...clock, ...next }) }

  function setDuration(e) {
    e.preventDefault()
    const min = Math.max(1, Math.min(600, Number(minutes) || 0))
    onChange({ label: label.trim(), durationSec: min * 60, remainingSec: min * 60, running: false, endsAt: null })
  }
  const start = () => apply({ running: true, endsAt: Date.now() + (remaining ?? 0) })
  const pause = () => apply({ running: false, endsAt: null, remainingSec: Math.ceil((remaining ?? 0) / 1000) })
  const reset = () => apply({ running: false, endsAt: null, remainingSec: clock.durationSec })
  const addMin = () => running
    ? apply({ endsAt: clock.endsAt + 60000, durationSec: clock.durationSec + 60 })
    : apply({ remainingSec: Math.ceil((remaining ?? 0) / 1000) + 60, durationSec: clock.durationSec + 60 })
  const clear = () => onChange(null)

  const display = (
    <div className={`tc-display${running ? ' tc-running' : ''}${over ? ' tc-over' : ''}`} role="timer" aria-live="off">
      <span className="tc-label">{clock?.label || t('tournament.clock.title')}</span>
      <span className="tc-time">{set ? fmt(remaining) : '–:––'}</span>
      {over && <span className="tc-over-tag">{t('tournament.clock.over')}</span>}
      {!over && set && !running && <span className="tc-state">{t('tournament.clock.paused')}</span>}
    </div>
  )

  if (!editable) return <div className={`tc tc-${variant}`}>{display}</div>

  return (
    <section className={`tc tc-${variant} tc-edit`} aria-label={t('tournament.clock.title')}>
      {display}
      {set ? (
        <div className="tc-controls">
          {running ? (
            <button className="btn-mini" onClick={pause}><Icon name="pause" size={16} />{t('tournament.clock.pause')}</button>
          ) : (
            <button className="btn-mini tc-go" onClick={start} disabled={over}><Icon name="play" size={14} />{t('tournament.clock.start')}</button>
          )}
          <button className="btn-mini" onClick={addMin}>{t('tournament.clock.addMin')}</button>
          <button className="btn-mini" onClick={reset} aria-label={t('tournament.clock.reset')} title={t('tournament.clock.reset')}><Icon name="reset" size={16} /></button>
          <button className="btn-mini" onClick={clear} aria-label={t('tournament.clock.remove')} title={t('tournament.clock.remove')}><Icon name="close" size={16} /></button>
        </div>
      ) : (
        <form className="tc-setup" onSubmit={setDuration}>
          <label className="tc-field">
            <span className="sr-only">{t('tournament.clock.labelField')}</span>
            <input type="text" value={label} maxLength={40} placeholder={t('tournament.clock.labelPlaceholder')} onChange={e => setLabel(e.target.value)} />
          </label>
          <label className="tc-field tc-min">
            <span className="sr-only">{t('tournament.clock.minutes')}</span>
            <input type="number" min="1" max="600" inputMode="numeric" value={minutes} onChange={e => setMinutes(e.target.value)} />
            <span aria-hidden="true">min</span>
          </label>
          <button type="submit" className="btn-mini tc-go">{t('tournament.clock.set')}</button>
        </form>
      )}
    </section>
  )
}
