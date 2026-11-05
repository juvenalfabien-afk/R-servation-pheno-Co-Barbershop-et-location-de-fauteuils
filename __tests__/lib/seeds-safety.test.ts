import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const seed = readFileSync(new URL('../../supabase/seeds.sql', import.meta.url), 'utf8').replace(/\r\n?/g, '\n')
const outbox = readFileSync(new URL('../../supabase/migrations/006_notification_outbox.sql', import.meta.url), 'utf8').replace(/\r\n?/g, '\n')

describe('Supabase seed safety', () => {
  it('refuse toute cible non explicitement isolée avant la première insertion', () => {
    const guard = seed.indexOf("current_setting('pheno.environment', true)")
    const firstInsert = seed.indexOf('insert into')
    expect(guard).toBeGreaterThanOrEqual(0)
    expect(guard).toBeLessThan(firstInsert)
    expect(seed).toContain("not in ('development', 'staging', 'test')")
  })

  it('emploie uniquement des contacts manifestement fictifs', () => {
    const emails = [...seed.matchAll(/'[A-Z0-9._%+-]+@([A-Z0-9.-]+)'/gi)].map(match => match[1])
    const phones = [...seed.matchAll(/'\+(\d+)'/g)].map(match => match[1])
    expect(emails.length).toBeGreaterThan(0)
    expect(emails.every(domain => domain === 'example.test')).toBe(true)
    expect(phones.length).toBeGreaterThan(0)
    expect(phones.every(phone => phone.startsWith('999'))).toBe(true)
    expect(seed).not.toMatch(/\+33|@gmail\.|@hotmail\.|@outlook\./i)
  })

  it('est transactionnel, réexécutable et ne crée pas de notifications', () => {
    expect(seed).toMatch(/^begin;/m)
    expect(seed).toMatch(/^commit;/m)
    expect(seed).toContain('on conflict (id) do nothing')
    expect(seed).toContain('on conflict (email) do nothing')
    expect(seed).toContain("set local pheno.seed_mode = 'on'")
    expect(outbox.match(/current_setting\('pheno\.seed_mode', true\) = 'on'/g)).toHaveLength(2)
  })
})
