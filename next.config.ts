import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Frame-Options',          value: 'DENY' },
  { key: 'X-Content-Type-Options',   value: 'nosniff' },
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.unsplash.com",
      "connect-src 'self' https://*.supabase.co",
      "frame-src https://maps.google.com https://www.google.com",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      {
        source: '/admin(.*)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 828, 1080, 1280, 1920],
    minimumCacheTTL: 86400,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

export default nextConfig;
