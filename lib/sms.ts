const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH  = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM  = process.env.TWILIO_FROM_NUMBER

function formatFR(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('33')) return `+${digits}`
  if (digits.startsWith('0') && digits.length === 10) return `+33${digits.slice(1)}`
  return `+${digits}`
}

async function sendSMS(to: string, body: string): Promise<void> {
  if (!TWILIO_SID || !TWILIO_AUTH || !TWILIO_FROM) {
    console.warn(`[sms] Twilio non configuré — SMS non envoyé à ${to}`)
    return
  }
  const toFormatted = formatFR(to)
  const credentials = Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH}`).toString('base64')
  const form = new URLSearchParams({ To: toFormatted, From: TWILIO_FROM, Body: body })
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    }
  )
  if (!res.ok) {
    const err = await res.text().catch(() => 'inconnu')
    throw new Error(`Twilio ${res.status}: ${err}`)
  }
}

// ── Messages ─────────────────────────────────────────────────

export async function sendRdvSmsClient(data: {
  nom: string; telephone: string; date: string; slot: string; prestationLabel: string
}): Promise<void> {
  const [y, m, d] = data.date.split('-')
  const dateStr = `${d}/${m}/${y}`
  const msg = `✂️ PHENO&CO — RDV confirmé !\n${data.prestationLabel}\n📅 ${dateStr} à ${data.slot}\n📍 18 rue d'Alger, Montpellier\n❌ Annulation : wa.me/33769432605`
  try {
    await sendSMS(data.telephone, msg)
  } catch (err) {
    console.error('[sms] sendRdvSmsClient failed:', err)
  }
}

export async function sendLocationSmsClient(data: {
  nom: string; telephone: string; dateDebut: string; formuleLabel: string
}): Promise<void> {
  const [y, m, d] = data.dateDebut.split('-')
  const dateStr = `${d}/${m}/${y}`
  const msg = `🪑 PHENO&CO — Demande de location reçue !\n${data.formuleLabel}\n📅 À partir du ${dateStr}\nNous vous contactons sous 48h.\n📞 wa.me/33769432605`
  try {
    await sendSMS(data.telephone, msg)
  } catch (err) {
    console.error('[sms] sendLocationSmsClient failed:', err)
  }
}

export async function sendRdvReminderSms(data: {
  nom: string; telephone: string; date: string; slot: string; prestationLabel: string
}): Promise<void> {
  const [y, m, d] = data.date.split('-')
  const dateStr = `${d}/${m}/${y}`
  const msg = `⏰ PHENO&CO — Rappel RDV demain !\n${data.prestationLabel}\n📅 ${dateStr} à ${data.slot}\n📍 18 rue d'Alger, Montpellier\nAnnuler : wa.me/33769432605`
  try {
    await sendSMS(data.telephone, msg)
  } catch (err) {
    console.error('[sms] sendRdvReminderSms failed:', err)
  }
}
