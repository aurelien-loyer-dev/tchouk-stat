import i18next from '../i18n'

export function fmtClock(sec) {
  const s = Math.max(0, sec || 0)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function fmtDateTime(iso) {
  try {
    const locale = i18next.language?.startsWith('en') ? 'en-GB' : 'fr-FR'
    return new Date(iso).toLocaleString(locale, {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return '' }
}

export function hexToRgb(hex) {
  const clean = String(hex || '').replace('#', '')
  const full  = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const n     = Number.parseInt(full, 16)
  if (Number.isNaN(n)) return { r: 31, g: 111, b: 235 }
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function fileSafeName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

export function pct(num, den) {
  if (!den) return '—'
  return `${Math.round((num / den) * 100)} %`
}

export function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random())
}

function dateLocale() {
  return i18next.language?.startsWith('en') ? 'en-GB' : 'fr-FR'
}

export function fmtTime(iso) {
  try { return new Date(iso).toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

// Clé de jour locale (AAAA-MM-JJ) pour regrouper les matchs.
export function dayKey(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// « Aujourd'hui », « Hier » ou la date longue.
export function fmtDayLabel(iso) {
  const key = dayKey(iso)
  const now = new Date()
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  if (key === dayKey(now.toISOString())) return i18next.t('history.today')
  if (key === dayKey(yesterday.toISOString())) return i18next.t('history.yesterday')
  try {
    return new Date(iso).toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return '' }
}

// Jour relatif + heure, pour les listes courtes (accueil).
export function fmtWhen(iso) {
  return `${fmtDayLabel(iso)} · ${fmtTime(iso)}`
}
