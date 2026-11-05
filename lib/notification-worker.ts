import { attemptLocationNotifications, attemptRdvNotifications, type LocationNotificationData, type NotificationAttempt, type RdvNotificationData } from './booking-notifications'
import { getSupabase } from './supabase'

type JobEvent = 'rdv_confirmation' | 'rdv_group_confirmation' | 'location_confirmation'
type JobStatus = 'sent' | 'failed' | 'uncertain'

interface ClaimedJob {
  job_key: string
  event_type: JobEvent
  source_id: string
  lease_token: string
  attempt_count: number
}

interface DeliveryRow {
  delivery_key: string
  status: 'processing' | 'sent' | 'failed' | 'uncertain'
  retryable: boolean
}

interface FinalState {
  status: JobStatus
  retryable: boolean
  errorCode: string | null
}

export interface NotificationWorkerReport {
  ok: boolean
  claimed: number
  sent: number
  failed: number
  uncertain: number
}

const RDV_COLUMNS = 'id, nom, email, telephone, date, slot, prestation_label, degrade_label, options_labels, total_price, total_duration, categorie, status, group_id, person_label'
const LOCATION_COLUMNS = 'id, nom, email, telephone, formule, pack, type_duration, date_debut, date_fin, heure_debut, heure_fin, total_ht, tva, total_ttc, acompte, status'

function locationLabels(row: Record<string, unknown>) {
  const formulas: Record<string, string> = {
    horaire: "À l'heure - 10 € HT",
    'demi-journee': 'Demi-journée (4h) - 35 € HT',
    journee: 'Journée - 65 € HT',
    semaine: 'Semaine - 60 € HT / jour',
    mois: 'Mensuel - 55 € HT / jour',
  }
  const packs: Record<string, string> = {
    aucun: 'Aucun - 0 €',
    essentiel: 'Pack Essentiel - 20 € HT / jour',
    premium: 'Pack Premium - 30 € HT / jour',
  }
  return {
    formuleLabel: formulas[String(row.formule)] ?? String(row.formule),
    packLabel: packs[String(row.pack)] ?? String(row.pack),
  }
}

function rdvData(rows: Array<Record<string, unknown>>): RdvNotificationData | null {
  const active = rows.filter(row => row.status !== 'cancelled')
  const first = active[0]
  if (!first) return null
  const group = Boolean(first.group_id)
  return {
    nom: String(first.nom),
    email: String(first.email),
    telephone: String(first.telephone),
    date: String(first.date),
    slot: String(first.slot),
    prestationLabel: group
      ? active.map(row => `${row.person_label ?? 'Personne'} : ${row.prestation_label}`).join(' | ')
      : String(first.prestation_label),
    smsPrestationLabel: group ? `Groupe de ${active.length} personnes` : undefined,
    degradeLabel: group ? undefined : first.degrade_label ? String(first.degrade_label) : undefined,
    optionsLabels: group ? [] : Array.isArray(first.options_labels) ? first.options_labels.map(String) : [],
    totalPrice: active.reduce((sum, row) => sum + Number(row.total_price ?? 0), 0),
    totalDuration: active.reduce((sum, row) => sum + Number(row.total_duration ?? 0), 0),
    categorie: String(first.categorie),
  }
}

function locationData(row: Record<string, unknown> | null): LocationNotificationData | null {
  if (!row || row.status === 'cancelled') return null
  const labels = locationLabels(row)
  const totalTTC = Number(row.total_ttc ?? 0)
  const acompte = Number(row.acompte ?? 0)
  return {
    nom: String(row.nom),
    email: String(row.email),
    telephone: String(row.telephone),
    ...labels,
    durationDetails: '',
    dateDebut: String(row.date_debut),
    dateFin: row.date_fin ? String(row.date_fin) : undefined,
    heureDebut: row.heure_debut ? String(row.heure_debut) : '10:00',
    heureFin: row.heure_fin ? String(row.heure_fin) : '18:00',
    totalHT: Number(row.total_ht ?? 0),
    tva: Number(row.tva ?? 0),
    totalTTC,
    acompteTaux: String(row.type_duration) === 'court' ? 0.5 : 0.25,
    acompteTTC: acompte,
    soldeTTC: totalTTC - acompte,
  }
}

async function executeJob(job: ClaimedJob): Promise<NotificationAttempt | null> {
  const sb = getSupabase()
  if (job.event_type === 'rdv_group_confirmation') {
    const { data, error } = await sb.from('rdv_bookings').select(RDV_COLUMNS).eq('group_id', job.source_id).order('slot')
    if (error) throw new Error('source_unavailable')
    const payload = rdvData((data ?? []) as Array<Record<string, unknown>>)
    return payload ? attemptRdvNotifications(payload, job.job_key) : null
  }
  if (job.event_type === 'rdv_confirmation') {
    const { data, error } = await sb.from('rdv_bookings').select(RDV_COLUMNS).eq('id', job.source_id).maybeSingle()
    if (error) throw new Error('source_unavailable')
    const payload = rdvData(data ? [data as Record<string, unknown>] : [])
    return payload ? attemptRdvNotifications(payload, job.job_key) : null
  }

  const { data, error } = await sb.from('reservations').select(LOCATION_COLUMNS).eq('id', job.source_id).maybeSingle()
  if (error) throw new Error('source_unavailable')
  const payload = locationData(data as Record<string, unknown> | null)
  return payload ? attemptLocationNotifications(payload, job.job_key) : null
}

async function authoritativeState(jobKey: string, attempt: NotificationAttempt | null): Promise<FinalState> {
  if (!attempt) return { status: 'sent', retryable: false, errorCode: null }
  const keys = [`${jobKey}:email`, `${jobKey}:sms`]
  const { data, error } = await getSupabase()
    .from('notification_deliveries')
    .select('delivery_key, status, retryable')
    .in('delivery_key', keys)
  if (error) return { status: 'failed', retryable: true, errorCode: 'delivery_state_unavailable' }

  const rows = (data ?? []) as DeliveryRow[]
  if (rows.length === keys.length && rows.every(row => row.status === 'sent')) {
    return { status: 'sent', retryable: false, errorCode: null }
  }
  if (rows.some(row => row.status === 'processing')) {
    return { status: 'uncertain', retryable: true, errorCode: 'delivery_processing' }
  }
  const retryable = rows.length < keys.length || rows.some(row => row.retryable)
  const uncertain = rows.some(row => row.status === 'uncertain') || Object.values(attempt).includes('uncertain')
  return {
    status: uncertain ? 'uncertain' : 'failed',
    retryable,
    errorCode: uncertain ? 'delivery_uncertain' : 'delivery_failed',
  }
}

async function finalizeJob(job: ClaimedJob, state: FinalState): Promise<void> {
  const retryAfter = state.retryable ? Math.min(3600, 60 * (2 ** Math.max(0, job.attempt_count - 1))) : 0
  const { error } = await getSupabase().rpc('finalize_notification_job', {
    p_job_key: job.job_key,
    p_lease_token: job.lease_token,
    p_status: state.status,
    p_retryable: state.retryable,
    p_retry_after_seconds: retryAfter,
    p_error_code: state.errorCode,
  })
  if (error) throw new Error('job_finalize_failed')
}

export async function processNotificationJobs(limit = 25): Promise<NotificationWorkerReport> {
  const report: NotificationWorkerReport = { ok: true, claimed: 0, sent: 0, failed: 0, uncertain: 0 }
  let jobs: ClaimedJob[]
  try {
    const { data, error } = await getSupabase().rpc('claim_notification_jobs', {
      p_limit: Math.max(1, Math.min(limit, 100)),
      p_lease_seconds: 300,
    })
    if (error) throw new Error('claim_failed')
    jobs = (data ?? []) as ClaimedJob[]
  } catch {
    console.error('[notification-worker] claim_failed')
    return { ...report, ok: false }
  }

  report.claimed = jobs.length
  await Promise.all(jobs.map(async job => {
    let state: FinalState
    try {
      const attempt = await executeJob(job)
      state = await authoritativeState(job.job_key, attempt)
    } catch {
      state = { status: 'failed', retryable: true, errorCode: 'job_execution_failed' }
    }
    try {
      await finalizeJob(job, state)
      report[state.status] += 1
    } catch {
      report.ok = false
      console.error('[notification-worker] finalize_failed')
    }
  }))
  return report
}
