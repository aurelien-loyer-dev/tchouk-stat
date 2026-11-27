// API des matchs diffusés en direct (fonction Vercel) : un téléphone pilote
// le match, une télé ou les téléphones du public affichent le score.
//   GET    /api/match?code=ABC123            → { code, rev, updatedAt, now, data }
//   POST   /api/match        { data }        → { code, key, rev, updatedAt }
//   PUT    /api/match?code=  { key, data }   → { rev, updatedAt }
//   DELETE /api/match?code=  { key }
// Même principe que les tournois : le code suffit pour lire, la clé (seul son
// hash est stocké) pour modifier. Un seul téléphone pilote : pas de contrôle de
// révision, la dernière écriture gagne. `now` (heure du serveur) permet aux
// écrans de faire tourner le chrono sans dépendre de l'heure de l'appareil.

import { createHash, randomInt } from 'node:crypto'
import { getStore } from './_store.js'

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const KEY_ALPHABET  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const CODE_LEN = 6
const KEY_LEN  = 24
const MAX_BYTES = 16 * 1024
const TTL_SEC = 60 * 60 * 48 // 2 jours sans mise à jour → effacé

const randomString = (alphabet, len) => Array.from({ length: len }, () => alphabet[randomInt(alphabet.length)]).join('')
const hashKey = key => createHash('sha256').update(String(key)).digest('hex')

function normCode(raw) {
  const c = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return c.length === CODE_LEN && [...c].every(ch => CODE_ALPHABET.includes(ch)) ? c : null
}

function readBody(req) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body) } catch { return {} }
  }
  return req.body || {}
}

// JSON à stocker, ou null si ce n'est pas un état de match plausible.
function serializeMatch(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  if (data.kind !== 'match' || !Array.isArray(data.teams) || data.teams.length < 1 || data.teams.length > 2) return null
  if (!data.teams.every(t => t && typeof t.name === 'string' && Number.isFinite(t.score))) return null
  const json = JSON.stringify(data)
  return Buffer.byteLength(json) <= MAX_BYTES ? json : null
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const store = getStore('live', TTL_SEC)
  if (!store) return res.status(503).json({ error: 'not_configured' })

  const body = readBody(req)
  const code = normCode(req.query?.code)

  try {
    if (req.method === 'GET') {
      if (!code) return res.status(400).json({ error: 'bad_code' })
      const entry = await store.get(code)
      if (!entry) return res.status(404).json({ error: 'not_found' })
      return res.status(200).json({ code, rev: entry.rev, updatedAt: entry.updatedAt, now: new Date().toISOString(), data: JSON.parse(entry.data) })
    }

    if (req.method === 'POST') {
      const json = serializeMatch(body.data)
      if (!json) return res.status(400).json({ error: 'bad_data' })
      const key = randomString(KEY_ALPHABET, KEY_LEN)
      for (let attempt = 0; attempt < 5; attempt++) {
        const newCode = randomString(CODE_ALPHABET, CODE_LEN)
        if (await store.create(newCode, hashKey(key), json)) {
          return res.status(201).json({ code: newCode, key, rev: 1, updatedAt: new Date().toISOString() })
        }
      }
      return res.status(500).json({ error: 'code_collision' })
    }

    if (req.method === 'PUT') {
      if (!code) return res.status(400).json({ error: 'bad_code' })
      const json = serializeMatch(body.data)
      if (!json || !body.key) return res.status(400).json({ error: 'bad_data' })
      const r = await store.update(code, hashKey(body.key), null, json)
      if (r.status === 200) return res.status(200).json({ rev: r.rev, updatedAt: r.updatedAt })
      return res.status(r.status).json({ error: r.status === 403 ? 'forbidden' : 'not_found' })
    }

    if (req.method === 'DELETE') {
      if (!code || !body.key) return res.status(400).json({ error: 'bad_code' })
      const status = await store.remove(code, hashKey(body.key))
      return res.status(status).json(status === 200 ? { ok: true } : { error: status === 403 ? 'forbidden' : 'not_found' })
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE')
    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'server_error' })
  }
}
