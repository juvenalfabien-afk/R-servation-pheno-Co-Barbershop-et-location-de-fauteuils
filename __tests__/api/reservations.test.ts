import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted : variables accessibles dans les factories vi.mock (qui sont hoistées)
const { mockFrom, mockInsert, mockOrder, mockEq, mockUpdate, mockSelect } = vi.hoisted(() => ({
  mockFrom:   vi.fn(),
  mockInsert: vi.fn(),
  mockOrder:  vi.fn(),
  mockEq:     vi.fn(),
  mockUpdate: vi.fn(),
  mockSelect: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({ from: mockFrom }),
}))

vi.mock('@/lib/auth', () => ({
  isAdminAuthenticated: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/supabase')>()
  return { ...actual, supabase: { from: mockFrom } }
})

import { POST, GET }         from '@/app/api/reservations/route'
import { PATCH }              from '@/app/api/reservations/[id]/route'
import { isAdminAuthenticated } from '@/lib/auth'
import type { Reservation }   from '@/lib/types'

// ── Fixture ────────────────────────────────────────────────────────────────

const reservation: Reservation = {
  id: 'test-uuid-001',
  createdAt: '2026-07-01T10:00:00Z',
  nom: 'Marie Martin',
  email: 'marie@test.fr',
  telephone: '0612345678',
  typeDuration: 'court',
  formule: 'journee',
  pack: 'essentiel',
  dateDebut: '2026-07-15',
  statutPro: 'auto-entrepreneur',
  experience: '3-5',
  specialites: ['barber'],
  totalHT: 85,
  tva: 17,
  totalTTC: 102,
  acompte: 51,
  status: 'pending',
}

// ── POST /api/reservations ─────────────────────────────────────────────────

describe('POST /api/reservations', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue({ insert: mockInsert })
    mockInsert.mockResolvedValue({ error: null })
  })

  it('crée une réservation et retourne 201', async () => {
    const req = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservation),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect((await res.json()).ok).toBe(true)
  })

  it('retourne 500 si Supabase échoue', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'DB error' } })
    const req = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservation),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBeDefined()
  })

  it('appelle supabase.from("reservations").insert avec les données', async () => {
    const req = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservation),
    })
    await POST(req)
    expect(mockFrom).toHaveBeenCalledWith('reservations')
    expect(mockInsert).toHaveBeenCalled()
  })
})

// ── GET /api/reservations ──────────────────────────────────────────────────

const dbRows = [{
  id: 'row-1', created_at: '2026-07-01T10:00:00Z', nom: 'Test', email: 't@t.fr',
  telephone: '0600000000', type_duration: 'court', formule: 'journee', pack: 'aucun',
  date_debut: '2026-07-15', date_fin: null, heure_debut: null, heure_fin: null,
  statut_pro: 'auto-entrepreneur', experience: '0-3', specialites: [],
  total_ht: '65', tva: '13', total_ttc: '78', acompte: '39', status: 'pending', notes: null,
}]

describe('GET /api/reservations', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ order: mockOrder })
    mockOrder.mockResolvedValue({ data: dbRows, error: null })
    vi.mocked(isAdminAuthenticated).mockResolvedValue(true)
  })

  it('retourne 200 avec la liste pour un admin', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json).toHaveLength(1)
    expect(json[0].id).toBe('row-1')
    expect(json[0].totalTTC).toBe(78)
  })

  it('retourne 401 si non admin', async () => {
    vi.mocked(isAdminAuthenticated).mockResolvedValueOnce(false)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('retourne 500 si Supabase échoue', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

// ── PATCH /api/reservations/[id] ───────────────────────────────────────────

describe('PATCH /api/reservations/[id]', () => {
  beforeEach(() => {
    mockEq.mockResolvedValue({ error: null })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdate })
    vi.mocked(isAdminAuthenticated).mockResolvedValue(true)
  })

  it('met à jour le statut et retourne ok', async () => {
    const req = new Request('http://localhost/api/reservations/test-uuid-001', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'test-uuid-001' }) })
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('retourne 401 si non admin', async () => {
    vi.mocked(isAdminAuthenticated).mockResolvedValueOnce(false)
    const req = new Request('http://localhost/api/reservations/x', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'x' }) })
    expect(res.status).toBe(401)
  })

  it('retourne 500 si Supabase échoue', async () => {
    mockEq.mockResolvedValueOnce({ error: { message: 'DB error' } })
    const req = new Request('http://localhost/api/reservations/x', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'x' }) })
    expect(res.status).toBe(500)
  })

  it('appelle .update({ status }).eq("id", id)', async () => {
    const req = new Request('http://localhost/api/reservations/abc-42', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' }),
    })
    await PATCH(req, { params: Promise.resolve({ id: 'abc-42' }) })
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'confirmed' })
    expect(mockEq).toHaveBeenCalledWith('id', 'abc-42')
  })
})
