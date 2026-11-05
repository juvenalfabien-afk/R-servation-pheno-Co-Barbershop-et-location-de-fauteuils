import type { DeliveryBatchResult, DeliveryResult } from './delivery'
import { sendLocationEmails, sendRdvEmails } from './email'
import { deliverClaimed, type ClaimedDeliveryState } from './notification-delivery'
import { sendLocationSmsClient, sendRdvSmsClient } from './sms'

export interface RdvNotificationData {
  nom: string
  email: string
  telephone: string
  date: string
  slot: string
  prestationLabel: string
  smsPrestationLabel?: string
  degradeLabel?: string
  optionsLabels: string[]
  totalPrice: number
  totalDuration: number
  categorie: string
}

export interface LocationNotificationData {
  nom: string
  email: string
  telephone: string
  formuleLabel: string
  packLabel: string
  durationDetails: string
  dateDebut: string
  dateFin?: string
  heureDebut: string
  heureFin: string
  totalHT: number
  tva: number
  totalTTC: number
  acompteTaux: number
  acompteTTC: number
  soldeTTC: number
}

export interface NotificationAttempt {
  email: ClaimedDeliveryState
  sms: ClaimedDeliveryState
}

function batchAsDeliveryResult(batch: DeliveryBatchResult): DeliveryResult {
  if (batch.ok) return { ok: true, status: 'sent', retryable: false }
  const uncertain = batch.deliveries.some(delivery => delivery.status === 'uncertain')
  return {
    ok: false,
    status: uncertain ? 'uncertain' : 'failed',
    retryable: batch.deliveries.some(delivery => delivery.retryable),
    errorCode: uncertain ? 'batch_uncertain' : 'batch_failed',
  }
}

export async function attemptRdvNotifications(
  data: RdvNotificationData,
  eventKey: string,
): Promise<NotificationAttempt> {
  const [email, sms] = await Promise.all([
    deliverClaimed(`${eventKey}:email`, 'email', async key => batchAsDeliveryResult(await sendRdvEmails(data, key))),
    deliverClaimed(`${eventKey}:sms`, 'sms', () => sendRdvSmsClient({
      nom: data.nom,
      telephone: data.telephone,
      date: data.date,
      slot: data.slot,
      prestationLabel: data.smsPrestationLabel ?? data.prestationLabel,
    })),
  ])
  return { email, sms }
}

export async function attemptLocationNotifications(
  data: LocationNotificationData,
  eventKey: string,
): Promise<NotificationAttempt> {
  const [email, sms] = await Promise.all([
    deliverClaimed(`${eventKey}:email`, 'email', async key => batchAsDeliveryResult(await sendLocationEmails(data, key))),
    deliverClaimed(`${eventKey}:sms`, 'sms', () => sendLocationSmsClient({
      nom: data.nom,
      telephone: data.telephone,
      dateDebut: data.dateDebut,
      formuleLabel: data.formuleLabel,
    })),
  ])
  return { email, sms }
}
