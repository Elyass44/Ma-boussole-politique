export function pickRandom(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}

export function hasEnoughGroups(resultsByGroup, min = 6) {
  return resultsByGroup.filter(g => g.pour + g.contre + g.abstention > 0).length >= min
}

export function hasEnoughVoters(resultsGlobal, min = 50) {
  return resultsGlobal.total > min
}

// Keep at most `max` scrutins per legislative dossier.
// Call this after shuffling so representatives are picked randomly.
export function deduplicateByDossier(scrutins, max = 1) {
  const counts = new Map()
  return scrutins.filter(s => {
    const ref = s.objet?.dossierLegislatif?.dossierRef
    if (!ref) return true
    const n = counts.get(ref) ?? 0
    if (n >= max) return false
    counts.set(ref, n + 1)
    return true
  })
}
