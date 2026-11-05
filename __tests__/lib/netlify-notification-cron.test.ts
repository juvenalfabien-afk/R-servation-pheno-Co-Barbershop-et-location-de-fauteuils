import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('../../netlify/functions/notifications-cron.mjs', import.meta.url),
  'utf8',
)

describe('Netlify notification schedule', () => {
  it('utilise un cron court, authentifié et inférieur à la limite Netlify', () => {
    expect(source).toContain("schedule: '*/5 * * * *'")
    expect(source).toContain('SCHEDULED_FUNCTION_TIMEOUT_MS = 25_000')
    expect(source).toContain('authorization: `Bearer ${cronSecret}`')
    expect(source).not.toMatch(/example\.com|localhost|[A-Za-z0-9_-]{32,}/)
  })
})
