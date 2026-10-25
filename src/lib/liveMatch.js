// Sauvegarde automatique du match en cours : un rechargement de page (ou un
// onglet fermé par erreur) ne doit jamais faire perdre le match. Tout vit en
// localStorage ; les logos sont stockés à part car ils peuvent être lourds.
const LIVE_KEY   = 'tchouk_live_match'
const LOGOS_KEY  = 'tchouk_live_logos'
const CLOCK_KEY  = 'tchouk_live_clock'
const SCORER_KEY = 'tchouk_live_scorer'

export const LIVE_SCREENS = ['match', 'scorer', 'playermatch', 'results', 'playerresults']

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') }
  catch { return null }
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true }
  catch { return false }
}

export function loadLive() {
  const live = read(LIVE_KEY)
  if (!live || !LIVE_SCREENS.includes(live.screen) || !Array.isArray(live.teams)) return null
  return { ...live, logos: read(LOGOS_KEY) || [null, null] }
}

export function saveLive(state) {
  write(LIVE_KEY, state)
}

export function saveLiveLogos(logos) {
  // Un logo trop lourd peut dépasser le quota : le match reste sauvegardé sans lui.
  if (!write(LOGOS_KEY, logos)) write(LOGOS_KEY, [null, null])
}

export function clearLive() {
  try {
    [LIVE_KEY, LOGOS_KEY, CLOCK_KEY, SCORER_KEY].forEach(k => localStorage.removeItem(k))
  } catch {}
}

// ── Chrono ────────────────────────────────────────────────────────────────
// On garde le temps écoulé et l'heure de sauvegarde : au rechargement, un
// chrono qui tournait rattrape le temps passé page fermée.
export function loadClock() {
  return read(CLOCK_KEY)
}

export function saveClock(elapsedSec, running) {
  write(CLOCK_KEY, { elapsedSec, running, savedAt: Date.now() })
}

// ── État propre au scoreur (scores par mi-temps, écran de fin) ────────────
export function loadScorerState() {
  return read(SCORER_KEY)
}

export function saveScorerState(state) {
  write(SCORER_KEY, state)
}
