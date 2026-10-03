import { getSupabase } from './supabase'

export interface Client {
  id: string
  nom: string
  email: string | null
  telephone: string | null
  lastRdvAt: string | null
  rdvCount: number
  locationCount: number
}

function fromRow(r: Record<string, unknown>): Client {
  return {
    id:            r.id as string,
    nom:           r.nom as string,
    email:         r.email as string | null,
    telephone:     r.telephone as string | null,
    lastRdvAt:     r.last_rdv_at as string | null,
    rdvCount:      Number(r.rdv_count ?? 0),
    locationCount: Number(r.location_count ?? 0),
  }
}

export async function upsertClientRdv(data: {
  nom: string; email: string; telephone: string
}): Promise<void> {
  try {
    const sb = getSupabase()
    const { data: existing } = await sb
      .from('clients')
      .select('id, rdv_count')
      .or(`email.eq.${data.email},telephone.eq.${data.telephone}`)
      .limit(1)
      .maybeSingle()

    if (existing) {
      await sb
        .from('clients')
        .update({
          nom: data.nom,
          email: data.email,
          telephone: data.telephone,
          last_rdv_at: new Date().toISOString(),
          rdv_count: (existing.rdv_count ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      const { randomUUID } = await import('crypto')
      await sb.from('clients').insert([{
        id: randomUUID(),
        nom: data.nom,
        email: data.email,
        telephone: data.telephone,
        last_rdv_at: new Date().toISOString(),
        rdv_count: 1,
        location_count: 0,
      }])
    }
  } catch (err) {
    console.error('[clients] upsertClientRdv failed:', err)
  }
}

export async function upsertClientLocation(data: {
  nom: string; email: string; telephone: string
}): Promise<void> {
  try {
    const sb = getSupabase()
    const { data: existing } = await sb
      .from('clients')
      .select('id, location_count')
      .or(`email.eq.${data.email},telephone.eq.${data.telephone}`)
      .limit(1)
      .maybeSingle()

    if (existing) {
      await sb
        .from('clients')
        .update({
          nom: data.nom,
          email: data.email,
          telephone: data.telephone,
          location_count: (existing.location_count ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      const { randomUUID } = await import('crypto')
      await sb.from('clients').insert([{
        id: randomUUID(),
        nom: data.nom,
        email: data.email,
        telephone: data.telephone,
        last_rdv_at: null,
        rdv_count: 0,
        location_count: 1,
      }])
    }
  } catch (err) {
    console.error('[clients] upsertClientLocation failed:', err)
  }
}

export async function lookupClient(emailOrPhone: string): Promise<Client | null> {
  const q = emailOrPhone.trim().toLowerCase()
  if (!q) return null
  const sb = getSupabase()
  const { data } = await sb
    .from('clients')
    .select('*')
    .or(`email.ilike.${q},telephone.eq.${emailOrPhone.trim()}`)
    .limit(1)
    .maybeSingle()
  return data ? fromRow(data as Record<string, unknown>) : null
}

export async function getInactiveClients(daysInactive: number): Promise<Client[]> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysInactive)
  const sb = getSupabase()
  const { data } = await sb
    .from('clients')
    .select('*')
    .not('email', 'is', null)
    .lt('last_rdv_at', cutoff.toISOString())
    .order('last_rdv_at', { ascending: true })
    .limit(100)
  return (data ?? []).map(r => fromRow(r as Record<string, unknown>))
}
