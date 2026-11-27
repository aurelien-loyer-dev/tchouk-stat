import { useEffect, useState } from 'react'
import i18n from '../../i18n'
import { fmtHour } from './overview'

const ALERTS_KEY = 'tchouk_trn_alerts'   // { [idTournoi]: true }
const SENT_KEY = 'tchouk_trn_alerted'    // { [idTournoi]: [clé match:état…] }

function read(key) { try { return JSON.parse(localStorage.getItem(key) || '{}') } catch { return {} } }
function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)) } catch {} }

export const alertsEnabled = id => !!read(ALERTS_KEY)[id]
export const notifySupported = () => typeof window !== 'undefined' && 'Notification' in window

const involves = (f, team) => f && (f.match.team1 === team || f.match.team2 === team)

// Où en est l'équipe suivie : { kind: 'now' | 'next', fixture, court, time } ou null.
export function teamStatus(team, plan, est) {
  if (!team || !plan) return null
  const ci = plan.onCourt.findIndex(f => involves(f, team))
  if (ci !== -1) return { kind: 'now', fixture: plan.onCourt[ci], court: plan.count > 1 ? ci + 1 : null, time: est?.courtEnds?.[ci] ?? null }
  const next = plan.slots[0]?.find(s => involves(s.fixture, team))
  if (next) return { kind: 'next', fixture: next.fixture, court: plan.count > 1 ? next.court : null, time: est?.slotStarts?.[0] ?? null }
  return null
}

function message(team, status) {
  const f = status.fixture.match
  const opponent = f.team1 === team ? f.team2 : f.team1
  const where = status.court ? i18n.t('tournament.alert.onCourt', { n: status.court }) : ''
  if (status.kind === 'now') {
    return { title: i18n.t('tournament.alert.nowTitle', { team }), body: [i18n.t('tournament.alert.vs', { team: opponent }), where].filter(Boolean).join(' · ') }
  }
  const when = status.time ? i18n.t('tournament.alert.around', { time: fmtHour(status.time) }) : ''
  return { title: i18n.t('tournament.alert.nextTitle', { team }), body: [i18n.t('tournament.alert.vs', { team: opponent }), when, where].filter(Boolean).join(' · ') }
}

async function notify({ title, body }, tag) {
  try { navigator.vibrate?.([200, 100, 200]) } catch {}
  if (!notifySupported() || Notification.permission !== 'granted') return
  const options = { body, tag, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' }
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.()
    if (reg) { await reg.showNotification(title, options); return }
  } catch {}
  try { new Notification(title, options) } catch {}
}

// Alerte « ton équipe joue bientôt » sur la page publique : une notification
// (si autorisée) et une vibration quand le match de l'équipe suivie passe au
// créneau suivant, puis quand il commence. Une seule fois par match et par état.
export function useTeamAlert(tournamentId, team, plan, est) {
  const [enabled, setEnabled] = useState(() => alertsEnabled(tournamentId))
  const [permission, setPermission] = useState(() => (notifySupported() ? Notification.permission : 'unsupported'))
  const status = teamStatus(team, plan, est)

  async function toggle() {
    const next = !enabled
    if (next && notifySupported() && Notification.permission === 'default') {
      try { setPermission(await Notification.requestPermission()) } catch {}
    }
    const all = read(ALERTS_KEY)
    if (next) all[tournamentId] = true; else delete all[tournamentId]
    write(ALERTS_KEY, all)
    setEnabled(next)
  }

  const key = status ? `${status.fixture.match.id}:${status.kind}` : null
  useEffect(() => {
    if (!enabled || !key || !team) return
    const sent = read(SENT_KEY)
    const list = sent[tournamentId] || []
    if (list.includes(key)) return
    sent[tournamentId] = [...list, key].slice(-200)
    write(SENT_KEY, sent)
    notify(message(team, status), key)
  }, [enabled, key, team, tournamentId])

  return { enabled, toggle, permission, status, message: status && team ? message(team, status) : null }
}
