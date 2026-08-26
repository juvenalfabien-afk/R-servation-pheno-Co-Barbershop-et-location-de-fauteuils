'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FullSchedule, ScheduleClosure, ScheduleBlock } from '@/lib/schedule-types'
import { ALL_SLOTS, DAY_LABELS } from '@/lib/schedule-types'

export default function ScheduleManager() {
  const [schedule, setSchedule] = useState<FullSchedule | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Local edits (before save)
  const [openDays, setOpenDays] = useState<number[]>([])
  const [slots, setSlots] = useState<string[]>([])

  // New closure form
  const [closDate, setClosDate] = useState('')
  const [closReason, setClosReason] = useState('')

  // New block form
  const [blkDate, setBlkDate] = useState('')
  const [blkSlot, setBlkSlot] = useState('')
  const [blkReason, setBlkReason] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/schedule')
    if (res.ok) {
      const data: FullSchedule = await res.json()
      setSchedule(data)
      setOpenDays(data.config.openDays)
      setSlots(data.config.slots)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function saveConfig() {
    setSaving(true)
    const res = await fetch('/api/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ openDays, slots }),
    })
    setSaving(false)
    if (res.ok) { showToast('Horaires sauvegardés ✓'); load() }
    else showToast('Erreur lors de la sauvegarde')
  }

  async function addClosure() {
    if (!closDate) return
    const res = await fetch('/api/schedule/closures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: closDate, reason: closReason }),
    })
    if (res.ok) { setClosDate(''); setClosReason(''); load(); showToast('Fermeture ajoutée ✓') }
  }

  async function deleteClosure(date: string) {
    await fetch(`/api/schedule/closures/${date}`, { method: 'DELETE' })
    load()
  }

  async function addBlock() {
    if (!blkDate || !blkSlot) return
    const res = await fetch('/api/schedule/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: blkDate, slot: blkSlot, reason: blkReason }),
    })
    if (res.ok) { setBlkDate(''); setBlkSlot(''); setBlkReason(''); load(); showToast('Créneau bloqué ✓') }
  }

  async function deleteBlock(id: string) {
    await fetch(`/api/schedule/blocks/${id}`, { method: 'DELETE' })
    load()
  }

  function toggleDay(d: number) {
    setOpenDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())
  }

  function toggleSlot(s: string) {
    setSlots(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s].sort())
  }

  const fmtDate = (d: string) => d.split('-').reverse().join('/')

  if (!schedule) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {toast && (
        <div className="toast show success" style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999 }}>
          <div className="toast-title">✓ {toast}</div>
        </div>
      )}

      {/* ── JOURS D'OUVERTURE ── */}
      <div className="res-card">
        <div className="res-head" style={{ marginBottom: '1rem' }}>
          <div className="res-name">Jours d&apos;ouverture</div>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {DAY_LABELS.map((label, i) => {
            const open = openDays.includes(i)
            return (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                style={{
                  padding: '.5rem .9rem',
                  borderRadius: 8,
                  border: `1.5px solid ${open ? 'var(--yellow)' : 'rgba(255,255,255,.12)'}`,
                  background: open ? 'rgba(253,224,71,.12)' : 'transparent',
                  color: open ? 'var(--yellow)' : 'rgba(255,255,255,.4)',
                  fontWeight: open ? 700 : 400,
                  cursor: 'pointer',
                  fontSize: '.85rem',
                  transition: 'all .15s',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
        <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.3)', margin: '0 0 1.25rem' }}>
          Les jours non cochés seront grisés dans le calendrier de réservation.
        </p>

        {/* ── CRÉNEAUX HORAIRES ── */}
        <div className="res-detail-label" style={{ marginBottom: '.6rem' }}>Créneaux disponibles</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: '.4rem', marginBottom: '1.25rem' }}>
          {ALL_SLOTS.map(s => {
            const active = slots.includes(s)
            return (
              <button
                key={s}
                onClick={() => toggleSlot(s)}
                style={{
                  padding: '.4rem .3rem',
                  borderRadius: 7,
                  border: `1.5px solid ${active ? 'var(--yellow)' : 'rgba(255,255,255,.1)'}`,
                  background: active ? 'rgba(253,224,71,.1)' : 'transparent',
                  color: active ? 'var(--yellow)' : 'rgba(255,255,255,.3)',
                  fontWeight: active ? 700 : 400,
                  cursor: 'pointer',
                  fontSize: '.8rem',
                  transition: 'all .15s',
                }}
              >
                {s}
              </button>
            )
          })}
        </div>

        <button
          className="btn btn-success btn-sm"
          onClick={saveConfig}
          disabled={saving}
          style={{ alignSelf: 'flex-start' }}
        >
          {saving ? 'Sauvegarde…' : '✓ Sauvegarder les horaires'}
        </button>
      </div>

      {/* ── FERMETURES EXCEPTIONNELLES ── */}
      <div className="res-card">
        <div className="res-head" style={{ marginBottom: '1rem' }}>
          <div className="res-name">Fermetures exceptionnelles</div>
        </div>
        <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.3)', margin: '0 0 1rem' }}>
          Vacances, jours fériés, congés… Le jour entier sera marqué indisponible.
        </p>

        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'flex-end' }}>
          <div>
            <div className="res-detail-label" style={{ marginBottom: '.3rem' }}>Date</div>
            <input
              type="date"
              className="form-input"
              style={{ width: 160 }}
              value={closDate}
              onChange={e => setClosDate(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div className="res-detail-label" style={{ marginBottom: '.3rem' }}>Motif (optionnel)</div>
            <input
              type="text"
              className="form-input"
              placeholder="Ex : Vacances"
              value={closReason}
              onChange={e => setClosReason(e.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={addClosure} disabled={!closDate}>+ Ajouter</button>
        </div>

        {schedule.closures.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,.25)', fontSize: '.83rem' }}>Aucune fermeture prévue.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            {schedule.closures.map((c: ScheduleClosure) => (
              <div key={c.date} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '.5rem .75rem', borderRadius: 8,
                background: 'rgba(255,100,100,.06)', border: '1px solid rgba(255,100,100,.15)',
              }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: '.85rem' }}>{fmtDate(c.date)}</span>
                  {c.reason && <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.78rem', marginLeft: '.5rem' }}>— {c.reason}</span>}
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteClosure(c.date)}
                  style={{ padding: '.25rem .6rem', fontSize: '.75rem' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── BLOQUER UN CRÉNEAU PRÉCIS ── */}
      <div className="res-card">
        <div className="res-head" style={{ marginBottom: '1rem' }}>
          <div className="res-name">Bloquer un créneau précis</div>
        </div>
        <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.3)', margin: '0 0 1rem' }}>
          Bloquer un seul horaire sur une date (rendez-vous perso, livraison…).
        </p>

        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'flex-end' }}>
          <div>
            <div className="res-detail-label" style={{ marginBottom: '.3rem' }}>Date</div>
            <input
              type="date"
              className="form-input"
              style={{ width: 160 }}
              value={blkDate}
              onChange={e => setBlkDate(e.target.value)}
            />
          </div>
          <div>
            <div className="res-detail-label" style={{ marginBottom: '.3rem' }}>Créneau</div>
            <select
              className="form-select"
              style={{ width: 110 }}
              value={blkSlot}
              onChange={e => setBlkSlot(e.target.value)}
            >
              <option value="">--</option>
              {ALL_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div className="res-detail-label" style={{ marginBottom: '.3rem' }}>Motif (optionnel)</div>
            <input
              type="text"
              className="form-input"
              placeholder="Ex : RDV perso"
              value={blkReason}
              onChange={e => setBlkReason(e.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={addBlock} disabled={!blkDate || !blkSlot}>+ Bloquer</button>
        </div>

        {schedule.blocks.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,.25)', fontSize: '.83rem' }}>Aucun créneau bloqué manuellement.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            {schedule.blocks.map((b: ScheduleBlock) => (
              <div key={b.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '.5rem .75rem', borderRadius: 8,
                background: 'rgba(253,224,71,.04)', border: '1px solid rgba(253,224,71,.12)',
              }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: '.85rem' }}>{fmtDate(b.date)}</span>
                  <span style={{ color: 'var(--yellow)', fontSize: '.85rem', margin: '0 .4rem' }}>à {b.slot}</span>
                  {b.reason && <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.78rem' }}>— {b.reason}</span>}
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteBlock(b.id)}
                  style={{ padding: '.25rem .6rem', fontSize: '.75rem' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
