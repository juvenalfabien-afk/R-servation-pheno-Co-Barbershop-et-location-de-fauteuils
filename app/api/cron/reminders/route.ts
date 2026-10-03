import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { sendRdvReminder, sendRelance } from '@/lib/email'
import { sendRdvReminderSms } from '@/lib/sms'
import { getInactiveClients } from '@/lib/clients'

// Appelé chaque jour à 18h via un cron externe (cron-job.org, Netlify, etc.)
// URL : POST /api/cron/reminders?secret=VOTRE_CRON_SECRET

export async function POST(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const sb = getSupabase()

  // ── 1. Rappels RDV J-1 ──────────────────────────────────────
  const { data: rdvs, error: rdvErr } = await sb
    .from('rdv_bookings')
    .select('*')
    .eq('date', tomorrowStr)
    .neq('status', 'cancelled')

  let remindersSent = 0
  if (!rdvErr && rdvs) {
    for (const r of rdvs) {
      const data = {
        nom:           r.nom as string,
        email:         r.email as string,
        telephone:     r.telephone as string,
        date:          r.date as string,
        slot:          r.slot as string,
        prestationLabel: r.prestation_label as string,
        degradeLabel:  r.degrade_label as string | undefined,
        optionsLabels: (r.options_labels ?? []) as string[],
        totalPrice:    Number(r.total_price),
        totalDuration: Number(r.total_duration),
        categorie:     r.categorie as string,
      }
      await sendRdvReminder(data)
      await sendRdvReminderSms(data)
      remindersSent++
    }
  }

  // ── 2. Relances clients inactifs (30 jours) ─────────────────
  let relancesSent = 0
  const today = new Date().getDay()
  // Envoie les relances seulement le mardi (jour 2) pour ne pas spammer
  if (today === 2) {
    const inactive = await getInactiveClients(30)
    for (const client of inactive) {
      if (!client.email) continue
      await sendRelance({ nom: client.nom, email: client.email, lastRdvAt: client.lastRdvAt ?? undefined })
      relancesSent++
    }
  }

  return NextResponse.json({
    ok: true,
    date: tomorrowStr,
    remindersSent,
    relancesSent,
  })
}

