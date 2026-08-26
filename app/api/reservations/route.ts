import { NextResponse } from 'next/server'
import { getSupabase, toRow, fromRow } from '@/lib/supabase'
import { isAdminAuthenticated } from '@/lib/auth'
import { randomUUID } from 'crypto'
import type {
  Reservation, FormulaType, PackType,
  StatutPro, ExperienceType, SpecialiteType,
} from '@/lib/types'

const RATE_MAP = new Map<string, { count: number; reset: number }>()
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_RE  = /^\d{4}-\d{2}-\d{2}$/

const VALID_TYPE_DURATION = ['court', 'long'] as const
const VALID_FORMULES: FormulaType[]    = ['horaire','demi-journee','journee','semaine','mois']
const VALID_PACKS: PackType[]          = ['aucun','essentiel','premium']
const VALID_STATUT: StatutPro[]        = ['auto-entrepreneur','societe','en-cours']
const VALID_EXP: ExperienceType[]      = ['0-3','3-5','5-10','10+']
const VALID_SPEC: SpecialiteType[]     = ['mixte','barber','afro','coloriste','design']

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = RATE_MAP.get(ip)
  if (!entry || now > entry.reset) {
    RATE_MAP.set(ip, { count: 1, reset: now + 60_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const {
    nom, email, telephone, typeDuration, formule, pack,
    dateDebut, dateFin, heureDebut, heureFin,
    statutPro, experience, specialites, totalHT, tva, totalTTC, acompte, notes,
  } = body

  if (
    typeof nom !== 'string'          || nom.trim().length < 2    || nom.trim().length > 100 ||
    typeof email !== 'string'        || !EMAIL_RE.test(email) ||
    typeof telephone !== 'string'    || telephone.trim().length < 8 || telephone.trim().length > 20 ||
    !VALID_TYPE_DURATION.includes(typeDuration as typeof VALID_TYPE_DURATION[number]) ||
    !VALID_FORMULES.includes(formule as FormulaType) ||
    !VALID_PACKS.includes(pack as PackType) ||
    typeof dateDebut !== 'string'    || !DATE_RE.test(dateDebut) ||
    !VALID_STATUT.includes(statutPro as StatutPro) ||
    !VALID_EXP.includes(experience as ExperienceType) ||
    !Array.isArray(specialites)      || specialites.length === 0 ||
    !(specialites as unknown[]).every(s => VALID_SPEC.includes(s as SpecialiteType)) ||
    typeof totalHT  !== 'number'     || totalHT  < 0 || totalHT  > 100_000 ||
    typeof tva      !== 'number'     || tva      < 0 || tva      > 100_000 ||
    typeof totalTTC !== 'number'     || totalTTC < 0 || totalTTC > 100_000 ||
    typeof acompte  !== 'number'     || acompte  < 0 || acompte  > 100_000
  ) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 422 })
  }

  const reservation: Reservation = {
    id:           randomUUID(),
    createdAt:    new Date().toISOString(),
    nom:          (nom as string).trim(),
    email:        (email as string).trim().toLowerCase(),
    telephone:    (telephone as string).trim(),
    typeDuration: typeDuration as 'court' | 'long',
    formule:      formule as FormulaType,
    pack:         pack as PackType,
    dateDebut:    dateDebut as string,
    dateFin:      typeof dateFin   === 'string' ? dateFin   : undefined,
    heureDebut:   typeof heureDebut === 'string' ? heureDebut : undefined,
    heureFin:     typeof heureFin   === 'string' ? heureFin   : undefined,
    statutPro:    statutPro as StatutPro,
    experience:   experience as ExperienceType,
    specialites:  specialites as SpecialiteType[],
    totalHT:      totalHT as number,
    tva:          tva as number,
    totalTTC:     totalTTC as number,
    acompte:      acompte as number,
    status:       'pending',
    notes:        typeof notes === 'string' && notes.length <= 1000 ? (notes as string).trim() : undefined,
  }

  const { error } = await getSupabase().from('reservations').insert([toRow(reservation)])
  if (error) {
    console.error('Supabase insert error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function GET() {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { data, error } = await getSupabase()
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Supabase select error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
  return NextResponse.json(data.map(fromRow))
}
