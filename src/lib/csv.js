// Export CSV, lisible directement par Excel, Numbers et Google Sheets.
// En français : séparateur « ; » et virgule décimale (réglages d'Excel FR) ;
// en anglais : « , » et point. BOM UTF-8 pour que les accents s'affichent.
import i18n from '../i18n'
import { PLAYER_STATS, playSeconds, playerDerivedStats } from './playerStats'
import { CATEGORIES } from '../features/match/constants'

const fr = () => !i18n.language?.startsWith('en')
const t = (k, o) => i18n.t(k, o)

function cell(v) {
  if (v == null) return ''
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : (fr() ? String(v).replace('.', ',') : String(v))
  const s = String(v)
  const sep = fr() ? ';' : ','
  return /["\n\r]/.test(s) || s.includes(sep) ? `"${s.replace(/"/g, '""')}"` : s
}

// « Tchouk'Leu – White Sharks » → « tchouk-leu-white-sharks »
const slug = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase()

export function toCsv(rows) {
  const sep = fr() ? ';' : ','
  return '﻿' + rows.map(r => r.map(cell).join(sep)).join('\r\n') + '\r\n'
}

export function downloadCsv(name, rows) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: `${slug(name) || 'export'}.csv` })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const date = iso => (iso ? new Date(iso).toLocaleString(fr() ? 'fr-FR' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '')
const day = iso => (iso ? String(iso).slice(0, 10) : 'match')
const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null)
const mmss = s => `${String(Math.floor((s || 0) / 60)).padStart(2, '0')}:${String((s || 0) % 60).padStart(2, '0')}`

// ── Un match (historique ou écran de résultats) ─────────────────────────
const TEAM_ROWS = [
  { id: 'pos', key: 'match.stats.balls' },
  ...CATEGORIES.flatMap(c => c.items.map(it => ({ id: it.id, key: it.labelKey, cat: c.titleKey }))),
]

export function matchRows(match) {
  const teams = match.teams || []
  const rows = [
    [t('csv.match'), teams.map(tm => tm.name).join(' – ')],
    [t('csv.date'), date(match.playedAt)],
    [t('csv.mode'), t(`history.modes.${match.mode || 'stats'}`)],
    [t('csv.score'), teams.map(tm => tm.score).join(' – ')],
    [],
  ]

  if (match.mode === 'player') {
    rows.push([t('csv.player'), t('csv.team'), ...PLAYER_STATS.map(s => t(s.labelKey)), t('csv.shots'), t('csv.effPct'), t('csv.defTotal'), t('csv.playTime')])
    for (const p of match.players || []) {
      const d = playerDerivedStats(p)
      const sec = playSeconds(p)
      rows.push([p.name, teams[p.teamIdx]?.name || '', ...PLAYER_STATS.map(s => Number(p[s.id]) || 0), d.tirsTotal, pct(p.pointsMarques, d.tirsTotal), d.defTotal, sec == null ? '' : mmss(Math.round(sec))])
    }
    return rows
  }

  if (match.mode !== 'scorer' && match.teamsSnapshot?.length) {
    rows.push([t('csv.stat'), ...match.teamsSnapshot.map(tm => tm.name)])
    for (const r of TEAM_ROWS) {
      rows.push([r.cat ? `${t(r.cat)} · ${t(r.key)}` : t(r.key), ...match.teamsSnapshot.map(tm => Number(tm[r.id]) || 0)])
    }
    const events = match.timeline || []
    if (events.length) {
      rows.push([], [t('csv.time'), t('csv.team'), t('csv.action'), t('csv.change'), t('csv.score')])
      const label = id => t(TEAM_ROWS.find(r => r.id === id)?.key || 'match.stats.won')
      for (const e of events) rows.push([mmss(e.elapsedSec), e.teamName, label(e.id), e.d > 0 ? `+${e.d}` : String(e.d), (e.scores || []).join(' – ')])
    }
  }
  return rows
}

export function downloadMatchCsv(match) {
  downloadCsv(`${day(match.playedAt)}_${(match.teams || []).map(tm => tm.name).join('-')}`, matchRows(match))
}

// ── Historique : un match par ligne ──────────────────────────────────────
export function downloadHistoryCsv(history) {
  const rows = [[t('csv.date'), t('csv.mode'), t('csv.team1'), t('csv.score1'), t('csv.score2'), t('csv.team2'), t('csv.duration')]]
  for (const m of history) {
    const [a, b] = m.teams || []
    rows.push([date(m.playedAt), t(`history.modes.${m.mode || 'stats'}`), a?.name || '', a?.score ?? '', b?.score ?? '', b?.name || '', mmss(m.durationSec || 0)])
  }
  downloadCsv(t('csv.historyFile'), rows)
}

// ── Saison : un joueur par ligne ─────────────────────────────────────────
export function downloadSeasonCsv(players, suffix = '') {
  const rows = [[t('csv.player'), t('csv.team'), t('season.cols.played'), ...PLAYER_STATS.map(s => t(s.labelKey)), t('csv.shots'), t('csv.effPct'), t('csv.defTotal'), t('csv.ptsPerMatch'), t('csv.minutes')]]
  for (const p of players) {
    rows.push([p.name, p.teams[0] || '', p.played, ...PLAYER_STATS.map(s => p.totals[s.id]), p.derived.tirsTotal,
      pct(p.totals.pointsMarques, p.derived.tirsTotal), p.derived.defTotal, Math.round(p.perMatch * 10) / 10, p.playSec != null ? Math.round(p.playSec / 60) : ''])
  }
  downloadCsv(`${t('csv.seasonFile')}${suffix ? `-${suffix}` : ''}`, rows)
}

// ── Un joueur : ses matchs ───────────────────────────────────────────────
export function downloadPlayerCsv(player) {
  const rows = [[t('csv.date'), t('csv.team'), t('csv.opponent'), t('csv.result'), ...PLAYER_STATS.map(s => t(s.labelKey))]]
  for (const m of player.matches) {
    rows.push([date(m.playedAt), m.team, m.opponent || '', m.result ? t(`tournament.board.form.${m.result}`) : '', ...PLAYER_STATS.map(s => m.stats[s.id])])
  }
  downloadCsv(`${player.name}_${t('csv.seasonFile')}`, rows)
}
