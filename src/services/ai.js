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
    const { proposition, resume } = await res.json()
    if (!proposition && !resume) return null
    return { proposition: proposition ?? null, resume: resume ?? null }
  } catch {
    return null
  }
}
