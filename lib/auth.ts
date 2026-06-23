import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'pheno_admin_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 jours

function computeToken(): string {
  return createHmac('sha256', process.env.ADMIN_SECRET!)
    .update(process.env.ADMIN_PASSWORD!)
    .digest('hex')
}

export async function setAdminCookie(): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, computeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return false
  const expected = computeToken()
  if (token.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}
