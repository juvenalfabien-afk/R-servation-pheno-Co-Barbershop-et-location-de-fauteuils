import type { Metadata } from 'next'
import { Poppins, Playfair_Display, Bebas_Neue } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bebas',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PHENO&CO — Barbershop Premium Montpellier',
  description: 'Barbershop premium à Montpellier. Coupe homme, dégradé, barbe — 15 ans de savoir-faire. Réservez en ligne ou louez un fauteuil. 18 rue d\'Alger, Saint-Roch.',
  keywords: ['barbershop montpellier', 'coiffeur homme montpellier', 'dégradé montpellier', 'barbe montpellier', 'coupe homme', 'barbier saint-roch'],
  openGraph: {
    title: 'PHENO&CO — Barbershop Premium Montpellier',
    description: 'Coupe, dégradé, barbe — 15 ans de savoir-faire. Réservez en ligne.',
    type: 'website',
    locale: 'fr_FR',
    images: [{ url: '/logo-pheno.png', width: 512, height: 512, alt: 'PHENO&CO Barbershop Montpellier' }],
  },
  twitter: {
    card: 'summary',
    title: 'PHENO&CO — Barbershop Premium Montpellier',
    description: 'Coupe, dégradé, barbe — 15 ans de savoir-faire. Réservez en ligne.',
    images: ['/logo-pheno.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${poppins.variable} ${playfair.variable} ${bebasNeue.variable}`}>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
