import Link from 'next/link'
import ReservationForm from '@/components/ReservationForm'

export const metadata = {
  title: 'Réservation — PHENO BARBER',
  description: 'Réservez votre fauteuil chez PHENO BARBER, barbershop à Montpellier.',
}

export default function ReservationPage() {
  return (
    <main>
      <header className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="PHENO&CO" className="hero-logo" />
        <h1>PHENO&CO</h1>
        <p className="hero-sub">Barbershop &amp; Location de fauteuil · Montpellier</p>
        <div className="hero-actions">
          <a href="#reservation" className="btn btn-primary">Réserver un fauteuil</a>
          <Link href="/cgv-location" className="btn btn-ghost">CGV &amp; Contrat</Link>
          <a
            href="https://wa.me/message/MZYDVEN32I55L1"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-wa"
          >
            💬 WhatsApp
          </a>
        </div>
      </header>

      <ReservationForm />
    </main>
  )
}
