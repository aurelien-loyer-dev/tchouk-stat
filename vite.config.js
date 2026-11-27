import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// Sert les fonctions de /api (format Vercel : handler(req, res)) dans `vite dev`,
// pour tester sans `vercel dev`. Sans variables Redis, l'API utilise un stockage
// en mémoire (voir api/_store.js).
function devApi() {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv('development', process.cwd(), '')
      for (const [k, v] of Object.entries(env)) if (!(k in process.env)) process.env[k] = v

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        const name = url.pathname.match(/^\/api\/([a-z0-9-]+)\/?$/i)?.[1]
        if (!name || name.startsWith('_')) return next()

        let mod
        try { mod = await server.ssrLoadModule(`/api/${name}.js`) }
        catch { return next() }

        let raw = ''
        for await (const chunk of req) raw += chunk
        req.query = Object.fromEntries(url.searchParams)
        try { req.body = raw ? JSON.parse(raw) : undefined } catch { req.body = raw }
        res.status = code => { res.statusCode = code; return res }
        res.json = obj => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)) }

        try { await mod.default(req, res) }
        catch (err) { next(err) }
      })
    },
  }
}

// PWA : écrit dist/sw.js à partir de src/sw-template.js, avec la liste de
// tous les fichiers à garder hors ligne (build + dossier public).
function pwa() {
  const listPublic = dir => readdirSync(dir).flatMap(name => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? listPublic(full) : ['/' + relative('public', full).split('\\').join('/')]
  })
  return {
    name: 'pwa',
    apply: 'build',
    generateBundle(_, bundle) {
      const built = Object.keys(bundle).filter(f => !f.endsWith('.map')).map(f => '/' + f)
      // /index.html sert de page de secours pour toutes les routes hors ligne.
      const files = [...new Set(['/index.html', ...built, ...listPublic('public')])].filter(f => f !== '/robots.txt' && f !== '/sw.js')
      const source = readFileSync('src/sw-template.js', 'utf8')
        .replace('const VERSION = __VERSION__', `const VERSION = ${JSON.stringify(`${version}-${Date.now().toString(36)}`)}`)
        .replace('const PRECACHE = __PRECACHE__', `const PRECACHE = ${JSON.stringify(files, null, 2)}`)
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

export default defineConfig({
  plugins: [react(), devApi(), pwa()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
})
