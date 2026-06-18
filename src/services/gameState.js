const KEY = 'poliquiz_game'

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, savedAt: Date.now() }))
  } catch {
    // localStorage plein ou désactivé — silent fail
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (!s.scrutins?.length || !s.groupes?.length || s.currentIndex >= s.scrutins.length) return null
    return s
  } catch {
    return null
  }
}

export function clear() {
  try { localStorage.removeItem(KEY) } catch {}
}
