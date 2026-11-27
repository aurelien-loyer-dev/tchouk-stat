// Dernier état du chrono du match en cours, publié par useMatchClock et lu
// par la diffusion en direct (qui ne vit pas dans le même composant).
let last = null
const listeners = new Set()

export function publishClock(state) {
  last = state
  listeners.forEach(l => l(state))
}

export function subscribeClock(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const lastClock = () => last
