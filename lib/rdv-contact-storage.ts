export const SAVED_CONTACT_KEY = 'pheno_rdv_contact_v1'
export const CONTACT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000

export type RememberedContact = {
  nom: string
  tel: string
  email: string
}

type ContactEnvelope = {
  consentVersion: 2
  remembered: true
  consentedAt: number
  expiresAt: number
  data: RememberedContact
}

function isContact(value: unknown): value is RememberedContact {
  if (!value || typeof value !== 'object') return false
  const contact = value as Partial<RememberedContact>
  return typeof contact.nom === 'string' && contact.nom.trim().length > 0
    && typeof contact.tel === 'string' && contact.tel.trim().length > 0
    && typeof contact.email === 'string' && contact.email.includes('@')
}

export function clearRememberedContact(storage: Pick<Storage, 'removeItem'>) {
  storage.removeItem(SAVED_CONTACT_KEY)
}

export function readRememberedContact(
  storage: Pick<Storage, 'getItem' | 'removeItem'>,
  now = Date.now(),
): RememberedContact | null {
  try {
    const raw = storage.getItem(SAVED_CONTACT_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as Partial<ContactEnvelope>
    const valid = stored.consentVersion === 2
      && stored.remembered === true
      && typeof stored.consentedAt === 'number'
      && typeof stored.expiresAt === 'number'
      && stored.expiresAt > now
      && stored.expiresAt <= stored.consentedAt + CONTACT_RETENTION_MS
      && isContact(stored.data)
    if (!valid) {
      storage.removeItem(SAVED_CONTACT_KEY)
      return null
    }
    return stored.data as RememberedContact
  } catch {
    storage.removeItem(SAVED_CONTACT_KEY)
    return null
  }
}

export function saveRememberedContact(
  storage: Pick<Storage, 'setItem'>,
  contact: RememberedContact,
  now = Date.now(),
) {
  const envelope: ContactEnvelope = {
    consentVersion: 2,
    remembered: true,
    consentedAt: now,
    expiresAt: now + CONTACT_RETENTION_MS,
    data: contact,
  }
  storage.setItem(SAVED_CONTACT_KEY, JSON.stringify(envelope))
}
