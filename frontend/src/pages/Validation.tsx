/**
 * COMPTALINK - Écran 6 : Validation
 * File d'attente de validation : décisions Approuver / Rejeter / Demander correction.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, messageErreur } from '../lib/api';
import { StatutBadge } from '../components/StatutBadge';
import { formaterDate, formaterMontant, styleNiveauAlerte } from '../lib/format';
import type { Decision, Facture } from '../types';

export default function Validation() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [commentaires, setCommentaires] = useState<Record<number, string>>({});
  const [enCours, setEnCours] = useState<number | null>(null);

  /** Charge les factures en attente de validation */
  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const reponse = await api.get<Facture[]>('/factures', {
        params: { statut: 'En validation' },
      });
      setFactures(reponse.data);
      setErreur('');
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  /** Enregistre une décision de validation (POST /api/validations) */
  const decider = async (facture: Facture, decision: Decision) => {
    setEnCours(facture.id);
    setErreur('');
    try {
      await api.post('/validations', {
        facture_id: facture.id,
        decision,
        commentaire: commentaires[facture.id] || null,
      });
      setMessage(
        `Facture ${facture.numero} : décision « ${decision} » enregistrée. Le statut a été mis à jour automatiquement.`,
      );
      setCommentaires((precedent) => ({ ...precedent, [facture.id]: '' }));
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-nuit">Validation</h1>
        <p className="text-sm text-gris">
          Factures en attente de décision — chaque action est tracée dans la piste d'audit
        </p>
      </div>

      {erreur && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erreur}
        </div>
      )}
      {message && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{message}</span>
          <button
            type="button"
            className="text-xs font-semibold hover:underline"
            onClick={() => setMessage('')}
          >
            Fermer
          </button>
        </div>
      )}

      {chargement ? (
        <p className="text-sm text-gris">Chargement de la file de validation…</p>
      ) : factures.length === 0 ? (
        <div className="cl-card p-8 text-center">
          <p className="font-semibold text-nuit">Aucune facture à valider</p>
          <p className="mt-1 text-sm text-gris">
            Toutes les factures assignées ont été traitées. Bravo !
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {factures.map((facture) => {
            const alertes = (facture.alertes ?? []).filter((alerte) => !alerte.ignoree);
            return (
              <div key={facture.id} className="cl-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        to={`/factures/${facture.id}`}
                        className="text-lg font-bold text-bleu hover:underline"
                      >
                        {facture.numero}
                      </Link>
                      <StatutBadge statut={facture.statut} />
                      {alertes.length > 0 && (
                        <span className="rounded-full bg-orange/10 px-2 py-0.5 text-xs font-semibold text-orange">
                          {alertes.length} alerte{alertes.length > 1 ? 's' : ''} à examiner
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gris">
                      {facture.fournisseur?.nom ?? '—'} · Facture du{' '}
                      {formaterDate(facture.date_facture)} · Échéance{' '}
                      {formaterDate(facture.date_echeance)} · Responsable :{' '}
                      {facture.responsable?.name ?? 'non assignée'}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-nuit">
                    {formaterMontant(facture.montant_TTC)}
                  </p>
                </div>

                {/* Rappel des alertes */}
                {alertes.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {alertes.map((alerte) => (
                      <li
                        key={alerte.id}
                        className={`rounded-lg border px-3 py-2 text-xs ${
                          styleNiveauAlerte[alerte.niveau]?.conteneur ??
                          styleNiveauAlerte.jaune.conteneur
                        }`}
                      >
                        <span className="font-bold">{alerte.type} — </span>
                        {alerte.message}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Actions */}
                <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
                  <div className="flex-1">
                    <label className="cl-label" htmlFor={`commentaire-${facture.id}`}>
                      Commentaire de décision (optionnel)
                    </label>
                    <input
                      id={`commentaire-${facture.id}`}
                      className="cl-input"
                      placeholder="Ex. Montant à confirmer avec le fournisseur."
                      value={commentaires[facture.id] ?? ''}
                      onChange={(e) =>
                        setCommentaires((precedent) => ({
                          ...precedent,
                          [facture.id]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="cl-btn-primary"
                      disabled={enCours === facture.id}
                      onClick={() => decider(facture, 'Approuvé')}
                    >
                      Approuver
                    </button>
                    <button
                      type="button"
                      className="cl-btn-accent"
                      disabled={enCours === facture.id}
                      onClick={() => decider(facture, 'Correction')}
                    >
                      Demander correction
                    </button>
                    <button
                      type="button"
                      className="cl-btn-danger"
                      disabled={enCours === facture.id}
                      onClick={() => decider(facture, 'Rejeté')}
                    >
                      Rejeter
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
