// Never let automated tests inherit credentials for the future production project.
// Individual tests may install explicit fictitious values after this file runs.
for (const name of [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_FROM_NUMBER',
  'ADMIN_PASSWORD',
  'ADMIN_SECRET',
  'RATE_LIMIT_SECRET',
  'MARKETING_UNSUBSCRIBE_SECRET',
  'CRON_SECRET',
]) {
  delete process.env[name]
}

process.env.NEXT_PUBLIC_SITE_URL = 'https://pheno.example.test'
process.env.NEXT_PUBLIC_ADMIN_EMAIL = 'admin@pheno.example.test'
process.env.TRUST_PROXY = 'false'
process.env.HOSTING_PLATFORM = 'none'

// A test must opt in to a mocked fetch. This prevents accidental calls to
// Supabase, Resend, Twilio or any other external service from the test suite.
globalThis.fetch = async input => {
  const target = typeof input === 'string' ? input : input instanceof URL ? input.origin : input.url
  throw new Error(`Network access is disabled in tests (${target})`)
}
