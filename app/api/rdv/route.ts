import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { toRdvRow, fromRdvRow } from '@/lib/rdv-supabase'
import { isAdminAuthenticated } from '@/lib/auth'
import type { RdvBooking } from '@/lib/rdv-types'
import { randomUUID } from 'crypto'

import { ALL_SLOTS } from '@/lib/schedule-types'

const VALID_CATS = ['homme', 'femme', 'enfant'] as const
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RATE_MAP = new Map<string, { count: number; reset: number }>()

function rateLimit(ip: string, max = 5, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = RATE_MAP.get(ip)
  if (!entry || now > entry.reset) {
    RATE_MAP.set(ip, { count: 1, reset: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

export async function POST(req: Request) {
  // Rate limiting : 5 réservations par IP par minute
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  let body: Partial<RdvBooking>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide' }, { status: 400 }) }

  // Validation des champs obligatoires
  const { nom, email, telephone, categorie, prestation, prestationLabel, date, slot, options = [], optionsLabels = [], totalPrice = 0, totalDuration = 0 } = body

  if (
    typeof nom !== 'string' || nom.trim().length < 2 || nom.trim().length > 100 ||
    typeof email !== 'string' || !EMAIL_RE.test(email) ||
    typeof telephone !== 'string' || telephone.trim().length < 8 || telephone.trim().length > 20 ||
    !VALID_CATS.includes(categorie as typeof VALID_CATS[number]) ||
    typeof prestation !== 'string' || prestation.length > 50 ||
    typeof prestationLabel !== 'string' || prestationLabel.length > 100 ||
    typeof date !== 'string' || !DATE_RE.test(date) ||
    !ALL_SLOTS.includes(slot as string) ||
    !Array.isArray(options) || !Array.isArray(optionsLabels) ||
    typeof totalPrice !== 'number' || totalPrice < 0 || totalPrice > 5000 ||
    typeof totalDuration !== 'number' || totalDuration < 0 || totalDuration > 480
  ) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 422 })
  }

  // Vérifie que la date n'est pas dans le passé
  if (new Date(date) < new Date(new Date().toISOString().slice(0, 10))) {
    return NextResponse.json({ error: 'Date passée' }, { status: 422 })
  }

  // ID généré côté serveur
  const booking: RdvBooking = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    nom: nom.trim(),
    email: email.trim().toLowerCase(),
    telephone: telephone.trim(),
    categorie: categorie as RdvBooking['categorie'],
    prestation,
    prestationLabel,
    degrade: typeof body.degrade === 'string' ? body.degrade : undefined,
    degradeLabel: typeof body.degradeLabel === 'string' ? body.degradeLabel : undefined,
    options: options.slice(0, 10).filter((o: unknown) => typeof o === 'string'),
    optionsLabels: optionsLabels.slice(0, 10).filter((o: unknown) => typeof o === 'string'),
    totalPrice,
    totalDuration,
    date,
    slot: slot!,
    status: 'pending',
  }

  const { error } = await getSupabase()
    .from('rdv_bookings')
    .insert([toRdvRow(booking)])

  if (error) {
    // Conflit de créneau (UNIQUE constraint)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ce créneau vient d\'être pris. Choisissez-en un autre.' }, { status: 409 })
    }
    console.error('Supabase rdv insert error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function GET() {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { data, error } = await getSupabase()
    .from('rdv_bookings')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Supabase rdv select error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
  return NextResponse.json(data.map(fromRdvRow))
}
