import { createHash, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { processNotificationJobs } from '@/lib/notification-worker'

function authorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')
  const supplied = authorization?.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!expected || expected.length < 24) return false
  const expectedHash = createHash('sha256').update(expected).digest()
  const suppliedHash = createHash('sha256').update(supplied).digest()
  return timingSafeEqual(expectedHash, suppliedHash)
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const report = await processNotificationJobs(25)
  return NextResponse.json(report, { status: report.ok ? 200 : 503 })
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
