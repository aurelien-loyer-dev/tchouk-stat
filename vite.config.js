import { readFileSync } from 'node:fs'
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

export default defineConfig({
  plugins: [react(), devApi()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
})
