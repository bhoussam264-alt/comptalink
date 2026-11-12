/**
 * COMPTALINK - Écran 2 : Tableau de bord
 * 4 cartes de synthèse, répartition par statut, échéances proches et dernières actions.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, messageErreur } from '../lib/api';
import { StatutBadge } from '../components/StatutBadge';
import {
  couleurGraphiqueStatut,
  formaterDate,
  formaterDateHeure,
  formaterMontant,
  joursRestants,
} from '../lib/format';
import type { Dashboard as DonneesDashboard } from '../types';

/** Petite carte de statistique */
function Carte({
  titre,
  valeur,
  couleur,
  description,
}: {
  titre: string;
  valeur: number;
  couleur: string;
  description: string;
}) {
  return (
    <div className="cl-card p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gris">{titre}</p>
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: couleur }} />
      </div>
      <p className="mt-3 text-3xl font-bold text-nuit">{valeur}</p>
      <p className="mt-1 text-xs text-gris">{description}</p>
    </div>
  );
}

export default function Dashboard() {
  const [donnees, setDonnees] = useState<DonneesDashboard | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  /** Chargement des indicateurs via GET /api/dashboard */
  useEffect(() => {
    api
      .get<DonneesDashboard>('/dashboard')
      .then((reponse) => setDonnees(reponse.data))
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false));
  }, []);

  if (chargement) {
    return <p className="text-gris">Chargement du tableau de bord…</p>;
  }

  if (erreur) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {erreur}
      </div>
    );
  }

  if (!donnees) return null;

  const { cartes, par_statut, echeances_proches, dernieres_actions } = donnees;
  const maximum = Math.max(1, ...par_statut.map((element) => element.total));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-nuit">Tableau de bord</h1>
          <p className="text-sm text-gris">
            Vue d'ensemble du traitement des factures fournisseurs COMPTALINK
          </p>
        </div>
        <Link to="/factures/nouvelle" className="cl-btn-primary">
          + Importer une facture
        </Link>
      </div>

      {/* 4 cartes de synthèse */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Carte
          titre="Factures en attente"
          valeur={cartes.factures_en_attente}
          couleur="#2E86AB"
          description="Reçues, à vérifier ou en validation"
        />
        <Carte
          titre="Échéances proches"
          valeur={cartes.echeances_proches}
          couleur="#F18F01"
          description="À régler dans les 30 prochains jours"
        />
        <Carte
          titre="En retard"
          valeur={cartes.en_retard}
          couleur="#DC2626"
          description="Échéance dépassée, action requise"
        />
        <Carte
          titre="Validées ce mois"
          valeur={cartes.validees_ce_mois}
          couleur="#2E9E6B"
          description="Approuvées depuis le début du mois"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Graphique : factures par statut */}
        <section className="cl-card p-5 xl:col-span-1">
          <h2 className="text-lg font-semibold text-nuit">Factures par statut</h2>
          <p className="mb-4 text-xs text-gris">Répartition du portefeuille de factures</p>
          <div className="space-y-3">
            {par_statut.map((element) => (
              <div key={element.statut}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-nuit">{element.statut}</span>
                  <span className="text-gris">{element.total}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-grisclair">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(element.total / maximum) * 100}%`,
                      backgroundColor: couleurGraphiqueStatut[element.statut] ?? '#2E86AB',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Échéances proches */}
        <section className="cl-card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-nuit">Échéances proches</h2>
              <p className="text-xs text-gris">Factures à régler sous 30 jours</p>
            </div>
            <Link to="/factures" className="text-sm font-semibold text-bleu hover:underline">
              Voir toutes les factures
            </Link>
          </div>

          {echeances_proches.length === 0 ? (
            <p className="py-6 text-center text-sm text-gris">Aucune échéance dans les 30 jours.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="cl-table">
                <thead>
                  <tr>
                    <th>N° facture</th>
                    <th>Fournisseur</th>
                    <th>Échéance</th>
                    <th>Montant TTC</th>
                    <th>Statut</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {echeances_proches.map((facture) => {
                    const reste = joursRestants(facture.date_echeance);
                    return (
                      <tr key={facture.id}>
                        <td className="font-semibold text-nuit">{facture.numero}</td>
                        <td>{facture.fournisseur?.nom ?? '—'}</td>
                        <td>
                          {formaterDate(facture.date_echeance)}
                          <span
                            className={`ml-2 text-xs font-semibold ${
                              reste < 0 ? 'text-red-600' : reste <= 7 ? 'text-orange' : 'text-gris'
                            }`}
                          >
                            {reste < 0 ? `en retard de ${Math.abs(reste)} j` : `J-${reste}`}
                          </span>
                        </td>
                        <td>{formaterMontant(facture.montant_TTC)}</td>
                        <td>
                          <StatutBadge statut={facture.statut} />
                        </td>
                        <td>
                          <Link
                            to={`/factures/${facture.id}`}
                            className="text-sm font-semibold text-bleu hover:underline"
                          >
                            Ouvrir
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Dernières actions (piste d'audit) */}
      <section className="cl-card p-5">
        <h2 className="text-lg font-semibold text-nuit">Dernières actions</h2>
        <p className="mb-4 text-xs text-gris">Historique récent des décisions de validation</p>

        {dernieres_actions.length === 0 ? (
          <p className="py-6 text-center text-sm text-gris">Aucune action enregistrée.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {dernieres_actions.map((action) => (
              <li key={action.id} className="flex flex-wrap items-center gap-2 py-3 text-sm">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    action.decision === 'Approuvé'
                      ? 'bg-emerald-50 text-emerald-700'
                      : action.decision === 'Rejeté'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-yellow-50 text-yellow-800'
                  }`}
                >
                  {action.decision}
                </span>
                <span className="font-semibold text-nuit">
                  {action.facture?.numero ?? `Facture #${action.facture_id}`}
                </span>
                <span className="text-gris">
                  par {action.user?.name ?? `Utilisateur #${action.user_id}`}
                </span>
                {action.commentaire && (
                  <span className="text-gris">— « {action.commentaire} »</span>
                )}
                <span className="ml-auto text-xs text-gris">
                  {formaterDateHeure(action.date_validation)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
