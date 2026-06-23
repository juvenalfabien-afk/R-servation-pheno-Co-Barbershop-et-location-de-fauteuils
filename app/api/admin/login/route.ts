import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { setAdminCookie } from '@/lib/auth'

function hashPassword(pwd: string): Buffer {
  return createHmac('sha256', process.env.ADMIN_SECRET!)
    .update(pwd)
    .digest()
}

export async function POST(req: Request) {
  const { password = '' } = await req.json()
  const inputHash    = hashPassword(String(password))
  const expectedHash = hashPassword(process.env.ADMIN_PASSWORD ?? '')
  if (!timingSafeEqual(inputHash, expectedHash)) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }
  await setAdminCookie()
  return NextResponse.json({ ok: true })
}
