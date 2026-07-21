/**
 * keep-alive.mjs — Ping Supabase toutes les 3 jours pour éviter la mise en pause.
 * Usage local : npm run keep-alive  (dans un 2e terminal pendant npm run dev)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Lire .env.local manuellement
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('[keep-alive] .env.local introuvable')
    process.exit(1)
  }
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
  }
}

loadEnv()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const INTERVAL_MS  = 3 * 24 * 60 * 60 * 1000 // 3 jours

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[keep-alive] Variables SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquantes dans .env.local')
  process.exit(1)
}

async function ping() {
  const now = new Date().toLocaleString('fr-FR')
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reservations?select=id&limit=1`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    })
    if (res.ok) {
      console.log(`[keep-alive] ✅ ${now} — Supabase actif (HTTP ${res.status})`)
    } else {
      const body = await res.text()
      console.warn(`[keep-alive] ⚠️  ${now} — HTTP ${res.status}: ${body}`)
    }
  } catch (err) {
    console.error(`[keep-alive] ❌ ${now} — Erreur réseau:`, err.message)
  }
}

// Ping immédiat au démarrage, puis toutes les 3 jours
ping()
setInterval(ping, INTERVAL_MS)

console.log(`[keep-alive] Démarré — ping Supabase toutes les 3 jours.`)
console.log(`[keep-alive] Prochain ping dans 72h. Garde ce terminal ouvert.`)
