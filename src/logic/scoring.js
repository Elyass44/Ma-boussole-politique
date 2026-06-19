const AXIS_VALUES = {
  'LFI-NFP': 1,
  'ECOS': 2,
  'SOC': 3,
  'GDR': 3,
  'LIOT': 5,
  'DEM': 6,
  'HOR': 6,
  'EPR': 7,
  'UDDPLR': 8,
  'DR': 8,
  'RN': 9,
  // NI (Non inscrits) intentionally excluded from axis
}

export function groupMajorityPosition(groupVotes) {
  const { pour, contre, abstention } = groupVotes
  const max = Math.max(pour, contre, abstention)
  if (max === 0) return null
  if (abstention === max) return 'abstention'
  return pour >= contre ? 'pour' : 'contre'
}

export function computeScores(scrutins, reponses, groupes) {
  const scored = groupes.map(groupe => {
    let matches = 0
    let counted = 0

    scrutins.forEach((scrutin, i) => {
      const reponse = reponses[i]
      if (reponse === 'je_ne_sais_pas') return

      const groupVotes = scrutin.votes.find(v => v.groupe_uid === groupe.uid)
      if (!groupVotes) return

      const position = groupMajorityPosition(groupVotes)
      if (!position || position === 'abstention') return

      counted++
      if (position === reponse) matches++
    })

    const score = counted > 0 ? matches / counted : 0
    return { ...groupe, score, matches, counted }
  })

  return scored.sort((a, b) => b.score - a.score || a.libelle.localeCompare(b.libelle))
}

export function computeAxis(scores) {
  let weightedSum = 0
  let totalWeight = 0

  scores.forEach(({ abbr, score }) => {
    const axisValue = AXIS_VALUES[abbr]
    if (axisValue === undefined) return
    // Poids = concordance au-dessus du hasard (vote binaire → baseline 50%)
    // Les groupes sous 50% n'influencent pas la position
    const w = Math.max(0, score - 0.5)
    if (w === 0) return
    weightedSum += axisValue * w
    totalWeight += w
  })

  return totalWeight > 0 ? weightedSum / totalWeight : 5
}
