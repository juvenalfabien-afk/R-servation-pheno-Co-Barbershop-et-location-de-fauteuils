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
    desc: "Dégradé, coupe classique ou moderne. Finition au rasoir, styling soigné. Chaque passage chez Pheno, un résultat qui se voit.",
  },
  {
    num: '02',
    title: 'BARBE',
    price: 'À partir de 15€',
    desc: "Mise en forme précise, serviette chaude, mousse artisanale. Votre barbe mérite mieux que l'ordinaire.",
  },
  {
    num: '03',
    title: 'COUPE + BARBE',
    price: 'À partir de 35€',
    desc: "75 minutes de prise en charge complète. Coupe et barbe au même niveau d'exigence. Le package de ceux qui ne font pas de compromis.",
  },
]

const whyItems = [
  {
    title: 'SANS COMPROMIS',
    sub: 'Sur le matériel, la technique, et l\'accueil. Jamais.',
  },
  {
    title: 'RÉSERVATION EN LIGNE',
    sub: 'Votre créneau en 2 minutes, depuis votre canapé.',
  },
  {
    title: 'CŒUR DE VILLE',
    sub: 'Idéalement situé. Accessible, visible, à deux pas de tout.',
  },
]

const galleryPhotos = [
  { url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=700&h=460&q=80', alt: 'Intérieur barbershop' },
  { url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=700&h=460&q=80', alt: 'Barber au travail' },
  { url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=700&h=460&q=80', alt: 'Coupe précise' },
  { url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=700&h=460&q=80', alt: 'Finition dégradé' },
  { url: 'https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?auto=format&fit=crop&w=700&h=460&q=80', alt: 'Soin barbe' },
  { url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=700&h=460&q=80', alt: 'Ambiance salon' },
]

const heroStats = [
  { val: '1 200+', label: 'CLIENTS' },
  { val: '★ 5.0', label: 'GOOGLE' },
  { val: '4 ANS', label: "D'EXPÉRIENCE" },
]

export default function LandingPage() {
  return (
    <div className="lp">

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-brand">
          <span className="lp-logo-pheno">PHENO</span>
          <span className="lp-brand-sep">·</span>
          <span className="lp-logo-barber">BARBER</span>
        </div>
        <div className="lp-nav-links">
          <a href="#services">SERVICES</a>
          <a href="#galerie">RÉALISATIONS</a>
          <a href="#contact">CONTACT</a>
        </div>
        <div className="lp-nav-right">
          <a href="/location" className="lp-nav-location">Louer un fauteuil ↗</a>
          <a href="https://phenoandco.com/" target="_blank" rel="noopener noreferrer" className="lp-btn-yellow">RÉSERVER</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-line" aria-hidden="true" />
        <div className="lp-hero-content">
          <p className="lp-hero-eyebrow">BARBERSHOP PREMIUM · MONTPELLIER</p>
          <h1 className="lp-hero-headline">
            LE STYLE,<br />C&apos;EST SÉRIEUX.
          </h1>
          <p className="lp-hero-sub">
            Coupe, barbe, soin — par des mains qui font la différence.<br />
            Dans un espace qui respecte votre temps et votre style.
          </p>
          <div className="lp-hero-btns">
            <a href="https://phenoandco.com/" target="_blank" rel="noopener noreferrer" className="lp-btn-yellow lp-btn-hero">PRENDRE RDV</a>
            <a href="/location" className="lp-btn-outline">LOUER UN FAUTEUIL</a>
          </div>
        </div>

        <div className="lp-hero-stats">
          {heroStats.map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <span className="lp-hstat-sep" aria-hidden="true" />}
              <div className="lp-hstat">
                <span className="lp-hstat-val">{s.val}</span>
                <span className="lp-hstat-label">{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="lp-hero-scroll" aria-hidden="true">
          <span>SCROLL</span>
          <div className="lp-scroll-line" />
        </div>

        <div className="lp-hero-image" aria-hidden="true" />
      </section>

      {/* ── SERVICES ── */}
      <section className="lp-services" id="services">
        <p className="lp-eyebrow">NOS PRESTATIONS</p>
        <h2 className="lp-h2">CE QU&apos;ON FAIT,<br />ON LE FAIT BIEN</h2>
        <div className="lp-services-grid">
          {services.map((s) => (
            <div key={s.num} className="lp-service-card">
              <span className="lp-service-num">{s.num}</span>
              <h3 className="lp-service-title">{s.title}</h3>
              <div className="lp-service-sep" />
              <p className="lp-service-price">{s.price}</p>
              <p className="lp-service-desc">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="lp-services-cta">
          <a href="https://phenoandco.com/" target="_blank" rel="noopener noreferrer" className="lp-btn-outline-sm">RÉSERVER UNE PRESTATION →</a>
        </div>
      </section>

      {/* ── POURQUOI PHENO ── */}
      <section className="lp-why">
        <h2 className="lp-h2">POURQUOI PHENO BARBER&nbsp;?</h2>
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
        <div className="lp-gallery-head">
          <div>
            <p className="lp-eyebrow">RÉALISATIONS</p>
            <h2 className="lp-h2">NOS COUPES PARLENT</h2>
          </div>
          <p className="lp-gallery-sub">
            Chaque coupe est une signature.<br />Voici les nôtres.
          </p>
        </div>
        <div className="lp-gallery-grid">
          {galleryPhotos.map((photo, i) => (
            <div
              key={i}
              className="lp-gallery-photo"
              style={{ backgroundImage: `url(${photo.url})` }}
              role="img"
              aria-label={photo.alt}
            />
          ))}
        </div>
      </section>

      {/* ── CTA RÉSERVATION ── */}
      <section className="lp-cta">
        <h2 className="lp-cta-h2">
          PRÊT À VOUS<br />TRANSFORMER&nbsp;?
        </h2>
        <p className="lp-cta-sub">
          Un créneau de libre, moins de 2 minutes.<br />
          Le reste, c&apos;est nous qui nous en occupons.
        </p>
        <a href="https://phenoandco.com/" target="_blank" rel="noopener noreferrer" className="lp-btn-black">RÉSERVER MAINTENANT →</a>
        <a href="tel:0769432605" className="lp-cta-phone">Ou appelez-nous directement</a>
      </section>

      {/* ── CONTACT ── */}
      <section className="lp-contact" id="contact">
        <p className="lp-eyebrow">NOUS TROUVER</p>
        <h2 className="lp-h2">VENEZ NOUS VOIR</h2>
        <div className="lp-contact-cols">
          <div className="lp-contact-info">
            <p className="lp-contact-addr">18 Rue d&apos;Alger</p>
            <p className="lp-contact-detail">Montpellier 34000</p>
            <p className="lp-contact-detail">Mar – Sam : 10h – 18h</p>
            <p className="lp-contact-detail"><a href="tel:0769432605" className="lp-contact-link">07 69 43 26 05</a></p>
            <p className="lp-contact-detail"><a href="https://phenoandco.fr" target="_blank" rel="noopener noreferrer" className="lp-contact-link">phenoandco.fr</a></p>
          </div>
          <div className="lp-map-block">
            <iframe
              src="https://maps.google.com/maps?q=18+Rue+d%27Alger+34000+Montpellier&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="PHENO BARBER — 18 Rue d'Alger, Montpellier"
            />
          </div>
        </div>
        <div className="lp-contact-sep" />
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
            <div className="lp-footer-brand">
              <span className="lp-logo-pheno">PHENO</span>
              <span className="lp-brand-sep">·</span>
              <span className="lp-logo-barber">BARBER</span>
            </div>
            <p className="lp-footer-tagline">Barbershop premium · Montpellier</p>
          </div>
          <nav className="lp-footer-nav" aria-label="Footer navigation">
            <a href="#">Accueil</a>
            <a href="#services">Services</a>
            <a href="/location">Location fauteuil</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="lp-footer-social">
            <a
              href="https://www.instagram.com/pheno_barber/"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-social-icon"
              aria-label="Instagram"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@pheno_barber"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-social-icon"
              aria-label="TikTok"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z"/>
              </svg>
            </a>
          </div>
        </div>
        <div className="lp-footer-sep" />
        <div className="lp-footer-bottom">
          <span>© 2026 Pheno Barber — Montpellier</span>
          <a href="/mentions-legales">Mentions légales</a>
        </div>
      </footer>

    </div>
  )
}
