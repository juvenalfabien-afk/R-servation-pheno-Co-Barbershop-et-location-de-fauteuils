import type { FormulaType, PackType, SpecialiteType } from './types'

export const FORMULES_COURT = [
  { id: 'horaire' as FormulaType,      label: "À l'heure",    desc: 'Tarif horaire',    price: '10 €/h HT' },
  { id: 'demi-journee' as FormulaType, label: 'Demi-journée', desc: '4 heures',          price: '35 € HT'   },
  { id: 'journee' as FormulaType,      label: 'Journée',      desc: '8 heures',          price: '65 € HT'   },
]

export const FORMULES_LONG = [
  { id: 'semaine' as FormulaType, label: 'À la semaine', desc: 'Durée hebdomadaire', price: '60 €/j HT' },
  { id: 'mois' as FormulaType,    label: 'Au mois',      desc: 'Durée mensuelle',    price: '55 €/j HT' },
]

export const PACKS = [
  { id: 'aucun' as PackType,    label: 'Fauteuil seul', desc: 'Espace de travail uniquement',  price: 'Inclus'     },
  { id: 'essentiel' as PackType, label: 'Essentiel',   desc: 'Tondeuses + outils de finition', price: '+20 €/j HT' },
  { id: 'premium' as PackType,   label: 'Premium',     desc: 'Essentiel + rasoir',             price: '+30 €/j HT' },
]

export const SPECIALITES: { id: SpecialiteType; label: string }[] = [
  { id: 'mixte',     label: 'Mixte'      },
  { id: 'barber',    label: 'Barber'     },
  { id: 'afro',      label: 'Afro'       },
  { id: 'coloriste', label: 'Coloriste'  },
  { id: 'design',    label: 'Design'     },
]

export const FORMULE_LABELS: Record<FormulaType, string> = {
  horaire:       "À l'heure",
  'demi-journee': 'Demi-journée',
  journee:       'Journée complète',
  semaine:       'À la semaine',
  mois:          'Au mois',
}

export const PACK_LABELS: Record<PackType, string> = {
  aucun:     'Fauteuil seul',
  essentiel: 'Pack Essentiel',
  premium:   'Pack Premium',
}

export const TIME_SLOTS: string[] = (() => {
  const slots: string[] = []
  for (let h = 9; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 20) slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
})()
