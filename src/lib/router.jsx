// Mini-routeur sur l'API History : de vraies URL (/stats, /tournaments/…),
// les boutons Précédent/Suivant du navigateur, et des liens ouvrables dans un
// nouvel onglet. Pas de dépendance : l'app n'a qu'une poignée d'écrans.
import { useEffect, useState } from 'react'

const NAV_EVENT = 'app:navigate'

// Ordre = priorité. `:param` capture un segment.
const ROUTES = [
  ['home',             '/'],
  ['newStats',         '/stats'],
  ['newPlayers',       '/players'],
  ['newScoreboard',    '/scoreboard'],
  ['match',            '/match'],
  ['matchResults',     '/match/results'],
  ['history',          '/history'],
  ['historyMatch',     '/history/:id'],
  ['tournaments',      '/tournaments'],
  ['tournamentNew',    '/tournaments/new'],
  ['tournament',       '/tournaments/:id'],
  ['tournamentJoin',   '/t/:code'],
  ['teams',            '/teams'],
]

const compiled = ROUTES.map(([name, pattern]) => {
  const keys = []
  const re = new RegExp('^' + pattern.replace(/:([a-z]+)/gi, (_, k) => { keys.push(k); return '([^/]+)' }) + '/?$')
  return { name, re, keys }
})

export function matchPath(pathname) {
  for (const { name, re, keys } of compiled) {
    const m = re.exec(pathname)
    if (m) return { name, params: Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) }
  }
  return { name: 'notFound', params: {} }
}

function current() {
  const { pathname, hash } = window.location
  return { ...matchPath(pathname), pathname, hash }
}

export function navigate(to, { replace = false } = {}) {
  const url = new URL(to, window.location.origin)
  const target = url.pathname + url.search + url.hash
  if (target === window.location.pathname + window.location.search + window.location.hash) return
  window.history[replace ? 'replaceState' : 'pushState'](null, '', target)
  window.dispatchEvent(new CustomEvent(NAV_EVENT, { detail: { replace } }))
}

// { name, params, pathname, hash, nav } — `nav` augmente à chaque navigation
// interne (pas au premier rendu), pour savoir quand déplacer le focus.
export function useRoute() {
  const [route, setRoute] = useState(() => ({ ...current(), nav: 0 }))
  useEffect(() => {
    const update = () => setRoute(r => ({ ...current(), nav: r.nav + 1 }))
    window.addEventListener('popstate', update)
    window.addEventListener(NAV_EVENT, update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener(NAV_EVENT, update)
    }
  }, [])
  return route
}

// Lien interne : vrai <a href> (clic molette, Cmd+clic, copier le lien…),
// navigation sans rechargement pour un clic simple.
export function Link({ to, replace, onClick, children, ...rest }) {
  function handleClick(e) {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (rest.target && rest.target !== '_self') return
    e.preventDefault()
    navigate(to, { replace })
  }
  return <a href={to} onClick={handleClick} {...rest}>{children}</a>
}
