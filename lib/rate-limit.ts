import { createHmac } from 'crypto'
import { getSupabase } from './supabase'

interface RateLimitOptions {
  namespace: string
  limit: number
  windowSeconds: number
}

const localWindows = new Map<string, { count: number; resetAt: number }>()

function firstHeaderAddress(value: string | null): string | null {
  const address = value?.split(',')[0]?.trim()
  if (!address || address.length > 64 || !/^[0-9a-fA-F:.]+$/.test(address)) return null
  return address
}

export function getClientAddress(request: Request): string {
  const platform = process.env.HOSTING_PLATFORM ?? 'none'
  const platformAddress = platform === 'vercel'
    ? firstHeaderAddress(request.headers.get('x-vercel-forwarded-for'))
    : platform === 'cloudflare'
      ? firstHeaderAddress(request.headers.get('cf-connecting-ip'))
      : platform === 'netlify'
        ? firstHeaderAddress(request.headers.get('x-nf-client-connection-ip'))
        : null

  if (platformAddress) return platformAddress
  if (platform === 'none' && process.env.TRUST_PROXY === 'true') {
    return firstHeaderAddress(request.headers.get('x-forwarded-for')) ?? 'unknown'
  }
  return 'unknown'
}

function boundedHeader(request: Request, name: string): string {
  return (request.headers.get(name) ?? '').slice(0, 160)
}

function opaqueKey(request: Request, namespace: string): { key: string | null; reason?: 'missing_secret' | 'untrusted_identity' } {
  const secret = process.env.RATE_LIMIT_SECRET
  if (!secret || secret.length < 32) return { key: null, reason: 'missing_secret' }
  const address = getClientAddress(request)
  // Les indices contrôlés par le navigateur ne servent qu'en développement/test.
  // Une adresse fournie par le proxy explicitement déclaré est exigée en production.
  if (address === 'unknown' && !mayUseLocalFallback()) {
    return { key: null, reason: 'untrusted_identity' }
  }
  const identity = address === 'unknown'
    ? `fallback:${boundedHeader(request, 'user-agent')}:${boundedHeader(request, 'accept-language')}:${boundedHeader(request, 'sec-ch-ua')}`
    : `ip:${address}`
  return {
    key: createHmac('sha256', secret)
      .update(`${namespace}:${identity}`)
      .digest('hex'),
  }
}

function localRateLimit(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now()
  const current = localWindows.get(key)
  if (!current || current.resetAt <= now) {
    localWindows.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return true
  }
  if (current.count >= limit) return false
  current.count += 1
  return true
}

function mayUseLocalFallback(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
}

function reportUnavailable(namespace: string, reason: 'missing_secret' | 'untrusted_identity' | 'rpc_error' | 'rpc_exception'): void {
  // Never log the client address, the opaque key or provider details.
  console.error('[rate-limit] distributed limiter unavailable', { namespace, reason })
}

export async function enforceRateLimit(request: Request, options: RateLimitOptions): Promise<boolean> {
  const identity = opaqueKey(request, options.namespace)
  const key = identity.key
  if (!key) {
    if (mayUseLocalFallback()) {
      return localRateLimit(`${options.namespace}:local`, options.limit, options.windowSeconds)
    }
    reportUnavailable(options.namespace, identity.reason ?? 'untrusted_identity')
    return false
  }

  try {
    const { data, error } = await getSupabase().rpc('check_rate_limit', {
      p_key: key,
      p_limit: options.limit,
      p_window_seconds: options.windowSeconds,
    })
    if (!error) return data === true
    if (mayUseLocalFallback()) return localRateLimit(key, options.limit, options.windowSeconds)
    reportUnavailable(options.namespace, 'rpc_error')
    return false
  } catch {
    if (mayUseLocalFallback()) return localRateLimit(key, options.limit, options.windowSeconds)
    reportUnavailable(options.namespace, 'rpc_exception')
    return false
  }
}
