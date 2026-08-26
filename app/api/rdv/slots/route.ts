import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')

  if (!date || !DATE_RE.test(date)) {
    return NextResponse.json({ bookings: [] })
  }

  const { data, error } = await getSupabase()
    .from('rdv_bookings')
    .select('slot, total_duration')
    .eq('date', date)
    .neq('status', 'cancelled')

  if (error) return NextResponse.json({ bookings: [] })

  return NextResponse.json({
    bookings: (data ?? []).map(r => ({
      slot:     r.slot as string,
      duration: Number(r.total_duration),
    })),
  })
}
