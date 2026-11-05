const DEFAULT_PROVIDER_TIMEOUT_MS = 8_000
const MIN_PROVIDER_TIMEOUT_MS = 1_000
const MAX_PROVIDER_TIMEOUT_MS = 30_000

export class ProviderTimeoutError extends Error {
  constructor() {
    super('Provider request timed out')
    this.name = 'ProviderTimeoutError'
  }
}

export function getProviderTimeoutMs(value = process.env.NOTIFICATION_TIMEOUT_MS): number {
  if (!value) return DEFAULT_PROVIDER_TIMEOUT_MS
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= MIN_PROVIDER_TIMEOUT_MS && parsed <= MAX_PROVIDER_TIMEOUT_MS
    ? parsed
    : DEFAULT_PROVIDER_TIMEOUT_MS
}

export async function providerFetch(
  input: string | URL | Request,
  init: RequestInit = {},
  timeoutMs = getProviderTimeoutMs(),
): Promise<Response> {
  const controller = new AbortController()
  let timeout: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort()
      reject(new ProviderTimeoutError())
    }, timeoutMs)
  })

  try {
    return await Promise.race([
      fetch(input, { ...init, signal: controller.signal }),
      timeoutPromise,
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}
