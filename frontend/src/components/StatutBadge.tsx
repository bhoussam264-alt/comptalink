/**
 * COMPTALINK - Badge de statut de facture
 */
import type { Statut } from '../types';
import { couleurStatut } from '../lib/format';

export function StatutBadge({ statut }: { statut: Statut }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
        couleurStatut[statut] ?? 'bg-gray-100 text-gray-600 border-gray-200'
      }`}
    >
      {statut}
    </span>
  );
}
