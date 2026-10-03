import { NextResponse } from 'next/server'
import { sendContactEmail } from '@/lib/email'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RATE_MAP = new Map<string, { count: number; reset: number }>()

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = RATE_MAP.get(ip)
  if (!entry || now > entry.reset) {
    RATE_MAP.set(ip, { count: 1, reset: now + 60_000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

export async function POST(req: Request) {
  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10)
  if (contentLength > 8_192) {
    return NextResponse.json({ error: 'Requête trop grande' }, { status: 413 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const { nom, email, telephone, message } = body

  if (
    typeof nom !== 'string'     || nom.trim().length < 2    || nom.trim().length > 100 ||
    typeof email !== 'string'   || !EMAIL_RE.test(email) ||
    typeof message !== 'string' || message.trim().length < 5 || message.trim().length > 2000
  ) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 422 })
  }

  const sent = await sendContactEmail({
    nom: nom.trim(),
    email: email.trim().toLowerCase(),
    telephone: typeof telephone === 'string' ? telephone.trim() : undefined,
    message: message.trim(),
  })

  return NextResponse.json({ ok: true, emailSent: sent }, { status: 201 })
}
