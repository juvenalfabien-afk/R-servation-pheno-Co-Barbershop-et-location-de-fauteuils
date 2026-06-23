'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { calculatePrice } from '@/lib/pricing'
import { fmt, formatPhone } from '@/lib/utils'
import {
  FORMULES_COURT, FORMULES_LONG, PACKS, SPECIALITES,
  FORMULE_LABELS, PACK_LABELS, TIME_SLOTS,
} from '@/lib/constants'
import type {
  FormulaType, PackType, StatutPro, ExperienceType,
  SpecialiteType, Reservation,
} from '@/lib/types'

function SuccessPage({ reservation }: { reservation: Reservation }) {
  return (
    <div className="success-wrap">
      <div className="success-icon">✓</div>
      <h1>Demande envoyée !</h1>
      <p>
        Votre demande a été enregistrée. Nous vous contacterons sous 24h pour confirmer
        et vous envoyer le lien de paiement de l&apos;acompte.
      </p>
      <div className="success-recap">
        <div className="recap-row">
          <span className="r-label">Référence</span>
          <span className="r-value recap-ref">{reservation.id}</span>
        </div>
        <div className="recap-row">
          <span className="r-label">Formule</span>
          <span className="r-value">{FORMULE_LABELS[reservation.formule]}</span>
        </div>
        <div className="recap-row">
          <span className="r-label">Pack</span>
          <span className="r-value">{PACK_LABELS[reservation.pack]}</span>
        </div>
        <div className="recap-row">
          <span className="r-label">Date</span>
          <span className="r-value">
            {reservation.dateDebut}{reservation.dateFin ? ` → ${reservation.dateFin}` : ''}
          </span>
        </div>
        <div className="recap-row">
          <span className="r-label">Total TTC</span>
          <span className="r-value r-value--yellow">{fmt(reservation.totalTTC)}</span>
        </div>
        <div className="recap-row">
          <span className="r-label">Acompte à régler</span>
          <span className="r-value r-value--success">{fmt(reservation.acompte)}</span>
        </div>
      </div>
      <div className="success-actions">
        <a
          href="https://wa.me/message/MZYDVEN32I55L1"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-wa"
        >
          💬 Nous contacter sur WhatsApp
        </a>
        <button className="btn btn-ghost" onClick={() => window.location.reload()}>
          Nouvelle réservation
        </button>
      </div>
    </div>
  )
}

export default function ReservationForm() {
  const [typeDuration, setTypeDuration] = useState<'court' | 'long'>('court')
  const [formule, setFormule]           = useState<FormulaType>('journee')
  const [pack, setPack]                 = useState<PackType>('aucun')
  const [dateDebut, setDateDebut]       = useState('')
  const [dateFin, setDateFin]           = useState('')
  const [heureDebut, setHeureDebut]     = useState('')
  const [heureFin, setHeureFin]         = useState('')
  const [nom, setNom]                   = useState('')
  const [email, setEmail]               = useState('')
  const [telephone, setTelephone]       = useState('')
  const [statutPro, setStatutPro]       = useState<StatutPro>('auto-entrepreneur')
  const [experience, setExperience]     = useState<ExperienceType>('3-5')
  const [specialites, setSpecialites]   = useState<SpecialiteType[]>([])
  const [notes, setNotes]               = useState('')
  const [acceptExp, setAcceptExp]       = useState(false)
  const [acceptDiplome, setAcceptDiplome] = useState(false)
  const [acceptDocs, setAcceptDocs]     = useState(false)
  const [acceptCGV, setAcceptCGV]       = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [submitError, setSubmitError]   = useState<string | null>(null)
  const [done, setDone]                 = useState<Reservation | null>(null)
  const [errors, setErrors]             = useState<Record<string, string>>({})

  const today = new Date().toISOString().split('T')[0]
  const isLong = typeDuration === 'long'

  function switchType(t: 'court' | 'long') {
    setTypeDuration(t)
    setFormule(t === 'court' ? 'journee' : 'semaine')
    setDateFin('')
    setHeureDebut('')
    setHeureFin('')
  }

  function toggleSpec(s: SpecialiteType) {
    setSpecialites(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s],
    )
  }

  const pricing = useMemo(
    () => calculatePrice(formule, pack, dateDebut, dateFin, heureDebut, heureFin),
    [formule, pack, dateDebut, dateFin, heureDebut, heureFin],
  )

  const validate = useCallback((): Record<string, string> => {
    const e: Record<string, string> = {}
    if (!nom.trim()) e.nom = 'Nom requis'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email invalide'
    if (!telephone.trim()) e.telephone = 'Téléphone requis'
    if (!dateDebut) e.dateDebut = 'Date requise'
    if (isLong && !dateFin) e.dateFin = 'Date de fin requise'
    if (isLong && dateFin && dateFin <= dateDebut) e.dateFin = 'La date de fin doit être après le début'
    if (formule === 'horaire') {
      if (!heureDebut) e.heureDebut = 'Heure de début requise'
      if (!heureFin) e.heureFin = 'Heure de fin requise'
      if (heureDebut && heureFin && heureDebut >= heureFin) e.heureFin = "L'heure de fin doit être après le début"
    }
    if (specialites.length === 0) e.specialites = 'Sélectionnez au moins une spécialité'
    if (!acceptDocs) e.acceptDocs = 'Requis'
    if (!acceptCGV) e.acceptCGV = 'Vous devez accepter les CGV'
    return e
  }, [nom, email, telephone, dateDebut, dateFin, isLong, formule, heureDebut, heureFin, specialites, acceptDocs, acceptCGV])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      const firstKey = Object.keys(errs)[0]
      document.getElementById(firstKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!pricing) return
    setSubmitting(true)
    setSubmitError(null)
    setErrors({})

    const reservation: Reservation = {
      id: `PHENO-${Date.now()}`,
      createdAt: new Date().toISOString(),
      nom: nom.trim(),
      email: email.trim(),
      telephone: telephone.trim(),
      typeDuration,
      formule,
      pack,
      dateDebut,
      dateFin: isLong ? dateFin : undefined,
      heureDebut: formule === 'horaire' ? heureDebut : undefined,
      heureFin: formule === 'horaire' ? heureFin : undefined,
      statutPro,
      experience,
      specialites,
      totalHT: pricing.totalHT,
      tva: pricing.tva,
      totalTTC: pricing.totalTTC,
      acompte: pricing.acompte,
      status: 'pending',
      notes: notes.trim() || undefined,
    }

    try {
      const saveRes = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservation),
      })
      if (!saveRes.ok) throw new Error('server')
    } catch {
      setSubmitError('Une erreur est survenue lors de l\'envoi. Veuillez réessayer ou nous contacter par WhatsApp.')
      setSubmitting(false)
      return
    }

    try {
      const key = process.env.NEXT_PUBLIC_EMAILJS_KEY
      if (key) {
        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: 'service_llizndy',
            template_id: 'template_m6uvyuq',
            user_id: key,
            template_params: {
              client_name:    reservation.nom,
              client_email:   reservation.email,
              client_phone:   reservation.telephone,
              formule:        FORMULE_LABELS[reservation.formule],
              pack:           PACK_LABELS[reservation.pack],
              date_debut:     reservation.dateDebut,
              date_fin:       reservation.dateFin ?? 'N/A',
              total_ttc:      fmt(reservation.totalTTC),
              acompte:        fmt(reservation.acompte),
              reservation_id: reservation.id,
            },
          }),
        })
      }
    } catch { /* email non critique */ }

    setSubmitting(false)
    setDone(reservation)
  }

  if (done) {
    return (
      <>
        <SuccessPage reservation={done} />
        <footer className="site-footer">
          <p>PHENO&CO — Barbershop &amp; Coworking · Montpellier</p>
          <p>
            <Link href="/cgv-location">CGV &amp; Contrat de location</Link>
            {' · '}
            <a href="mailto:location.phenoandco@gmail.com">location.phenoandco@gmail.com</a>
          </p>
        </footer>
      </>
    )
  }

  const currentFormules = isLong ? FORMULES_LONG : FORMULES_COURT

  return (
    <>
      <div className="page-wrap" id="reservation">

        {/* ── FORMULAIRE ── */}
        <form className="form-col" onSubmit={handleSubmit} noValidate>

          {/* Type de location */}
          <div className="card">
            <div className="card-title"><span className="card-icon">🗓</span> Type de location</div>
            <div className="type-grid">
              {([
                { id: 'court' as const, label: 'Courte durée', desc: 'Heure, demi-journée ou journée complète' },
                { id: 'long'  as const, label: 'Longue durée', desc: 'À la semaine ou au mois' },
              ]).map(opt => (
                <label key={opt.id} className={`type-card${typeDuration === opt.id ? ' selected' : ''}`}>
                  <input
                    type="radio"
                    name="type"
                    value={opt.id}
                    checked={typeDuration === opt.id}
                    onChange={() => switchType(opt.id)}
                  />
                  <span className="type-card-header">
                    <span className="type-card-dot" />
                    <span className="type-card-label">{opt.label}</span>
                  </span>
                  <span className="type-card-desc">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Formule */}
          <div className="card" id="formule">
            <div className="card-title"><span className="card-icon">💈</span> Formule</div>
            <div className={`option-grid ${isLong ? 'option-grid-2' : 'option-grid-3'}`}>
              {currentFormules.map(f => (
                <label key={f.id} className={`option-card${formule === f.id ? ' selected' : ''}`}>
                  <input type="radio" name="formule" value={f.id} checked={formule === f.id} onChange={() => setFormule(f.id)} />
                  <span className="option-card-label">{f.label}</span>
                  <span className="option-card-desc">{f.desc}</span>
                  <span className="option-card-price">{f.price}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pack matériel */}
          <div className="card">
            <div className="card-title"><span className="card-icon">🧰</span> Pack matériel</div>
            <div className="option-grid option-grid-3">
              {PACKS.map(p => (
                <label key={p.id} className={`option-card${pack === p.id ? ' selected' : ''}`}>
                  <input type="radio" name="pack" value={p.id} checked={pack === p.id} onChange={() => setPack(p.id)} />
                  <span className="option-card-label">{p.label}</span>
                  <span className="option-card-desc">{p.desc}</span>
                  <span className="option-card-price">{p.price}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dates & horaires */}
          <div className="card" id="dateDebut">
            <div className="card-title">
              <span className="card-icon">📆</span>
              {isLong ? 'Période de location' : formule === 'horaire' ? 'Date & horaires' : 'Date'}
            </div>
            {isLong ? (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date de début *</label>
                  <input
                    type="date"
                    className={`form-input${errors.dateDebut ? ' error' : ''}`}
                    min={today}
                    value={dateDebut}
                    onChange={e => setDateDebut(e.target.value)}
                  />
                  {errors.dateDebut && <p className="form-error">⚠ {errors.dateDebut}</p>}
                </div>
                <div className="form-group" id="dateFin">
                  <label className="form-label">Date de fin *</label>
                  <input
                    type="date"
                    className={`form-input${errors.dateFin ? ' error' : ''}`}
                    min={dateDebut || today}
                    value={dateFin}
                    onChange={e => setDateFin(e.target.value)}
                  />
                  {errors.dateFin && <p className="form-error">⚠ {errors.dateFin}</p>}
                </div>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className={`form-input${errors.dateDebut ? ' error' : ''}`}
                    min={today}
                    value={dateDebut}
                    onChange={e => setDateDebut(e.target.value)}
                  />
                  {errors.dateDebut && <p className="form-error">⚠ {errors.dateDebut}</p>}
                </div>
                {formule === 'horaire' && (
                  <div className="form-row" id="heureDebut">
                    <div className="form-group">
                      <label className="form-label">Heure de début *</label>
                      <select
                        className={`form-select${errors.heureDebut ? ' error' : ''}`}
                        value={heureDebut}
                        onChange={e => setHeureDebut(e.target.value)}
                      >
                        <option value="">— Choisir —</option>
                        {TIME_SLOTS.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {errors.heureDebut && <p className="form-error">⚠ {errors.heureDebut}</p>}
                    </div>
                    <div className="form-group" id="heureFin">
                      <label className="form-label">Heure de fin *</label>
                      <select
                        className={`form-select${errors.heureFin ? ' error' : ''}`}
                        value={heureFin}
                        onChange={e => setHeureFin(e.target.value)}
                      >
                        <option value="">— Choisir —</option>
                        {TIME_SLOTS.slice(1).map(t => (
                          <option key={t} value={t} disabled={!!heureDebut && t <= heureDebut}>{t}</option>
                        ))}
                      </select>
                      {errors.heureFin && <p className="form-error">⚠ {errors.heureFin}</p>}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Coordonnées */}
          <div className="card" id="nom">
            <div className="card-title"><span className="card-icon">👤</span> Vos coordonnées</div>
            <div className="form-group">
              <label className="form-label">Nom complet *</label>
              <input
                type="text"
                className={`form-input${errors.nom ? ' error' : ''}`}
                placeholder="Prénom Nom"
                value={nom}
                onChange={e => setNom(e.target.value)}
              />
              {errors.nom && <p className="form-error">⚠ {errors.nom}</p>}
            </div>
            <div className="form-row">
              <div className="form-group" id="email">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className={`form-input${errors.email ? ' error' : ''}`}
                  placeholder="vous@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                {errors.email && <p className="form-error">⚠ {errors.email}</p>}
              </div>
              <div className="form-group" id="telephone">
                <label className="form-label">Téléphone *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  className={`form-input${errors.telephone ? ' error' : ''}`}
                  placeholder="06 12 34 56 78"
                  value={telephone}
                  onChange={e => setTelephone(formatPhone(e.target.value))}
                  maxLength={14}
                />
                {errors.telephone && <p className="form-error">⚠ {errors.telephone}</p>}
              </div>
            </div>
          </div>

          {/* Profil professionnel */}
          <div className="card">
            <div className="card-title"><span className="card-icon">💼</span> Profil professionnel</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Statut juridique</label>
                <select
                  className="form-select"
                  value={statutPro}
                  onChange={e => setStatutPro(e.target.value as StatutPro)}
                >
                  <option value="auto-entrepreneur">Auto-entrepreneur</option>
                  <option value="societe">Société</option>
                  <option value="en-cours">En cours de création</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Années d&apos;expérience</label>
                <select
                  className="form-select"
                  value={experience}
                  onChange={e => setExperience(e.target.value as ExperienceType)}
                >
                  <option value="0-3">Moins de 3 ans</option>
                  <option value="3-5">3 à 5 ans</option>
                  <option value="5-10">5 à 10 ans</option>
                  <option value="10+">Plus de 10 ans</option>
                </select>
              </div>
            </div>
            <div className="form-group" id="specialites">
              <label className="form-label">
                Spécialités *
                {errors.specialites && <span className="label-error">— {errors.specialites}</span>}
              </label>
              <div className="chips-grid">
                {SPECIALITES.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className={`chip${specialites.includes(s.id) ? ' selected' : ''}`}
                    onClick={() => toggleSpec(s.id)}
                  >
                    {specialites.includes(s.id) ? '✓ ' : ''}{s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="card-title"><span className="card-icon">📝</span> Notes &amp; demandes particulières</div>
            <div className="form-group">
              <textarea
                className="form-textarea"
                placeholder="Précisez vos besoins spécifiques, équipements souhaités, etc."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Engagements & CGV */}
          <div className="card" id="acceptExp">
            <div className="card-title"><span className="card-icon">📋</span> Engagements &amp; CGV</div>
            <div className="engagement-list">
              <label className={`engagement-item${acceptExp ? ' checked' : ''}`}>
                <input type="checkbox" checked={acceptExp} onChange={() => setAcceptExp(v => !v)} />
                <span className="engagement-box-check">{acceptExp && '✓'}</span>
                <span className="engagement-text">Je certifie avoir au moins 3 ans d&apos;expérience professionnelle en coiffure / barbier.</span>
              </label>
              <label className={`engagement-item${acceptDiplome ? ' checked' : ''}`} id="acceptDiplome">
                <input type="checkbox" checked={acceptDiplome} onChange={() => setAcceptDiplome(v => !v)} />
                <span className="engagement-box-check">{acceptDiplome && '✓'}</span>
                <span className="engagement-text">Je suis titulaire d&apos;un CAP/BP Coiffure ou d&apos;un diplôme équivalent.</span>
              </label>
              <label className={`engagement-item${acceptDocs ? ' checked' : ''}${errors.acceptDocs ? ' invalid' : ''}`} id="acceptDocs">
                <input type="checkbox" checked={acceptDocs} onChange={() => setAcceptDocs(v => !v)} />
                <span className="engagement-box-check">{acceptDocs && '✓'}</span>
                <span className="engagement-text">Je fournirai mes justificatifs (assurance RC, SIRET/Kbis) avant la première location.</span>
              </label>
              <label className={`engagement-item${acceptCGV ? ' checked' : ''}${errors.acceptCGV ? ' invalid' : ''}`} id="acceptCGV">
                <input type="checkbox" checked={acceptCGV} onChange={() => setAcceptCGV(v => !v)} />
                <span className="engagement-box-check">{acceptCGV && '✓'}</span>
                <span className="engagement-text">
                  J&apos;ai lu et j&apos;accepte les{' '}
                  <Link href="/cgv-location" target="_blank" className="link-yellow link-underline">
                    Conditions Générales de Vente
                  </Link>{' '}
                  et le Contrat de Location PHENO&CO.
                </span>
              </label>
            </div>
          </div>

          {/* Envoi */}
          <div className="form-submit-wrap">
            {Object.keys(errors).length > 0 && (
              <div className="form-error-banner">
                ⚠ Veuillez corriger les erreurs ci-dessus avant d&apos;envoyer.
              </div>
            )}
            {submitError && (
              <div className="form-error-banner">
                ⚠ {submitError}
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={submitting}>
              {submitting
                ? <><span className="spinner" /> Envoi en cours…</>
                : 'Envoyer ma demande de réservation'}
            </button>
            <p className="form-submit-hint">
              Pas de paiement maintenant — vous recevrez un lien d&apos;acompte après confirmation.
            </p>
          </div>
        </form>

        {/* ── RÉCAPITULATIF ── */}
        <aside className="summary-col">
          <div className="summary-card">
            <div className="summary-header"><h3>💰 Récapitulatif</h3></div>
            {pricing ? (
              <div className="summary-body">
                <div className="summary-row">
                  <span className="s-label">Formule</span>
                  <span className="s-value">{FORMULE_LABELS[formule]}</span>
                </div>
                {isLong && pricing.nbJours > 1 && (
                  <div className="summary-row">
                    <span className="s-label">Durée</span>
                    <span className="s-value">{pricing.nbJours} jour{pricing.nbJours > 1 ? 's' : ''}</span>
                  </div>
                )}
                {pack !== 'aucun' && (
                  <div className="summary-row">
                    <span className="s-label">Pack {pack}</span>
                    <span className="s-value">inclus</span>
                  </div>
                )}
                <hr className="summary-divider" />
                <div className="summary-row">
                  <span className="s-label">Sous-total HT</span>
                  <span className="s-value">{fmt(pricing.totalHT)}</span>
                </div>
                <div className="summary-row">
                  <span className="s-label">TVA (20%)</span>
                  <span className="s-value">{fmt(pricing.tva)}</span>
                </div>
                <hr className="summary-divider" />
                <div className="summary-total">
                  <span className="s-label">Total TTC</span>
                  <span className="s-value">{fmt(pricing.totalTTC)}</span>
                </div>
                <div className="summary-deposit">
                  <div className="summary-row">
                    <span className="s-label">Acompte ({isLong ? '25%' : '50%'})</span>
                    <span className="summary-acompte-value">{fmt(pricing.acompte)}</span>
                  </div>
                  <p className="summary-solde">
                    Solde de {fmt(pricing.totalTTC - pricing.acompte)} à régler sur place.
                  </p>
                </div>
              </div>
            ) : (
              <div className="summary-empty">
                Sélectionnez une formule et une date pour voir le tarif.
              </div>
            )}
          </div>

          <div className="card summary-sidebar-card">
            <p className="contact-info">
              <strong>Besoin d&apos;infos ?</strong><br />
              <a href="mailto:location.phenoandco@gmail.com">location.phenoandco@gmail.com</a><br />
              <a href="https://wa.me/message/MZYDVEN32I55L1" target="_blank" rel="noopener noreferrer">WhatsApp →</a>
            </p>
          </div>
        </aside>
      </div>

      <section className="about-section">
        <h2>PHENO&CO</h2>
        <p>
          Barbershop implanté à Montpellier depuis 2009, PHENO&CO propose la location de fauteuil
          à des professionnels indépendants. Travaillez dans un espace premium au cœur d&apos;une clientèle
          fidèle. Formules flexibles : à l&apos;heure, à la journée ou au mois.
        </p>
      </section>

      <footer className="site-footer">
        <p>PHENO&CO — Barbershop &amp; Coworking · Montpellier</p>
        <p>
          <Link href="/cgv-location">CGV &amp; Contrat de location</Link>
          {' · '}
          <a href="mailto:location.phenoandco@gmail.com">location.phenoandco@gmail.com</a>
          {' · '}
          <Link href="/admin" className="link-muted">Admin</Link>
        </p>
      </footer>
    </>
  )
}
