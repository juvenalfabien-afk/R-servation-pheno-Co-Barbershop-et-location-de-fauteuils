import type { FormulaType, PackType, PricingResult } from './types'

const SHORT_RATES: Partial<Record<FormulaType, number>> = {
  horaire: 10,
  'demi-journee': 35,
  journee: 65,
}

const LONG_RATES: Partial<Record<FormulaType, number>> = {
  semaine: 60,
  mois: 55,
}

const PACK_RATES: Record<PackType, number> = {
  aucun: 0,
  essentiel: 20,
  premium: 30,
}

function daysBetween(d1: string, d2: string): number {
  const diff = new Date(d2).getTime() - new Date(d1).getTime()
  return Math.max(1, Math.round(diff / 86400000) + 1)
}

function hoursBetween(h1: string, h2: string): number {
  const [ah, am] = h1.split(':').map(Number)
  const [bh, bm] = h2.split(':').map(Number)
  return Math.max(0.5, (bh * 60 + bm - ah * 60 - am) / 60)
}

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

export function calculatePrice(
  formule: FormulaType,
  pack: PackType,
  dateDebut: string,
  dateFin?: string,
  heureDebut?: string,
  heureFin?: string,
): PricingResult | null {
  if (!dateDebut) return null

  const isLong = formule === 'semaine' || formule === 'mois'
  let baseHT = 0
  let nbJours = 1

  if (formule === 'horaire') {
    if (!heureDebut || !heureFin) return null
    baseHT = hoursBetween(heureDebut, heureFin) * SHORT_RATES.horaire!
  } else if (!isLong) {
    baseHT = SHORT_RATES[formule] ?? 0
  } else {
    if (!dateFin) return null
    nbJours = daysBetween(dateDebut, dateFin)
    baseHT = nbJours * (LONG_RATES[formule] ?? 0)
  }

  const packMultiplier = formule === 'horaire' ? 1 : isLong ? nbJours : 1
  const totalHT = baseHT + packMultiplier * PACK_RATES[pack]
  const tva = totalHT * 0.2
  const totalTTC = totalHT * 1.2
  const acompte = totalTTC * (isLong ? 0.25 : 0.5)

  return { totalHT: r2(totalHT), tva: r2(tva), totalTTC: r2(totalTTC), acompte: r2(acompte), nbJours }
}
