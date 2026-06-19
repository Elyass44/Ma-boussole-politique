export async function getSummary(scrutin) {
  try {
    const res = await fetch(`/api/summaries/${scrutin.uid}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titre: scrutin.titre,
        dossierLibelle: scrutin.objet?.dossierLegislatif?.libelle ?? null,
        dossierRef: scrutin.objet?.dossierLegislatif?.dossierRef ?? null,
        type: scrutin.type ?? null,
      }),
    })
    if (!res.ok) return null
    const { proposition } = await res.json()
    return proposition ? { proposition } : null
  } catch {
    return null
  }
}

export async function getInsights(scrutin) {
  const dossierRef = scrutin.objet?.dossierLegislatif?.dossierRef ?? null
  try {
    const res = await fetch(`/api/insights/${scrutin.uid}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titre: scrutin.titre,
        dossierLibelle: scrutin.objet?.dossierLegislatif?.libelle ?? null,
        canonical_url: scrutin.canonical_url ?? null,
        assemblee_url: dossierRef
          ? `https://www.assemblee-nationale.fr/dyn/17/dossiers/${dossierRef}`
          : null,
      }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
