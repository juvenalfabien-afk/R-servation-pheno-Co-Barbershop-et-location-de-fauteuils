import { describe, expect, it, vi } from 'vitest'
import {
  CONTACT_RETENTION_MS,
  SAVED_CONTACT_KEY,
  readRememberedContact,
  saveRememberedContact,
} from '@/lib/rdv-contact-storage'

function memoryStorage(initial?: string) {
  let value = initial ?? null
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, next: string) => { value = next }),
    removeItem: vi.fn(() => { value = null }),
    value: () => value,
  }
}

describe('remembered RDV contact privacy', () => {
  const contact = { nom: 'Client Test', tel: '+999000000001', email: 'client@example.test' }

  it('conserve uniquement un consentement explicite pendant 30 jours', () => {
    const storage = memoryStorage()
    saveRememberedContact(storage, contact, 1_000)
    const stored = JSON.parse(storage.value()!)
    expect(stored).toMatchObject({ consentVersion: 2, remembered: true, consentedAt: 1_000, data: contact })
    expect(stored.expiresAt).toBe(1_000 + CONTACT_RETENTION_MS)
    expect(readRememberedContact(storage, 2_000)).toEqual(contact)
  })

  it('supprime les anciennes données sans preuve de consentement', () => {
    const storage = memoryStorage(JSON.stringify({
      expiresAt: Date.now() + 180 * 24 * 60 * 60 * 1000,
      data: contact,
    }))
    expect(readRememberedContact(storage)).toBeNull()
    expect(storage.removeItem).toHaveBeenCalledWith(SAVED_CONTACT_KEY)
  })

  it('supprime les données expirées ou corrompues', () => {
    const expired = memoryStorage()
    saveRememberedContact(expired, contact, 1_000)
    expect(readRememberedContact(expired, 1_000 + CONTACT_RETENTION_MS + 1)).toBeNull()

    const corrupt = memoryStorage('{invalid')
    expect(readRememberedContact(corrupt)).toBeNull()
    expect(corrupt.removeItem).toHaveBeenCalled()
  })
})
