'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import emailjs from '@emailjs/browser'
import './landing.css'

const EMAILJS_SERVICE  = 'service_qph2t86'
const EMAILJS_TEMPLATE = 'template_m6uvyuq'
const EMAILJS_KEY      = process.env.NEXT_PUBLIC_EMAILJS_KEY ?? 'uBxESnC6CTyqiNyS6'
const ADMIN_EMAIL      = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'location.phenoandco@gmail.com'

emailjs.init(EMAILJS_KEY)

const services = [
  {
    num: '01',
    title: 'Dégradé',
    price: 'À partir de 25 €',
    desc: "Dégradé classique, skin fade, taper, burst, high top… Finition rasoir et styling soigné. Chaque passage chez PHENO, un résultat qui se voit.",
  },
  {
    num: '02',
    title: 'Coupe + Barbe',
    price: 'À partir de 30 €',
    desc: "Coupe complète et barbe mise en forme, serviette chaude, mousse artisanale. La combinaison pour ceux qui ne font pas de compromis.",
  },
  {
    num: '03',
    title: 'Forfait Complet',
    price: 'À partir de 45 €',
    desc: "Coupe, shampoing, soin, coiffage — prise en charge complète au même niveau d'exigence. Le package de ceux qui veulent repartir parfaits.",
  },
]

const whyItems = [
  { title: 'Sans compromis', sub: "Coupe homme, dégradé, barbe — chaque prestation est réalisée avec le soin d'un vrai barbershop professionnel." },
  { title: 'Réservation en ligne', sub: "Réservez votre coupe ou votre soin barbe à Montpellier en 2 minutes, sans appel, 24h/24." },
  { title: 'Cœur de ville', sub: "18 rue d'Alger, Saint-Roch, Montpellier. À deux pas du tram, au centre de tout." },
  { title: 'Expertise & savoir-faire', sub: "15 ans de métier, des techniques maîtrisées et un œil affûté pour sublimer chaque profil." },
]

const galleryPhotos = [
  { url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=700&h=460&q=80', alt: 'Intérieur barbershop' },
  { url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=700&h=460&q=80', alt: 'Barber au travail' },
  { url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=700&h=460&q=80', alt: 'Coupe précise' },
  { url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=700&h=460&q=80', alt: 'Finition dégradé' },
  { url: 'https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?auto=format&fit=crop&w=700&h=460&q=80', alt: 'Soin barbe' },
  { url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=700&h=460&q=80', alt: 'Ambiance salon' },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  const formRef = useRef<HTMLFormElement>(null)

  async function handleContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const prenom  = (fd.get('prenom')  as string).trim()
    const nom     = (fd.get('nom')     as string).trim()
    const email   = (fd.get('email')   as string).trim()
    const tel     = (fd.get('telephone') as string).trim()
    const message = (fd.get('message') as string).trim()
    if (!prenom || !email || !message) return
    setContactStatus('sending')
    try {
      await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
        title:      'Message via site — PHENO&CO',
        to_name:    'Manager PHENO&CO',
        to_email:   ADMIN_EMAIL,
        name:       `${prenom} ${nom}`.trim(),
        message:    `De : ${prenom} ${nom}\nEmail : ${email}\nTél : ${tel || 'Non renseigné'}\n\n${message}`,
        telephone:  tel || 'Non renseigné',
        commentaire: `Contact site web`,
        calendar_link: '',
      })
      setContactStatus('ok')
      formRef.current?.reset()
    } catch {
      setContactStatus('err')
    }
  }

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) }
      }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <div className="lp">

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-left">
          <button className="lp-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
          <span className="lp-nav-brand">PHENO&amp;CO</span>
        </div>
        <div className="lp-nav-right">
          <a href="tel:0769432605" className="lp-nav-tel" aria-label="Appeler">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 12 19.79 19.79 0 0 1 1.06 3.4 2 2 0 0 1 3.04 1.4h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91A16 16 0 0 0 13 15.83l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </a>
          <Link href="/rdv" className="lp-btn-reserve">RÉSERVER</Link>
        </div>
      </nav>

      {/* ── DROPDOWN ── */}
      {menuOpen && (
        <div className="lp-dropdown open" onClick={() => setMenuOpen(false)}>
          <Link href="/rdv"      className="lp-dd-item">Prendre rendez-vous</Link>
          <a href="#services"    className="lp-dd-item">Nos prestations</a>
          <a href="#galerie"     className="lp-dd-item">Réalisations</a>
          <Link href="/location" className="lp-dd-item">Louer un fauteuil</Link>
          <a href="#contact"     className="lp-dd-item">Nous trouver</a>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="lp-hero">
        <Image
          src="/logo-pheno.png"
          alt="PHENO&CO Barbershop"
          width={280}
          height={100}
          className="lp-hero-logo"
          priority
        />
        <h1 className="lp-hero-tagline">
          Barbershop &amp; Coiffure<br />Afro · Montpellier
        </h1>
        <div className="lp-hero-sep">
          <div className="lp-hero-sep-line" />
          <div className="lp-hero-sep-dot" />
          <div className="lp-hero-sep-line" />
        </div>
        <div className="lp-hero-btns">
          <Link href="/rdv" className="lp-btn-gold">PRENDRE RENDEZ-VOUS</Link>
          <Link href="/location" className="lp-btn-outline">LOUER UN FAUTEUIL</Link>
        </div>
        <div className="lp-hero-eyebrow">18 rue d&apos;Alger · Saint-Roch · Montpellier</div>
        <div className="lp-hero-stats">
          <span><strong>1 200+</strong> clients</span>
          <span className="lp-hstat-dot">·</span>
          <span><strong>★ 5.0</strong> Google</span>
          <span className="lp-hstat-dot">·</span>
          <span><strong>15 ans</strong> d&apos;expérience</span>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="lp-section lp-section-center" id="services">
        <p className="lp-eyebrow" data-reveal>Nos prestations</p>
        <h2 className="lp-h2" data-reveal data-delay="1">Ce qu&apos;on fait,<br />on le fait bien</h2>
        <div className="lp-section-div" data-reveal data-delay="2" />
        <div className="lp-svcs-grid">
          {services.map((s, i) => (
            <div key={s.num} className="lp-svc-card" data-reveal data-delay={String(i + 1)}>
              <div className="lp-svc-num">{s.num}</div>
              <div className="lp-svc-title">{s.title}</div>
              <div className="lp-svc-sep" />
              <div className="lp-svc-price">{s.price}</div>
              <p className="lp-svc-desc">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="lp-svcs-cta" data-reveal data-delay="2">
          <Link href="/rdv" className="lp-btn-outline-sm">Réserver une prestation →</Link>
        </div>
      </section>

      {/* ── POURQUOI PHENO ── */}
      <section className="lp-why lp-section lp-section-center">
        <p className="lp-eyebrow" data-reveal>Pourquoi nous</p>
        <h2 className="lp-h2" data-reveal data-delay="1">Pourquoi PHENO&amp;CO ?</h2>
        <div className="lp-section-div" data-reveal data-delay="2" />
        <div className="lp-why-cols">
          {whyItems.map((item, i) => (
            <div key={item.title} className="lp-why-col" data-reveal data-delay={String(i + 1)}>
              <span className="lp-why-num">0{i + 1}</span>
              <span className="lp-why-title">{item.title}</span>
              <div className="lp-why-line" />
              <p className="lp-why-sub">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── GALERIE ── */}
      <section className="lp-section" id="galerie">
        <p className="lp-eyebrow" data-reveal>Réalisations</p>
        <h2 className="lp-h2" data-reveal data-delay="1">Nos coupes parlent</h2>
        <div className="lp-section-div" data-reveal data-delay="2" style={{ margin: '.6rem 0 2rem' }} />
        <div className="lp-gallery-grid">
          {galleryPhotos.map((photo, i) => (
            <div
              key={i}
              className="lp-gallery-photo"
              data-reveal="scale"
              data-delay={String((i % 3) + 1)}
              style={{ backgroundImage: `url(${photo.url})` }}
              role="img"
              aria-label={photo.alt}
            />
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta lp-section lp-section-center">
        <h2 className="lp-cta-h2" data-reveal>Prêt à vous<br />transformer&nbsp;?</h2>
        <p className="lp-cta-sub" data-reveal data-delay="1">
          Un créneau de libre, moins de 2 minutes.<br />
          Le reste, c&apos;est nous qui nous en occupons.
        </p>
        <Link href="/rdv" className="lp-btn-cta" data-reveal data-delay="2">RÉSERVER MAINTENANT →</Link>
        <a href="tel:0769432605" className="lp-cta-phone" data-reveal data-delay="3">Ou appelez-nous directement · 07 69 43 26 05</a>
      </section>

      {/* ── CONTACT ── */}
      <section className="lp-section" id="contact">
        <p className="lp-eyebrow" data-reveal>Nous trouver</p>
        <h2 className="lp-h2" data-reveal data-delay="1">Venez nous voir</h2>
        <div className="lp-section-div" data-reveal data-delay="2" style={{ margin: '.6rem 0 0' }} />
        <div className="lp-contact-info" data-reveal data-delay="1">
          <p className="lp-contact-addr">18 Rue d&apos;Alger</p>
          <p className="lp-contact-line">Montpellier 34000</p>
          <p className="lp-contact-line">Mar – Sam : 10h – 18h</p>
          <p className="lp-contact-line">
            <a href="tel:0769432605" className="lp-contact-link">07 69 43 26 05</a>
          </p>
          <p className="lp-contact-line">
            <a href="https://phenoandco.fr" target="_blank" rel="noopener noreferrer" className="lp-contact-link">phenoandco.fr</a>
          </p>
        </div>
        <div className="lp-map" data-reveal data-delay="2">
          <iframe
            src="https://maps.google.com/maps?q=18+Rue+d%27Alger+34000+Montpellier&t=&z=16&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="100%"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="PHENO&CO — 18 Rue d'Alger, Montpellier"
          />
        </div>
        <div className="lp-form-sep" data-reveal />
        <h3 className="lp-form-title" data-reveal data-delay="1">Nous écrire</h3>
        <form ref={formRef} onSubmit={handleContact} data-reveal data-delay="2">
          <div className="lp-form-row">
            <input type="text" name="prenom" placeholder="Votre prénom *" className="lp-finput" required />
            <input type="text" name="nom" placeholder="Votre nom" className="lp-finput" />
          </div>
          <div className="lp-form-row">
            <input type="email" name="email" placeholder="Votre email *" className="lp-finput" required />
            <input type="tel" name="telephone" placeholder="Votre téléphone" className="lp-finput" />
          </div>
          <textarea name="message" placeholder="Votre message… *" className="lp-ftextarea" rows={4} required />
          <button type="submit" className="lp-btn-submit" disabled={contactStatus === 'sending'}>
            {contactStatus === 'sending' ? 'Envoi…' : 'ENVOYER'}
          </button>
          {contactStatus === 'ok' && (
            <p style={{ color: '#C9A84C', marginTop: '.75rem', fontSize: '.88rem' }}>
              ✓ Message envoyé — nous vous répondrons rapidement.
            </p>
          )}
          {contactStatus === 'err' && (
            <p style={{ color: '#f87171', marginTop: '.75rem', fontSize: '.88rem' }}>
              ⚠ Erreur d&apos;envoi — écrivez-nous directement à <a href="mailto:location.phenoandco@gmail.com" style={{ color: '#f87171' }}>location.phenoandco@gmail.com</a>
            </p>
          )}
        </form>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-main">
          <div>
            <span className="lp-footer-brand-name">PHENO<span>&amp;CO</span></span>
            <p className="lp-footer-brand-sub">Barbershop &amp; Coiffure Afro · Montpellier</p>
          </div>
          <nav className="lp-footer-nav" aria-label="Footer">
            <a href="#">Accueil</a>
            <a href="#services">Prestations</a>
            <Link href="/rdv">Réservation</Link>
            <Link href="/location">Location fauteuil</Link>
            <a href="#contact">Contact</a>
          </nav>
          <div className="lp-footer-right">
            <p className="lp-footer-addr">18 Rue d&apos;Alger · 34000 Montpellier</p>
            <p className="lp-footer-hours">Mar – Sam · 10h–18h</p>
            <div className="lp-footer-social">
              <a href="https://www.instagram.com/pheno_barber/" target="_blank" rel="noopener noreferrer" className="lp-social-icon" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a href="https://www.tiktok.com/@pheno_barber" target="_blank" rel="noopener noreferrer" className="lp-social-icon" aria-label="TikTok">
                <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="lp-footer-bar">
          <span>© 2026 PHENO&amp;CO — Montpellier</span>
          <div className="lp-footer-bar-links">
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/admin" className="lp-admin-link">Admin</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
