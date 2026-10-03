import { NextResponse, type NextRequest } from 'next/server'

const COOKIE_NAME = 'pheno_admin_session'

async function computeExpectedToken(): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(process.env.ADMIN_SECRET!),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(process.env.ADMIN_PASSWORD!))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return false
  try {
    const expected = await computeExpectedToken()
    return timingSafeEqual(token, expected)
  } catch {
    return false
  }
}

function deny(): NextResponse {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl
  const method = req.method

  // Login : toujours public
  if (pathname === '/api/admin/login') return NextResponse.next()

  // Toutes les autres routes /api/admin/* nécessitent l'auth
  if (pathname.startsWith('/api/admin/')) {
    if (!await isAuthenticated(req)) return deny()
    return NextResponse.next()
  }

  // Schedule : GET public, mutations admin-only
  if (pathname === '/api/schedule' || pathname.startsWith('/api/schedule/')) {
    if (method !== 'GET') {
      if (!await isAuthenticated(req)) return deny()
    }
    return NextResponse.next()
  }

  // RDV : POST (création) et GET /slots publics, reste admin-only
  if (pathname === '/api/rdv' || pathname.startsWith('/api/rdv/')) {
    const isPublic =
      (pathname === '/api/rdv' && method === 'POST') ||
      pathname.startsWith('/api/rdv/slots')
    if (!isPublic && !await isAuthenticated(req)) return deny()
    return NextResponse.next()
  }

  // Reservations : POST (création) public, reste admin-only
  if (pathname === '/api/reservations' || pathname.startsWith('/api/reservations/')) {
    if (!(pathname === '/api/reservations' && method === 'POST')) {
      if (!await isAuthenticated(req)) return deny()
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    '/api/schedule',
    '/api/schedule/:path*',
    '/api/rdv',
    '/api/rdv/:path*',
    '/api/reservations',
    '/api/reservations/:path*',
  ],
}
