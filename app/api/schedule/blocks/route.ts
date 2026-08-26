import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { isAdminAuthenticated } from '@/lib/auth'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { date, slot, reason } = await req.json()
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !slot) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 422 })
  }
  const { error } = await getSupabase()
    .from('schedule_blocks')
    .upsert({ id: randomUUID(), date, slot, reason: reason ?? '' }, { onConflict: 'date,slot' })
  if (error) return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
