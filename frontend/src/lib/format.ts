/**
 * COMPTALINK - Utilitaires de formatage (devise MAD, dates, statuts)
 */
import type { NiveauAlerte, Statut, TypeAlerte } from '../types';

/** Formate un montant en dirhams marocains */
export function formaterMontant(valeur: number | string | null | undefined): string {
  const nombre = Number(valeur ?? 0);
  return `${nombre.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MAD`;
}

/** Formate une date ISO en jj/mm/aaaa */
export function formaterDate(valeur: string | null | undefined): string {
  if (!valeur) return '—';
  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Formate une date ISO en jj/mm/aaaa à hh:mm */
export function formaterDateHeure(valeur: string | null | undefined): string {
  if (!valeur) return '—';
  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Nombre de jours restants avant une échéance (négatif si dépassée) */
export function joursRestants(dateEcheance: string): number {
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const echeance = new Date(dateEcheance);
  echeance.setHours(0, 0, 0, 0);
  return Math.round((echeance.getTime() - aujourdhui.getTime()) / 86400000);
}

/** Classes Tailwind associées à chaque statut de facture */
export const couleurStatut: Record<Statut, string> = {
  Reçue: 'bg-slate-100 text-slate-700 border-slate-200',
  'À vérifier': 'bg-yellow-50 text-yellow-800 border-yellow-200',
  'En validation': 'bg-orange-50 text-orange-800 border-orange-200',
  Validée: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Prête pour Sage': 'bg-blue-50 text-blue-700 border-blue-200',
  Archivée: 'bg-gray-100 text-gray-600 border-gray-200',
};

/** Couleur de la pastille du graphique par statut */
export const couleurGraphiqueStatut: Record<Statut, string> = {
  Reçue: '#94A3B8',
  'À vérifier': '#F1C40F',
  'En validation': '#F18F01',
  Validée: '#2E9E6B',
  'Prête pour Sage': '#2E86AB',
  Archivée: '#6B7280',
};

/** Ordre officiel du cycle de vie COMPTALINK */
export const CYCLE_STATUTS: Statut[] = [
  'Reçue',
  'À vérifier',
  'En validation',
  'Validée',
  'Prête pour Sage',
  'Archivée',
];

/** Couleurs des alertes de contrôle selon leur niveau de risque */
export const styleNiveauAlerte: Record<NiveauAlerte, { conteneur: string; icone: string }> = {
  rouge: { conteneur: 'border-red-200 bg-red-50 text-red-800', icone: 'text-red-500' },
  orange: { conteneur: 'border-orange-200 bg-orange-50 text-orange-800', icone: 'text-orange-500' },
  jaune: { conteneur: 'border-yellow-200 bg-yellow-50 text-yellow-800', icone: 'text-yellow-500' },
};

/** Niveau de risque par type d'alerte */
export const niveauParTypeAlerte: Record<TypeAlerte, NiveauAlerte> = {
  'TVA incohérente': 'rouge',
  Doublon: 'orange',
  'Champ manquant': 'jaune',
};
