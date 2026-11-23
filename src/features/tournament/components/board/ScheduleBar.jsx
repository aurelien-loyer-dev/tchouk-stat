import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../../../../components/Icon'
import { DEFAULT_SCHEDULE, fmtHour, matchMinutes } from '../../overview'

const toHHMM = iso => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
// Garde le jour de début déjà prévu, ne change que l'heure.
const withTime = (iso, hhmm) => {
  const d = Number.isNaN(Date.parse(iso)) ? new Date() : new Date(iso)
  const [h, m] = hhmm.split(':').map(Number)
  d.setHours(h || 0, m || 0, 0, 0)
  return d.toISOString()
}

// Horaires du tournoi côté organisateur : résumé (début, format d'un match,
// fin estimée) et réglages modifiables à tout moment.
export default function ScheduleBar({ schedule, estimate, onChange }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const s = schedule || null
  const set = (k, v) => onChange({ ...s, [k]: v })

  if (!s) {
    return (
      <div className="schb schb-empty">
        <span>{t('tournament.schedule.none')}</span>
        <button className="btn-mini" onClick={() => { onChange({ ...DEFAULT_SCHEDULE, startAt: new Date().toISOString() }); setOpen(true) }}>
          <Icon name="plus" size={16} />{t('tournament.schedule.add')}
        </button>
      </div>
    )
  }

  return (
    <section className="schb" aria-label={t('tournament.schedule.title')}>
      <div className="schb-row">
        <dl className="schb-facts">
          <div><dt>{t('tournament.schedule.startShort')}</dt><dd>{fmtHour(Date.parse(s.startAt))}</dd></div>
          <div><dt>{t('tournament.schedule.matchShort')}</dt><dd>{t('tournament.schedule.matchFormat', { halves: s.halves, min: s.halfMin, total: matchMinutes(s) })}</dd></div>
          {estimate?.endAt && (
            <div className="schb-end"><dt>{estimate.finished ? t('tournament.schedule.ended') : t('tournament.schedule.endShort')}</dt><dd>~{fmtHour(estimate.endAt)}</dd></div>
          )}
        </dl>
        <button className="btn-mini" onClick={() => setOpen(o => !o)} aria-expanded={open}>
          {t('tournament.schedule.edit')}<Icon name="down" size={16} className={open ? 'schb-chev-open' : ''} />
        </button>
      </div>
      {open && (
        <div className="trn-sched-grid schb-edit">
          <label className="field">
            <span className="flabel">{t('tournament.schedule.start')}</span>
            <input type="time" className="trn-time" value={toHHMM(s.startAt)} onChange={e => e.target.value && set('startAt', withTime(s.startAt, e.target.value))} />
          </label>
          <label className="field">
            <span className="flabel">{t('tournament.schedule.halves')}</span>
            <select className="sel" value={s.halves} onChange={e => set('halves', Number(e.target.value))}>
              {[1, 2, 3, 4].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="flabel">{t('tournament.schedule.halfMin')}</span>
            <input type="number" min="1" max="90" value={s.halfMin} onChange={e => set('halfMin', Math.max(1, Number(e.target.value) || 1))} />
          </label>
          {s.halves > 1 && (
            <label className="field">
              <span className="flabel">{t('tournament.schedule.halfBreak')}</span>
              <input type="number" min="0" max="60" value={s.halfBreakMin} onChange={e => set('halfBreakMin', Math.max(0, Number(e.target.value) || 0))} />
            </label>
          )}
          <label className="field">
            <span className="flabel">{t('tournament.schedule.change')}</span>
            <input type="number" min="0" max="60" value={s.changeMin} onChange={e => set('changeMin', Math.max(0, Number(e.target.value) || 0))} />
          </label>
          <button className="btn-link schb-remove" onClick={() => { onChange(null); setOpen(false) }}>{t('tournament.schedule.remove')}</button>
        </div>
      )}
    </section>
  )
}
