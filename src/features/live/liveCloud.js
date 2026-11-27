// Client de l'API des matchs en direct (api/match.js).
const ENDPOINT = '/api/match'
const SHARE_KEY = 'tchouk_live_share'

async function call(method, code, body) {
  const qs = code ? `?code=${encodeURIComponent(code)}` : ''
  try {
    const res = await fetch(ENDPOINT + qs, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, ...json }
  } catch {
    return { ok: false, status: 0, error: 'offline' }
  }
}

export const createLive = data        => call('POST', null, { data })
export const fetchLive  = code        => call('GET', code)
export const pushLive   = (share, data) => call('PUT', share.code, { key: share.key, data })
export const removeLive = share       => call('DELETE', share.code, { key: share.key })

// Lien de l'écran (télé, téléphones du public) : /m/CODE.
export const screenLink = share => `${window.location.origin}/m/${share.code}`

// La diffusion survit aux rechargements et aux matchs suivants : la télé garde
// le même lien d'un match à l'autre.
export function loadLiveShare() {
  try { return JSON.parse(localStorage.getItem(SHARE_KEY) || 'null') } catch { return null }
}
export function saveLiveShare(share) {
  try {
    if (share) localStorage.setItem(SHARE_KEY, JSON.stringify(share))
    else localStorage.removeItem(SHARE_KEY)
  } catch {}
}

// Temps restant affiché par un écran : le chrono continue entre deux mises à
// jour, calculé avec l'heure du serveur (pas celle de l'appareil).
// entry : { data, updatedAt, now (serveur), receivedAt (ms, appareil) }
export function remainingOf(entry, nowMs = Date.now()) {
  const c = entry?.data?.clock
  if (!c) return null
  if (!c.running) return Math.max(0, c.remainingSec)
  const age = (Date.parse(entry.now) - Date.parse(entry.updatedAt)) / 1000 + (nowMs - entry.receivedAt) / 1000
  return Math.max(0, Math.round(c.remainingSec - Math.max(0, age)))
}
