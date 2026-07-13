export const TOURNAMENT_UI_KEY = 'tchouk_tournament_ui'

export function loadTournamentUi() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TOURNAMENT_UI_KEY) || '{}')
    return {
      view: parsed.view === 'setup' || parsed.view === 'detail' || parsed.view === 'list' ? parsed.view : 'list',
      activeId: typeof parsed.activeId === 'string' ? parsed.activeId : null,
    }
  } catch {
    return { view: 'list', activeId: null }
  }
}
