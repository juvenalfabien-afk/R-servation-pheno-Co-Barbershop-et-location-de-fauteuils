import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ process: vi.fn() }))
vi.mock('@/lib/notification-worker', () => ({ processNotificationJobs: mocks.process }))

import { GET, POST } from '@/app/api/cron/notifications/route'

describe('notification outbox cron', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = 'fictitious-cron-secret-at-least-24-characters'
    mocks.process.mockResolvedValue({ ok: true, claimed: 1, sent: 1, failed: 0, uncertain: 0 })
  })

  afterEach(() => { delete process.env.CRON_SECRET })

  it('refuse un appel non authentifié avant de traiter les jobs', async () => {
    const response = await POST(new Request('http://localhost/api/cron/notifications', { method: 'POST' }))
    expect(response.status).toBe(403)
    expect(mocks.process).not.toHaveBeenCalled()
  })

  it('traite un lot borné avec le secret attendu', async () => {
    const response = await POST(new Request('http://localhost/api/cron/notifications', {
      method: 'POST', headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    }))
    expect(response.status).toBe(200)
    expect(mocks.process).toHaveBeenCalledWith(25)
    expect(await response.json()).toMatchObject({ ok: true, sent: 1 })
  })

  it('signale une panne du worker et interdit GET', async () => {
    mocks.process.mockResolvedValueOnce({ ok: false, claimed: 0, sent: 0, failed: 1, uncertain: 0 })
    const response = await POST(new Request('http://localhost/api/cron/notifications', {
      method: 'POST', headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    }))
    expect(response.status).toBe(503)
    expect((await GET()).status).toBe(405)
  })
})
