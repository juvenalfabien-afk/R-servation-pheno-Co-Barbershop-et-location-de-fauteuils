const SCHEDULED_FUNCTION_TIMEOUT_MS = 25_000

const notificationsCron = async () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const cronSecret = process.env.CRON_SECRET
  if (!siteUrl || !cronSecret) throw new Error('Notification cron configuration is incomplete')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SCHEDULED_FUNCTION_TIMEOUT_MS)
  try {
    const response = await fetch(new URL('/api/cron/notifications', siteUrl), {
      method: 'POST',
      headers: { authorization: `Bearer ${cronSecret}` },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Notification worker returned HTTP ${response.status}`)
    return new Response(null, { status: 204 })
  } finally {
    clearTimeout(timeout)
  }
}

export default notificationsCron

export const config = {
  schedule: '*/5 * * * *',
}
