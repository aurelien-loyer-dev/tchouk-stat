// Stockage des tournois partagés.
// En production : Upstash Redis (via son API REST, sans dépendance), branché
// depuis le Marketplace Vercel. En local sans configuration : une Map en mémoire.
//
// Clés Redis :
//   trn:{code}:meta  hash  { editHash, rev, updatedAt }
//   trn:{code}:data  string  JSON du tournoi
// Les scripts Lua rendent chaque écriture atomique (vérif clé + révision).

const TTL_SEC = 60 * 60 * 24 * 180 // 6 mois sans modification → effacé

const keys = code => [`trn:${code}:meta`, `trn:${code}:data`]

function redisConfig() {
  const url   = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? { url, token } : null
}

async function redis({ url, token }, command) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.error) throw new Error(`redis: ${json.error || res.status}`)
  return json.result
}

const CREATE = `
if redis.call('EXISTS', KEYS[1]) == 1 then return 0 end
redis.call('HSET', KEYS[1], 'editHash', ARGV[1], 'rev', 1, 'updatedAt', ARGV[3])
redis.call('SET', KEYS[2], ARGV[2])
redis.call('EXPIRE', KEYS[1], ARGV[4])
redis.call('EXPIRE', KEYS[2], ARGV[4])
return 1`

const GET = `
local rev = redis.call('HGET', KEYS[1], 'rev')
if not rev then return false end
return { rev, redis.call('HGET', KEYS[1], 'updatedAt'), redis.call('GET', KEYS[2]) }`

const UPDATE = `
local h = redis.call('HGET', KEYS[1], 'editHash')
if not h then return { 404 } end
if h ~= ARGV[1] then return { 403 } end
local rev = tonumber(redis.call('HGET', KEYS[1], 'rev'))
if ARGV[2] ~= '' and tonumber(ARGV[2]) ~= rev then return { 409, rev } end
rev = rev + 1
redis.call('HSET', KEYS[1], 'rev', rev, 'updatedAt', ARGV[4])
redis.call('SET', KEYS[2], ARGV[3])
redis.call('EXPIRE', KEYS[1], ARGV[5])
redis.call('EXPIRE', KEYS[2], ARGV[5])
return { 200, rev }`

const REMOVE = `
local h = redis.call('HGET', KEYS[1], 'editHash')
if not h then return 404 end
if h ~= ARGV[1] then return 403 end
redis.call('DEL', KEYS[1], KEYS[2])
return 200`

function redisStore(cfg) {
  const run = (script, code, args) => redis(cfg, ['EVAL', script, '2', ...keys(code), ...args.map(String)])
  return {
    async create(code, editHash, data) {
      return (await run(CREATE, code, [editHash, data, new Date().toISOString(), TTL_SEC])) === 1
    },
    async get(code) {
      const r = await run(GET, code, [])
      return r ? { rev: Number(r[0]), updatedAt: r[1], data: r[2] } : null
    },
    async update(code, editHash, baseRev, data) {
      const updatedAt = new Date().toISOString()
      const [status, rev] = await run(UPDATE, code, [editHash, baseRev ?? '', data, updatedAt, TTL_SEC])
      return { status, rev: rev != null ? Number(rev) : undefined, updatedAt }
    },
    async remove(code, editHash) {
      return run(REMOVE, code, [editHash])
    },
  }
}

// Même comportement que Redis, pour le serveur de dev.
const memory = new Map()
const memoryStore = {
  async create(code, editHash, data) {
    if (memory.has(code)) return false
    memory.set(code, { editHash, rev: 1, updatedAt: new Date().toISOString(), data })
    return true
  },
  async get(code) {
    const e = memory.get(code)
    return e ? { rev: e.rev, updatedAt: e.updatedAt, data: e.data } : null
  },
  async update(code, editHash, baseRev, data) {
    const e = memory.get(code)
    if (!e) return { status: 404 }
    if (e.editHash !== editHash) return { status: 403 }
    if (baseRev != null && baseRev !== e.rev) return { status: 409, rev: e.rev }
    e.rev += 1
    e.updatedAt = new Date().toISOString()
    e.data = data
    return { status: 200, rev: e.rev, updatedAt: e.updatedAt }
  },
  async remove(code, editHash) {
    const e = memory.get(code)
    if (!e) return 404
    if (e.editHash !== editHash) return 403
    memory.delete(code)
    return 200
  },
}

export function getStore() {
  const cfg = redisConfig()
  if (cfg) return redisStore(cfg)
  if (process.env.NODE_ENV !== 'production') return memoryStore
  return null
}
