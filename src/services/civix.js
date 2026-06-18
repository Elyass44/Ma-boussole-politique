const sleep = ms => new Promise(r => setTimeout(r, ms))

export async function loadGame(count = 15, onProgress = () => {}) {
  onProgress('Connexion au serveur...')

  const res = await fetch(`/api/game?count=${count}`)

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Erreur serveur (${res.status})`)
  }

  const { scrutins, groupes } = await res.json()
  await sleep(300)

  onProgress(`${scrutins.length} scrutins sélectionnés`)
  await sleep(400)

  onProgress('Prêt !')
  await sleep(300)

  return { scrutins, groupes }
}
