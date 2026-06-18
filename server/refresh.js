import Database from 'better-sqlite3'
import { mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'

const DB_PATH = process.env.DB_PATH || './poliquiz.db'
const CIVIX = 'https://www.civix.fr/api/v1'

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
`)

async function civixGet(path) {
  const res = await fetch(`${CIVIX}${path}`)
  if (!res.ok) throw new Error(`CIVIX ${res.status}: ${path}`)
  return res.json()
}

async function refreshScrutins() {
  const first = await civixGet('/scrutins?page_size=50&page=1&legislature=17')
  const total = first.data.attributes.pagination.count_total
  const pageCount = Math.ceil(total / 50)
  console.log(`${total} scrutins, ${pageCount} pages`)

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
    process.stdout.write(`\r${allResults.length}/${total}`)
  }
  console.log()

  db.prepare('INSERT OR REPLACE INTO cache VALUES (?, ?, ?)').run('scrutins', JSON.stringify(allResults), Date.now())
  console.log(`scrutins: OK (${allResults.length})`)
}

async function refreshGroupes() {
  const json = await civixGet('/groupes')
  const data = json.data.attributes.groups
  db.prepare('INSERT OR REPLACE INTO cache VALUES (?, ?, ?)').run('groupes', JSON.stringify(data), Date.now())
  console.log(`groupes: OK (${data.length})`)
}

console.log('Refresh cache poliquiz…')
db.prepare("DELETE FROM cache WHERE key IN ('scrutins', 'groupes')").run()

await refreshScrutins()
await refreshGroupes()

console.log('Done.')
