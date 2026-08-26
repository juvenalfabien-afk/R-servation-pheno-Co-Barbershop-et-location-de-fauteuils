import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { isAdminAuthenticated } from '@/lib/auth'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { date } = await params
  const { error } = await getSupabase()
    .from('schedule_closures')
    .delete()
    .eq('date', date)
  if (error) return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
