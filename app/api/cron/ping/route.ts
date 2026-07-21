import { NextResponse } from 'next/server'

// Vercel Cron : ping quotidien pour garder Supabase actif (voir vercel.json)
// Vercel envoie automatiquement : Authorization: Bearer <CRON_SECRET>
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return NextResponse.json({ ok: false, error: 'Variables SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquantes' }, { status: 500 })
  }

  try {
    const res = await fetch(`${url}/rest/v1/reservations?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[cron/ping] Supabase error:', res.status, body)
      return NextResponse.json({ ok: false, error: body }, { status: 500 })
    }

    console.log('[cron/ping] Supabase pingé à', new Date().toISOString())
    return NextResponse.json({ ok: true, pingedAt: new Date().toISOString() })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[cron/ping] Erreur réseau:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
