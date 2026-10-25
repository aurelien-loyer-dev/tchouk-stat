import { useEffect, useState } from 'react'

// Thème clair/sombre : suit le système tant que l'utilisateur n'a rien choisi,
// puis mémorise son choix. Le script inline d'index.html pose data-theme avant
// le premier rendu pour éviter un flash.
export const THEME_KEY = 'tchouk_theme'

function systemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function storedTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch { return null }
}

function apply(theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#14120f' : '#f4efe6')
}

export function useTheme() {
  const [theme, setTheme] = useState(() => storedTheme() || systemTheme())

  useEffect(() => { apply(theme) }, [theme])

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return undefined
    const onChange = () => { if (!storedTheme()) setTheme(systemTheme()) }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem(THEME_KEY, next) } catch {}
    setTheme(next)
  }

  return { theme, toggle }
}
