import { NextResponse } from 'next/server'
import { lookupClient } from '@/lib/clients'

const RATE_MAP = new Map<string, { count: number; reset: number }>()

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = RATE_MAP.get(ip)
  if (!entry || now > entry.reset) {
    RATE_MAP.set(ip, { count: 1, reset: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(ip)) {
    return NextResponse.json(null, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 3 || q.length > 120) {
    return NextResponse.json(null)
  }

  // Only accept email or phone format — blocks name/wildcard enumeration
  const isEmail = /^[^\s@]+@[^\s@]+$/.test(q)
  const isPhone = /^[0-9+\s()-]{7,}$/.test(q)
  if (!isEmail && !isPhone) {
    return NextResponse.json(null)
  }

  const client = await lookupClient(q)
  if (!client) return NextResponse.json(null)
  return NextResponse.json({
    nom:      client.nom,
    email:    client.email,
    telephone: client.telephone,
    rdvCount: client.rdvCount,
  })
}
