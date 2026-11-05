import { afterEach, describe, expect, it, vi } from 'vitest'
import { providerFetch, ProviderTimeoutError } from '@/lib/provider-fetch'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('provider HTTP timeout', () => {
  it('interrompt une requête fournisseur qui ne répond jamais', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)))

    const pending = providerFetch('https://provider.example.test', {}, 25)
    const assertion = expect(pending).rejects.toBeInstanceOf(ProviderTimeoutError)
    await vi.advanceTimersByTimeAsync(25)
    await assertion
  })
})
