import React from 'react'
import './vitrine.css'

export const metadata = {
  title: 'PHENO BARBER — Barbershop Premium Montpellier',
  description: 'Barbershop premium à Montpellier. Coupe, barbe, soin — par des mains qui savent. Réservez en ligne ou louez un fauteuil.',
}

const services = [
  {
    num: '01',
    title: 'COUPE',
    price: 'À partir de 25€',
    desc: 'Coupe homme, dégradé ou classique. Finition rasoir et styling inclus.',
  },
  {
    num: '02',
    title: 'BARBE',
    price: 'À partir de 15€',
    desc: 'Taille, mise en forme et soin complet de la barbe à la mousse chaude.',
  },
  {
    num: '03',
    title: 'COUPE + BARBE',
    price: 'À partir de 35€',
    desc: 'La formule complète. Résultat premium garanti, prise en charge totale.',
  },
]

const whyItems = [
  { title: '100% SATISFACTION', sub: 'Ou on recommence. Sans discussion.' },
  { title: 'RÉSERVATION EN LIGNE', sub: 'Simple, rapide, disponible 24h/24.' },
  { title: 'MONTPELLIER', sub: "Cœur de ville, facile d'accès." },
]

export default function LandingPage() {
  return (
    <div className="lp">

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <span className="lp-logo-pheno">PHENO</span>
          <span className="lp-logo-barber">BARBER</span>
        </div>
        <div className="lp-nav-links">
          <a href="#prestations">PRESTATIONS</a>
          <a href="#galerie">GALERIE</a>
          <a href="#contact">CONTACT</a>
        </div>
        <div className="lp-nav-right">
          <a href="/reservation" className="lp-btn-yellow">RÉSERVER</a>
          <a href="/location" className="lp-nav-rent">Louer un fauteuil</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-line" aria-hidden="true" />
        <div className="lp-hero-content">
          <h1 className="lp-hero-headline">
            LE STYLE,<br />C&apos;EST SÉRIEUX.
          </h1>
          <p className="lp-hero-sub">
            Barbershop premium à Montpellier. Coupe, barbe, soin — par des mains qui savent.
          </p>
          <div className="lp-hero-btns">
            <a href="/reservation" className="lp-btn-yellow">RÉSERVER</a>
            <a href="/location" className="lp-btn-outline">LOUER UN FAUTEUIL</a>
          </div>
        </div>
        <div className="lp-hero-scroll" aria-hidden="true">
          <span>SCROLL</span>
          <div className="lp-scroll-line" />
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="lp-services" id="prestations">
        <p className="lp-eyebrow">NOS PRESTATIONS</p>
        <h2 className="lp-h2">CE QU&apos;ON FAIT, ON LE FAIT BIEN</h2>
        <div className="lp-services-grid">
          {services.map((s) => (
            <div key={s.num} className="lp-service-card">
              <span className="lp-service-num">{s.num}</span>
              <h3 className="lp-service-title">{s.title}</h3>
              <hr className="lp-service-sep" />
              <p className="lp-service-price">{s.price}</p>
              <p className="lp-service-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── POURQUOI PHENO ── */}
      <section className="lp-why">
        <h2 className="lp-h2">POURQUOI PHENO BARBER ?</h2>
        <div className="lp-why-cols">
          {whyItems.map((item, i) => (
            <React.Fragment key={item.title}>
              <div className="lp-why-col">
                <span className="lp-why-title">{item.title}</span>
                <p className="lp-why-sub">{item.sub}</p>
              </div>
              {i < whyItems.length - 1 && (
                <div className="lp-why-sep" aria-hidden="true" />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── GALERIE ── */}
      <section className="lp-gallery" id="galerie">
        <p className="lp-eyebrow">RÉALISATIONS</p>
        <h2 className="lp-h2">NOS COUPES PARLENT</h2>
        <div className="lp-gallery-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="lp-gallery-photo" />
          ))}
        </div>
      </section>

      {/* ── CTA RÉSERVATION ── */}
      <section className="lp-cta">
        <h2 className="lp-cta-h2">
          PRÊT À VOUS<br />TRANSFORMER&nbsp;?
        </h2>
        <p className="lp-cta-sub">Réservez votre créneau en moins de 2 minutes.</p>
        <a href="/reservation" className="lp-btn-black">RÉSERVER MAINTENANT →</a>
        <a href="tel:0467000000" className="lp-cta-phone">Ou appelez-nous directement</a>
      </section>

      {/* ── CONTACT ── */}
      <section className="lp-contact" id="contact">
        <p className="lp-eyebrow">NOUS TROUVER</p>
        <h2 className="lp-h2">VENEZ NOUS VOIR</h2>
        <div className="lp-contact-cols">
          <div className="lp-contact-info">
            <p className="lp-contact-addr">12 Rue de la République</p>
            <p className="lp-contact-detail">Montpellier 34000</p>
            <p className="lp-contact-detail">Mar – Sam : 9h – 19h</p>
            <p className="lp-contact-detail">04 67 XX XX XX</p>
            <p className="lp-contact-detail">contact@phenobarber.fr</p>
          </div>
          <div className="lp-map-block">
            <span>Carte Google Maps</span>
          </div>
        </div>
        <hr className="lp-contact-sep" />
        <h3 className="lp-form-title">NOUS ÉCRIRE</h3>
        <form className="lp-contact-form" action="#" method="post">
          <div className="lp-form-row">
            <input type="text" name="prenom" placeholder="Votre prénom" className="lp-input" />
            <input type="text" name="nom" placeholder="Votre nom" className="lp-input" />
          </div>
          <div className="lp-form-row">
            <input type="email" name="email" placeholder="Votre email" className="lp-input" />
            <input type="tel" name="telephone" placeholder="Votre téléphone" className="lp-input" />
          </div>
          <textarea
            name="message"
            placeholder="Votre message…"
            className="lp-textarea"
            rows={4}
          />
          <button type="submit" className="lp-btn-yellow-full">ENVOYER</button>
        </form>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div className="lp-footer-logo">
            <div className="lp-footer-logo-row">
              <span className="lp-logo-pheno">PHENO</span>
              <span className="lp-logo-barber">BARBER</span>
            </div>
            <p className="lp-footer-tagline">Barbershop premium · Montpellier</p>
          </div>
          <nav className="lp-footer-nav" aria-label="Footer navigation">
            <a href="#">Accueil</a>
            <a href="#prestations">Prestations</a>
            <a href="/location">Location fauteuil</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="lp-footer-social">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-social-icon"
              aria-label="Instagram"
            >
              IG
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-social-icon"
              aria-label="TikTok"
            >
              TT
            </a>
          </div>
        </div>
        <hr className="lp-footer-sep" />
        <div className="lp-footer-bottom">
          <span>© 2026 Pheno Barber — Montpellier</span>
          <a href="/mentions-legales">Mentions légales</a>
        </div>
      </footer>

    </div>
  )
}
