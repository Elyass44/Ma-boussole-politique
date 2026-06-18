import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import { mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'

const PORT = process.env.PORT || 3001
const DB_PATH = process.env.DB_PATH || './poliquiz.db'
const CIVIX = 'https://www.civix.fr/api/v1'

// S'assurer que le dossier de la DB existe
const dir = dirname(DB_PATH)
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    fetched_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS votes (
    uid TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS summaries (
    uid TEXT PRIMARY KEY,
    text TEXT NOT NULL
  );
`)

const app = express()
app.use(cors())
app.use(express.json())

// --- helpers CIVIX ---

async function civixGet(path) {
  const res = await fetch(`${CIVIX}${path}`)
  if (!res.ok) throw new Error(`CIVIX ${res.status}: ${path}`)
  return res.json()
}

async function getScrutins() {
  const row = db.prepare('SELECT data FROM cache WHERE key = ?').get('scrutins')
  if (row) return JSON.parse(row.data)

  console.log('Chargement de tous les scrutins (17e législature)…')
  const first = await civixGet('/scrutins?page_size=50&page=1&legislature=17')
  const total = first.data.attributes.pagination.count_total
  const pageCount = Math.ceil(total / 50)
  console.log(`${total} scrutins trouvés, ${pageCount} pages à charger`)

  const allResults = [...first.data.attributes.results]
  const BATCH = 20
  for (let p = 2; p <= pageCount; p += BATCH) {
    const batch = await Promise.all(
      Array.from({ length: Math.min(BATCH, pageCount - p + 1) }, (_, i) =>
        civixGet(`/scrutins?page_size=50&page=${p + i}&legislature=17`)
          .then(j => j.data.attributes.results)
          .catch(() => [])
      )
    )
    allResults.push(...batch.flat())
    console.log(`Scrutins chargés : ${allResults.length}/${total}`)
  }

  db.prepare('INSERT OR REPLACE INTO cache VALUES (?, ?, ?)').run('scrutins', JSON.stringify(allResults), Date.now())
  console.log(`Cache scrutins mis à jour (${allResults.length} scrutins)`)
  return allResults
}

async function getGroupes() {
  const row = db.prepare('SELECT data FROM cache WHERE key = ?').get('groupes')
  if (row) return JSON.parse(row.data)

  const json = await civixGet('/groupes')
  const data = json.data.attributes.groups
  db.prepare('INSERT OR REPLACE INTO cache VALUES (?, ?, ?)').run('groupes', JSON.stringify(data), Date.now())
  return data
}


async function getVotes(uid) {
  const row = db.prepare('SELECT data FROM votes WHERE uid = ?').get(uid)
  if (row) return JSON.parse(row.data)

  const json = await civixGet(`/scrutins/${uid}/votes`)
  const { results_by_group, results_global } = json.data.attributes
  const data = { results_by_group, results_global }
  db.prepare('INSERT OR REPLACE INTO votes VALUES (?, ?)').run(uid, JSON.stringify(data))
  return data
}

// --- routes ---

// Endpoint principal : retourne une partie prête à jouer
app.get('/api/game', async (req, res) => {
  try {
    const count = Math.min(Math.max(parseInt(req.query.count) || 15, 1), 50)

    const [allScrutins, groupes] = await Promise.all([getScrutins(), getGroupes()])

    // Shuffle d'abord pour distribution aléatoire sur toute la législature
    const shuffled = [...allScrutins].sort(() => Math.random() - 0.5)

    // Fetch votes par batch de 50, stop dès qu'on a assez de scrutins valides
    const valid = []
    const BATCH = 50
    const TARGET = count * 5

    for (let i = 0; i < shuffled.length && valid.length < TARGET; i += BATCH) {
      const batch = shuffled.slice(i, i + BATCH)
      const votesArr = await Promise.all(batch.map(s => getVotes(s.uid).catch(() => null)))
      for (let j = 0; j < batch.length; j++) {
        const votes = votesArr[j]
        if (!votes) continue
        const active = votes.results_by_group.filter(g => g.pour + g.contre + g.abstention > 0)
        if (active.length < 6) continue
        if (votes.results_global.total <= 50) continue
        valid.push({ ...batch[j], votes: votes.results_by_group })
      }
    }

    // Déduplication par dossier + sélection
    const maxPerDossier = Math.ceil(count / 10)
    const seen = new Map()
    const deduped = valid.filter(s => {
      const ref = s.objet?.dossierLegislatif?.dossierRef
      if (!ref) return true
      const n = seen.get(ref) ?? 0
      if (n >= maxPerDossier) return false
      seen.set(ref, n + 1)
      return true
    })
    const scrutins = deduped.slice(0, count)

    if (scrutins.length < count) {
      return res.status(400).json({
        error: `Pas assez de scrutins valides (${scrutins.length}/${count}). Réessayez.`
      })
    }

    res.json({ scrutins, groupes })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

// Résumés IA — lecture
app.get('/api/summaries/:uid', (req, res) => {
  const row = db.prepare('SELECT text FROM summaries WHERE uid = ?').get(req.params.uid)
  row ? res.json({ text: row.text }) : res.status(404).end()
})

// Résumés IA — écriture (interne, conservé pour compatibilité)
app.post('/api/summaries/:uid', (req, res) => {
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'missing text' })
  db.prepare('INSERT OR REPLACE INTO summaries VALUES (?, ?)').run(req.params.uid, text)
  res.json({ ok: true })
})

function decodeHtml(html) {
  return html
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

async function fetchAmendementTexte(dossierRef, amendNum) {
  try {
    const dossierRes = await fetch(`https://www.assemblee-nationale.fr/dyn/17/dossiers/${dossierRef}`)
    if (!dossierRes.ok) return null
    const html = await dossierRes.text()

    const examens = [...html.matchAll(/examen=(EXANR[A-Z0-9]+)/g)].map(m => m[1])
    const textNums = [...new Set(
      examens.map(e => { const m = e.match(/(\d+)P0D/); return m ? m[1] : null }).filter(Boolean)
    )].sort((a, b) => Number(b) - Number(a))

    for (const textNum of textNums) {
      const res = await fetch(`https://www.assemblee-nationale.fr/dyn/17/amendements/${textNum}/AN/${amendNum}`)
      if (!res.ok) continue
      const ahtml = await res.text()
      const sections = [...ahtml.matchAll(/<div class="amendement-section-body">([\s\S]*?)<\/div>/g)]
        .map(m => decodeHtml(m[1])).filter(s => s.length > 30)
      if (sections.length >= 2) {
        return { dispositif: sections[1].slice(0, 800), expose: (sections[2] ?? '').slice(0, 800) }
      }
    }
    return null
  } catch {
    return null
  }
}

// Résumés IA — génération via Mistral (clé côté serveur)
app.post('/api/summaries/:uid/generate', async (req, res) => {
  const { uid } = req.params
  const { titre, dossierLibelle, dossierRef, type } = req.body

  const cached = db.prepare('SELECT text FROM summaries WHERE uid = ?').get(uid)
  if (cached) {
    try {
      const match = cached.text.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(match ? match[0] : cached.text)
      return res.json({ proposition: parsed.proposition ?? null, resume: parsed.resume ?? cached.text })
    } catch {
      return res.json({ proposition: null, resume: cached.text })
    }
  }

  const KEY = process.env.MISTRAL_KEY
  if (!KEY) return res.status(503).json({ error: 'no_key' })
  if (!titre) return res.status(400).json({ error: 'missing titre' })

  const amendMatch = titre.match(/n°\s*(\d+)/i)
  const amendNum = amendMatch?.[1] ?? null
  const amendContent = (amendNum && dossierRef) ? await fetchAmendementTexte(dossierRef, amendNum) : null

  const lines = [`Intitulé du vote : "${titre}"`]
  if (dossierLibelle) lines.push(`Dossier législatif : "${dossierLibelle}"`)
  if (type) lines.push(`Type : ${type}`)
  if (amendContent) {
    lines.push(`\nDispositif : ${amendContent.dispositif}`)
    if (amendContent.expose) lines.push(`Exposé des motifs : ${amendContent.expose}`)
  }

  const instruction = amendContent
    ? `En te basant sur le contenu fourni, génère :
- "proposition" : une phrase courte et directe (max 12 mots, infinitif ou nom) résumant la mesure soumise au vote, formulée de façon à ce qu'on puisse être Pour ou Contre
- "resume" : 2-3 phrases expliquant concrètement ce que ça changerait pour les citoyens`
    : `Génère :
- "proposition" : une phrase courte et directe (max 12 mots, infinitif ou nom) résumant la mesure soumise au vote, formulée de façon à ce qu'on puisse être Pour ou Contre. Si tu manques de détails, base-toi sur l'enjeu général du dossier.
- "resume" : 2-3 phrases expliquant concrètement ce que ça changerait pour les citoyens`

  const prompt = `Tu es un assistant qui reformule les votes parlementaires pour le grand public français.

${lines.join('\n')}

${instruction}

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown :
{"proposition":"...","resume":"..."}

Ne mentionne jamais le résultat du vote (adopté/rejeté). Aucun jugement politique.`

  try {
    const mistral = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.3,
      }),
    })
    if (!mistral.ok) return res.status(502).json({ error: 'mistral_error' })
    const data = await mistral.json()
    const raw = data.choices?.[0]?.message?.content?.trim() ?? null
    if (!raw) return res.status(502).json({ error: 'empty_response' })

    let proposition = null, resume = raw
    try {
      const match = raw.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(match ? match[0] : raw)
      proposition = parsed.proposition ?? null
      resume = parsed.resume ?? raw
    } catch {}

    const stored = JSON.stringify({ proposition, resume })
    db.prepare('INSERT OR REPLACE INTO summaries VALUES (?, ?)').run(uid, stored)
    res.json({ proposition, resume })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

app.listen(PORT, '0.0.0.0', () => console.log(`Backend :${PORT}`))
