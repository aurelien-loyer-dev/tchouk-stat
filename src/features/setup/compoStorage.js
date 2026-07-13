const COMPOS_KEY = 'tchouk_compos'

export function loadComposFromStorage() {
  try { return JSON.parse(localStorage.getItem(COMPOS_KEY) || '[]') }
  catch { return [] }
}

export function saveComposToStorage(list) {
  try { localStorage.setItem(COMPOS_KEY, JSON.stringify(list.slice(0, 30))) }
  catch {}
}
