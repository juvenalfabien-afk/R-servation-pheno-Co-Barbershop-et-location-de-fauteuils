import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { setAdminCookie } from '@/lib/auth'

// 5 tentatives max par IP sur 15 minutes
const ATTEMPTS = new Map<string, { count: number; reset: number }>()

function checkBrute(ip: string): boolean {
  const now = Date.now()
  const entry = ATTEMPTS.get(ip)
  if (!entry || now > entry.reset) {
    ATTEMPTS.set(ip, { count: 1, reset: now + 15 * 60_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

function hashPassword(pwd: string): Buffer {
  return createHmac('sha256', process.env.ADMIN_SECRET!)
    .update(pwd)
    .digest()
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkBrute(ip)) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }, { status: 429 })
  }

  const { password = '' } = await req.json()
  const inputHash    = hashPassword(String(password))
  const expectedHash = hashPassword(process.env.ADMIN_PASSWORD ?? '')
  if (!timingSafeEqual(inputHash, expectedHash)) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }

  // Reset le compteur sur succès
  ATTEMPTS.delete(ip)
  await setAdminCookie()
  return NextResponse.json({ ok: true })
}
