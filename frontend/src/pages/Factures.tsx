/**
 * COMPTALINK - Écran 3 : Liste des factures (« Mes Factures »)
 * Centralisation : recherche, filtres par statut, import et transfert par e-mail (simulé).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, messageErreur } from '../lib/api';
import { StatutBadge } from '../components/StatutBadge';
import { CYCLE_STATUTS, formaterDate, formaterMontant, joursRestants } from '../lib/format';
import type { Facture, Statut } from '../types';

export default function Factures() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');
  const [statut, setStatut] = useState<Statut | ''>('');
  const [message, setMessage] = useState('');

  /** Récupération des factures depuis l'API Laravel (GET /api/factures) */
  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const reponse = await api.get<Facture[]>('/factures', {
        params: {
          recherche: recherche || undefined,
          statut: statut || undefined,
        },
      });
      setFactures(reponse.data);
      setErreur('');
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }, [recherche, statut]);

  // Rechargement automatique (léger anti-rebond sur la recherche)
  useEffect(() => {
    const minuteur = setTimeout(charger, 250);
    return () => clearTimeout(minuteur);
  }, [charger]);

  /** Simule la réception d'une facture par e-mail (POST /api/factures/{id}/transferer-email) */
  const transfererParEmail = async (facture: Facture) => {
    try {
      const reponse = await api.post<{ message: string }>(
        `/factures/${facture.id}/transferer-email`,
      );
      setMessage(reponse.data.message);
    } catch (e) {
      setErreur(messageErreur(e));
    }
  };

  /** Nombre d'alertes non ignorées pour une facture */
  const alertesActives = (facture: Facture) =>
    (facture.alertes ?? []).filter((alerte) => !alerte.ignoree).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-nuit">Mes Factures</h1>
          <p className="text-sm text-gris">
            Toutes vos factures fournisseurs centralisées, contrôlées et prêtes pour Sage
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/factures/nouvelle" className="cl-btn-primary">
            Importer PDF / Image
          </Link>
          <button
            type="button"
            className="cl-btn-ghost"
            onClick={() =>
              setMessage(
                "Transféré par e-mail (simulé) : les factures reçues à l'adresse factures@comptalink.ma sont déposées automatiquement dans cette liste.",
              )
            }
          >
            Transférer par Email
          </button>
        </div>
      </div>

      {/* Messages */}
      {erreur && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erreur}
        </div>
      )}
      {message && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-bleu/30 bg-bleu/5 px-4 py-3 text-sm text-nuit">
          <span>{message}</span>
          <button
            type="button"
            className="text-xs font-semibold text-bleu hover:underline"
            onClick={() => setMessage('')}
          >
            Fermer
          </button>
        </div>
      )}

      {/* Recherche et filtres */}
      <div className="cl-card flex flex-wrap items-center gap-3 p-4">
        <input
          className="cl-input sm:max-w-xs"
          placeholder="Rechercher par n° de facture ou fournisseur…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        <select
          className="cl-input sm:max-w-[220px]"
          value={statut}
          onChange={(e) => setStatut(e.target.value as Statut | '')}
        >
          <option value="">Tous les statuts</option>
          {CYCLE_STATUTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="ml-auto text-sm text-gris">
          {factures.length} facture{factures.length > 1 ? 's' : ''} affichée
          {factures.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Tableau des factures */}
      <div className="cl-card overflow-hidden">
        {chargement ? (
          <p className="p-6 text-sm text-gris">Chargement des factures…</p>
        ) : factures.length === 0 ? (
          <p className="p-6 text-sm text-gris">
            Aucune facture ne correspond à votre recherche.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="cl-table">
              <thead>
                <tr>
                  <th>N° facture</th>
                  <th>Fournisseur</th>
                  <th>Date</th>
                  <th>Échéance</th>
                  <th className="text-right">Montant TTC</th>
                  <th>Statut</th>
                  <th>Alertes</th>
                  <th>Responsable</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {factures.map((facture) => {
                  const reste = joursRestants(facture.date_echeance);
                  const alertes = alertesActives(facture);
                  return (
                    <tr key={facture.id}>
                      <td>
                        <Link
                          to={`/factures/${facture.id}`}
                          className="font-semibold text-bleu hover:underline"
                        >
                          {facture.numero}
                        </Link>
                        <p className="text-xs text-gris">Dossier #{facture.id}</p>
                      </td>
                      <td>{facture.fournisseur?.nom ?? '—'}</td>
                      <td>{formaterDate(facture.date_facture)}</td>
                      <td>
                        {formaterDate(facture.date_echeance)}
                        {reste < 0 && (
                          <span className="ml-2 text-xs font-semibold text-red-600">
                            en retard
                          </span>
                        )}
                      </td>
                      <td className="text-right font-semibold text-nuit">
                        {formaterMontant(facture.montant_TTC)}
                      </td>
                      <td>
                        <StatutBadge statut={facture.statut} />
                      </td>
                      <td>
                        {alertes > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-orange/10 px-2 py-0.5 text-xs font-semibold text-orange">
                            {alertes} alerte{alertes > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-gris">Aucune</span>
                        )}
                      </td>
                      <td className="text-sm">{facture.responsable?.name ?? 'Non assignée'}</td>
                      <td>
                        <div className="flex gap-2">
                          <Link
                            to={`/factures/${facture.id}`}
                            className="text-sm font-semibold text-bleu hover:underline"
                          >
                            Ouvrir
                          </Link>
                          <button
                            type="button"
                            className="text-sm font-semibold text-gris hover:text-nuit hover:underline"
                            onClick={() => transfererParEmail(facture)}
                          >
                            Transférer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
