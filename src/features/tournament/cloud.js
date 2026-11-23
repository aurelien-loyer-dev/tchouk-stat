// Client de l'API des tournois partagés (api/tournament.js).
// Un tournoi partagé porte localement `share: { code, key, rev, updatedAt }` :
// `key` présent = organisateur (peut modifier), absent = spectateur.

const ENDPOINT = '/api/tournament'

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

// Le tournoi tel qu'envoyé au serveur : sans les infos de partage locales.
export function stripShare(tour) {
  const { share, ...data } = tour
  return data
}

export const createShare = tour            => call('POST', null, { data: stripShare(tour) })
export const fetchShared  = code            => call('GET', code)
export const pushShared   = (share, tour)   => call('PUT', share.code, { key: share.key, baseRev: share.rev, data: stripShare(tour) })
export const removeShared = share           => call('DELETE', share.code, { key: share.key })

export const canEdit  = tour => !!tour?.share?.key
export const isViewer = tour => !!tour?.share && !tour.share.key

// Code affiché en deux groupes : K7MQ2P → K7M-Q2P
export const formatCode = code => (code ? `${code.slice(0, 3)}-${code.slice(3)}` : '')
export const normalizeCode = raw => String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '')

// Liens : /t/CODE pour suivre ; la clé organisateur passe dans le fragment
// (#key=…), qui n'est jamais envoyé au serveur ni gardé dans ses journaux.
export const viewerLink = share => `${window.location.origin}/t/${share.code}`
export const editorLink = share => `${window.location.origin}/t/${share.code}#key=${share.key}`

// Ancien format de lien (#trn=CODE.CLÉ), encore accepté.
export function parseJoinHash(hash = window.location.hash) {
  const m = /^#trn=([A-Za-z0-9-]+)(?:\.([A-Za-z0-9]+))?$/.exec(hash || '')
  if (!m) return null
  const code = normalizeCode(m[1])
  return code.length === 6 ? { code, key: m[2] || null } : null
}
