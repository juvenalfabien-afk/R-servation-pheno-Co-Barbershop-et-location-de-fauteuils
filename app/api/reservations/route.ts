import { NextResponse } from 'next/server'
import { supabase, toRow, fromRow } from '@/lib/supabase'
import { isAdminAuthenticated } from '@/lib/auth'
import type { Reservation } from '@/lib/types'

export async function POST(req: Request) {
  const reservation: Reservation = await req.json()
  const { error } = await supabase.from('reservations').insert([toRow(reservation)])
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
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Supabase select error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
  return NextResponse.json(data.map(fromRow))
}
