/**
 * Import clients depuis un CSV dans Supabase
 *
 * Usage :
 *   npx tsx scripts/import-clients.ts chemin/vers/clients.csv
 *
 * Format CSV attendu (première ligne = en-têtes) :
 *   nom,email,telephone
 *   ou : prenom,nom,email,tel
 *   ou : first_name,last_name,email,phone
 *
 * Les colonnes sont détectées automatiquement par nom (insensible à la casse).
 */

import fs from 'fs'
import readline from 'readline'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const SUPABASE_URL  = process.env.SUPABASE_URL
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY)

const FILE = process.argv[2]
if (!FILE) {
  console.error('❌  Usage : npx tsx scripts/import-clients.ts <fichier.csv>')
  process.exit(1)
}

function normalize(headers: string[]): (row: string[]) => { nom: string; email: string; telephone: string } {
  const h = headers.map(h => h.toLowerCase().trim().replace(/[^a-z_]/g, ''))
  const idx = (names: string[]) => names.reduce((acc, n) => acc >= 0 ? acc : h.indexOf(n), -1)

  const nomIdx    = idx(['nom', 'name', 'last_name', 'lastname'])
  const prenomIdx = idx(['prenom', 'firstname', 'first_name', 'prénom'])
  const emailIdx  = idx(['email', 'mail', 'courriel'])
  const telIdx    = idx(['telephone', 'tel', 'phone', 'mobile', 'gsm', 'portable'])

  return (row) => {
    const nom = [
      prenomIdx >= 0 ? row[prenomIdx]?.trim() : '',
      nomIdx    >= 0 ? row[nomIdx]?.trim()    : '',
    ].filter(Boolean).join(' ') || row[0]?.trim() || 'Inconnu'
    return {
      nom,
      email:     emailIdx >= 0 ? (row[emailIdx]?.trim() ?? '') : '',
      telephone: telIdx   >= 0 ? (row[telIdx]?.trim()   ?? '') : '',
    }
  }
}

async function run() {
  const rl = readline.createInterface({ input: fs.createReadStream(FILE), crlfDelay: Infinity })

  let headers: string[] = []
  let mapper: ReturnType<typeof normalize> | null = null
  let inserted = 0, skipped = 0, errors = 0

  for await (const line of rl) {
    if (!line.trim()) continue
    const row = line.split(/[,;]/).map(c => c.replace(/^"|"$/g, '').trim())

    if (!mapper) {
      headers = row
      mapper = normalize(headers)
      console.log(`📋 En-têtes détectés : ${headers.join(', ')}`)
      continue
    }

    const { nom, email, telephone } = mapper(row)
    if (!email && !telephone) { skipped++; continue }

    const { error } = await sb.from('clients').upsert([{
      id: randomUUID(),
      nom,
      email: email || null,
      telephone: telephone || null,
      rdv_count: 0,
      location_count: 0,
    }], { onConflict: 'email', ignoreDuplicates: false })

    if (error) {
      console.warn(`⚠️  Skipped (${nom}): ${error.message}`)
      errors++
    } else {
      inserted++
      if (inserted % 50 === 0) console.log(`   … ${inserted} clients importés`)
    }
  }

  console.log(`\n✅  Import terminé : ${inserted} insérés / ${skipped} ignorés (sans contact) / ${errors} erreurs`)
}

run().catch(err => { console.error('❌  Erreur fatale :', err); process.exit(1) })
