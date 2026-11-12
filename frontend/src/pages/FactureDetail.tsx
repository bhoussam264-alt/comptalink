/**
 * COMPTALINK - Écran 4 : Détail de la facture
 * Timeline du cycle de vie, alertes de contrôle, validation, piste d'audit et dossier.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, messageErreur } from '../lib/api';
import { StatutBadge } from '../components/StatutBadge';
import {
  CYCLE_STATUTS,
  formaterDate,
  formaterDateHeure,
  formaterMontant,
  joursRestants,
  styleNiveauAlerte,
} from '../lib/format';
import type { Decision, Facture, Fournisseur, Statut, User } from '../types';

export default function FactureDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [facture, setFacture] = useState<Facture | null>(null);
  const [utilisateurs, setUtilisateurs] = useState<User[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [modeEdition, setModeEdition] = useState(false);
  const [champsEdition, setChampsEdition] = useState({
    numero: '',
    date_facture: '',
    date_echeance: '',
    montant_HT: 0,
    tva: 0,
    montant_TTC: 0,
    fournisseur_id: 0,
  });

  /** Recharge la facture depuis l'API */
  const chargerFacture = useCallback(async () => {
    if (!id) return;
    try {
      const reponse = await api.get<Facture>(`/factures/${id}`);
      setFacture(reponse.data);
      setChampsEdition({
        numero: reponse.data.numero,
        date_facture: reponse.data.date_facture?.slice(0, 10) ?? '',
        date_echeance: reponse.data.date_echeance?.slice(0, 10) ?? '',
        montant_HT: Number(reponse.data.montant_HT),
        tva: Number(reponse.data.tva),
        montant_TTC: Number(reponse.data.montant_TTC),
        fournisseur_id: reponse.data.fournisseur_id,
      });
      setErreur('');
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }, [id]);

  useEffect(() => {
    chargerFacture();
    // Listes nécessaires aux listes déroulantes
    api
      .get<User[]>('/users')
      .then((reponse) => setUtilisateurs(reponse.data))
      .catch(() => setUtilisateurs([]));
    api
      .get<Fournisseur[]>('/fournisseurs')
      .then((reponse) => setFournisseurs(reponse.data))
      .catch(() => setFournisseurs([]));
  }, [chargerFacture]);

  /** Enregistre une décision de validation (POST /api/validations) */
  const enregistrerDecision = async (decision: Decision) => {
    if (!facture) return;
    setEnCours(true);
    setErreur('');
    try {
      await api.post('/validations', {
        facture_id: facture.id,
        decision,
        commentaire: commentaire || null,
      });
      setCommentaire('');
      setMessage(`Décision « ${decision} » enregistrée dans la piste d'audit COMPTALINK.`);
      await chargerFacture();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  /** Change le statut de la facture (POST /api/factures/{id}/statut) */
  const changerStatut = async (statut: Statut) => {
    if (!facture) return;
    setEnCours(true);
    try {
      await api.post(`/factures/${facture.id}/statut`, { statut });
      setMessage(`Statut mis à jour : ${statut}.`);
      await chargerFacture();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  /** Assigne un responsable (POST /api/factures/{id}/assigner) */
  const assignerResponsable = async (userId: number) => {
    if (!facture) return;
    try {
      await api.post(`/factures/${facture.id}/assigner`, { user_id: userId });
      setMessage('Responsable assigné à la facture.');
      await chargerFacture();
    } catch (e) {
      setErreur(messageErreur(e));
    }
  };

  /** Ignore une alerte (POST /api/factures/{id}/ignorer-alerte) */
  const ignorerAlerte = async (alerteId: number) => {
    if (!facture) return;
    try {
      await api.post(`/factures/${facture.id}/ignorer-alerte`, { alerte_id: alerteId });
      setMessage("Alerte ignorée. Elle reste consultable dans l'historique.");
      await chargerFacture();
    } catch (e) {
      setErreur(messageErreur(e));
    }
  };

  /** Enregistre les champs corrigés (PUT /api/factures/{id}) puis relance les contrôles */
  const enregistrerChamps = async () => {
    if (!facture) return;
    setEnCours(true);
    try {
      await api.put(`/factures/${facture.id}`, champsEdition);
      setMessage('Champs enregistrés : les contrôles COMPTALINK ont été relancés.');
      setModeEdition(false);
      await chargerFacture();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  /** Dépose une pièce justificative */
  const deposerJustificatif = async (fichier: File) => {
    if (!facture) return;
    try {
      const donnees = new FormData();
      donnees.append('fichier', fichier);
      await api.post(`/factures/${facture.id}/pieces-justificatives`, donnees, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Pièce justificative ajoutée au dossier de la facture.');
      await chargerFacture();
    } catch (e) {
      setErreur(messageErreur(e));
    }
  };

  if (chargement) return <p className="text-gris">Chargement de la facture…</p>;
  if (erreur && !facture)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {erreur}
      </div>
    );
  if (!facture) return null;

  const alertesActives = (facture.alertes ?? []).filter((alerte) => !alerte.ignoree);
  const indexStatut = CYCLE_STATUTS.indexOf(facture.statut);
  const reste = joursRestants(facture.date_echeance);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            className="mb-2 text-sm text-gris hover:text-nuit"
            onClick={() => navigate('/factures')}
          >
            ← Retour à Mes Factures
          </button>
          <h1 className="text-2xl font-bold text-nuit">{facture.numero}</h1>
          <p className="text-sm text-gris">
            {facture.fournisseur?.nom ?? 'Fournisseur inconnu'} · Facture du{' '}
            {formaterDate(facture.date_facture)} · Échéance {formaterDate(facture.date_echeance)}
            {reste < 0 ? (
              <span className="ml-2 font-semibold text-red-600">
                (en retard de {Math.abs(reste)} jours)
              </span>
            ) : (
              <span className="ml-2 text-gris">(J-{reste})</span>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatutBadge statut={facture.statut} />
          <div className="flex flex-wrap gap-2">
            {facture.statut !== 'Validée' && facture.statut !== 'Prête pour Sage' && (
              <button
                type="button"
                className="cl-btn-ghost"
                disabled={enCours}
                onClick={() => changerStatut('En validation')}
              >
                En validation
              </button>
            )}
            {facture.statut === 'Validée' && (
              <button
                type="button"
                className="cl-btn-primary"
                disabled={enCours}
                onClick={() => changerStatut('Prête pour Sage')}
              >
                Prête pour Sage
              </button>
            )}
            <button
              type="button"
              className="cl-btn-ghost"
              disabled={enCours}
              onClick={() => changerStatut('Archivée')}
            >
              Archiver
            </button>
          </div>
        </div>
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

      {/* Timeline du cycle de vie */}
      <section className="cl-card p-5">
        <h2 className="text-lg font-semibold text-nuit">Suivi de validation</h2>
        <p className="mb-5 text-xs text-gris">
          Circuit COMPTALINK : de la réception à la préparation de l'export Sage 100
        </p>

        <ol className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-2">
          {CYCLE_STATUTS.map((statut, index) => {
            const atteint = index <= indexStatut;
            const courant = index === indexStatut;
            return (
              <li key={statut} className="flex flex-1 items-start gap-3 lg:flex-col lg:items-center">
                <div className="flex items-center gap-3 lg:w-full lg:flex-col">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      atteint ? 'bg-bleu text-white' : 'bg-grisclair text-gris'
                    } ${courant ? 'ring-4 ring-bleu/20' : ''}`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`hidden h-0.5 flex-1 lg:block ${
                      index < CYCLE_STATUTS.length - 1
                        ? atteint
                          ? 'bg-bleu'
                          : 'bg-grisclair'
                        : 'bg-transparent'
                    }`}
                  />
                </div>
                <span
                  className={`text-sm ${
                    courant ? 'font-bold text-nuit' : atteint ? 'font-medium text-nuit' : 'text-gris'
                  }`}
                >
                  {statut}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Colonne gauche : alertes + informations */}
        <div className="space-y-6 xl:col-span-2">
          {/* Alertes de contrôle */}
          <section className="cl-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-nuit">Contrôles et alertes</h2>
                <p className="text-xs text-gris">
                  Les alertes signalent des risques à vérifier, pas des certitudes.
                </p>
              </div>
              <span className="text-sm text-gris">{alertesActives.length} active(s)</span>
            </div>

            <div className="mt-4 space-y-3">
              {(facture.alertes ?? []).length === 0 && (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Aucune anomalie détectée : HT + TVA = TTC, aucun doublon, aucun champ manquant.
                </p>
              )}

              {(facture.alertes ?? []).map((alerte) => {
                const style = styleNiveauAlerte[alerte.niveau] ?? styleNiveauAlerte.jaune;
                return (
                  <div
                    key={alerte.id}
                    className={`rounded-lg border px-4 py-3 ${
                      alerte.ignoree ? 'border-gray-200 bg-gray-50 text-gris' : style.conteneur
                    }`}
                  >
                    <div className="flex flex-wrap items-start gap-2">
                      <span className="text-sm font-bold">{alerte.type}</span>
                      {alerte.ignoree && (
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">
                          Ignorée
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm">{alerte.message}</p>

                    {!alerte.ignoree && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {alerte.facture_concernee_id && (
                          <Link
                            to={`/factures/${alerte.facture_concernee_id}`}
                            className="cl-btn-ghost !py-1.5 !text-xs"
                          >
                            Voir l'autre facture
                          </Link>
                        )}
                        <button
                          type="button"
                          className="cl-btn-ghost !py-1.5 !text-xs"
                          onClick={() => ignorerAlerte(alerte.id)}
                        >
                          Ignorer l'alerte
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Informations de la facture (champs OCR modifiables) */}
          <section className="cl-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-nuit">Informations de la facture</h2>
                <p className="text-xs text-gris">
                  Champs issus de la lecture OCR — modifiables à tout moment
                </p>
              </div>
              {!modeEdition ? (
                <button
                  type="button"
                  className="cl-btn-ghost"
                  onClick={() => setModeEdition(true)}
                >
                  Modifier les champs
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="cl-btn-primary"
                    disabled={enCours}
                    onClick={enregistrerChamps}
                  >
                    Enregistrer et recontrôler
                  </button>
                  <button
                    type="button"
                    className="cl-btn-ghost"
                    onClick={() => setModeEdition(false)}
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>

            {modeEdition ? (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="cl-label">Fournisseur</label>
                  <select
                    className="cl-input"
                    value={champsEdition.fournisseur_id}
                    onChange={(e) =>
                      setChampsEdition((p) => ({ ...p, fournisseur_id: Number(e.target.value) }))
                    }
                  >
                    {fournisseurs.map((fournisseur) => (
                      <option key={fournisseur.id} value={fournisseur.id}>
                        {fournisseur.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="cl-label">N° de facture</label>
                  <input
                    className="cl-input"
                    value={champsEdition.numero}
                    onChange={(e) => setChampsEdition((p) => ({ ...p, numero: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="cl-label">Date de facture</label>
                  <input
                    type="date"
                    className="cl-input"
                    value={champsEdition.date_facture}
                    onChange={(e) =>
                      setChampsEdition((p) => ({ ...p, date_facture: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="cl-label">Date d'échéance</label>
                  <input
                    type="date"
                    className="cl-input"
                    value={champsEdition.date_echeance}
                    onChange={(e) =>
                      setChampsEdition((p) => ({ ...p, date_echeance: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="cl-label">Montant HT (MAD)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="cl-input"
                    value={champsEdition.montant_HT}
                    onChange={(e) =>
                      setChampsEdition((p) => ({ ...p, montant_HT: Number(e.target.value) }))
                    }
                  />
                </div>
                <div>
                  <label className="cl-label">TVA (MAD)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="cl-input"
                    value={champsEdition.tva}
                    onChange={(e) =>
                      setChampsEdition((p) => ({ ...p, tva: Number(e.target.value) }))
                    }
                  />
                </div>
                <div>
                  <label className="cl-label">Montant TTC (MAD)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="cl-input"
                    value={champsEdition.montant_TTC}
                    onChange={(e) =>
                      setChampsEdition((p) => ({ ...p, montant_TTC: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
            ) : (
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gris">Fournisseur</dt>
                  <dd className="font-semibold text-nuit">{facture.fournisseur?.nom ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gris">ICE fournisseur</dt>
                  <dd className="font-semibold text-nuit">{facture.fournisseur?.ice || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gris">N° de facture</dt>
                  <dd className="font-semibold text-nuit">{facture.numero}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gris">Source</dt>
                  <dd className="font-semibold text-nuit">
                    {facture.source === 'ocr'
                      ? 'Import OCR'
                      : facture.source === 'email'
                        ? 'Transfert e-mail'
                        : 'Saisie manuelle'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gris">Montant HT</dt>
                  <dd className="font-semibold text-nuit">{formaterMontant(facture.montant_HT)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gris">TVA</dt>
                  <dd className="font-semibold text-nuit">{formaterMontant(facture.tva)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-gris">Montant TTC</dt>
                  <dd className="text-xl font-bold text-nuit">
                    {formaterMontant(facture.montant_TTC)}
                  </dd>
                </div>
              </dl>
            )}
          </section>

          {/* Piste d'audit */}
          <section className="cl-card p-5">
            <h2 className="text-lg font-semibold text-nuit">Historique complet (piste d'audit)</h2>
            <p className="mb-4 text-xs text-gris">Qui a fait quoi, et quand</p>

            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-bleu" />
                <div>
                  <p className="text-sm font-semibold text-nuit">Facture reçue dans COMPTALINK</p>
                  <p className="text-xs text-gris">{formaterDateHeure(facture.created_at)}</p>
                </div>
              </li>

              {(facture.validations ?? []).map((validation) => (
                <li key={validation.id} className="flex gap-3">
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      validation.decision === 'Approuvé'
                        ? 'bg-emerald-500'
                        : validation.decision === 'Rejeté'
                          ? 'bg-red-500'
                          : 'bg-orange'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-nuit">
                      {validation.decision === 'Approuvé'
                        ? 'Facture approuvée'
                        : validation.decision === 'Rejeté'
                          ? 'Facture rejetée'
                          : 'Correction demandée'}{' '}
                      par {validation.user?.name ?? `utilisateur #${validation.user_id}`}
                    </p>
                    {validation.commentaire && (
                      <p className="text-sm text-gris">« {validation.commentaire} »</p>
                    )}
                    <p className="text-xs text-gris">
                      {formaterDateHeure(validation.date_validation)}
                    </p>
                  </div>
                </li>
              ))}

              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-gris" />
                <div>
                  <p className="text-sm font-semibold text-nuit">
                    Statut actuel : {facture.statut}
                  </p>
                  <p className="text-xs text-gris">
                    Dernière mise à jour {formaterDateHeure(facture.updated_at)}
                  </p>
                </div>
              </li>
            </ul>
          </section>
        </div>

        {/* Colonne droite : validation + dossier */}
        <div className="space-y-6">
          <section className="cl-card p-5">
            <h2 className="text-lg font-semibold text-nuit">Décision de validation</h2>
            <p className="mt-1 text-xs text-gris">
              Chaque décision est horodatée et nominative dans la piste d'audit.
            </p>

            <label className="cl-label mt-4" htmlFor="commentaire">
              Commentaire (optionnel)
            </label>
            <textarea
              id="commentaire"
              className="cl-input min-h-[90px]"
              placeholder="Ex. TVA à corriger avec le fournisseur avant règlement."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
            />

            <div className="mt-4 grid grid-cols-1 gap-2">
              <button
                type="button"
                className="cl-btn-primary"
                disabled={enCours}
                onClick={() => enregistrerDecision('Approuvé')}
              >
                Approuver
              </button>
              <button
                type="button"
                className="cl-btn-accent"
                disabled={enCours}
                onClick={() => enregistrerDecision('Correction')}
              >
                Demander correction
              </button>
              <button
                type="button"
                className="cl-btn-danger"
                disabled={enCours}
                onClick={() => enregistrerDecision('Rejeté')}
              >
                Rejeter
              </button>
            </div>
          </section>

          <section className="cl-card p-5">
            <h2 className="text-lg font-semibold text-nuit">Responsable</h2>
            <p className="mt-1 text-xs text-gris">
              Collègue en charge du traitement de cette facture.
            </p>
            <label className="cl-label mt-4" htmlFor="responsable">
              Assigner à
            </label>
            <select
              id="responsable"
              className="cl-input"
              value={facture.user_id ?? ''}
              onChange={(e) => assignerResponsable(Number(e.target.value))}
            >
              <option value="">— Non assignée —</option>
              {utilisateurs.map((utilisateur) => (
                <option key={utilisateur.id} value={utilisateur.id}>
                  {utilisateur.name} ({utilisateur.role})
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gris">
              Responsable actuel : {facture.responsable?.name ?? 'aucun'}
            </p>
          </section>

          <section className="cl-card p-5">
            <h2 className="text-lg font-semibold text-nuit">Dossier de la facture</h2>
            <p className="mt-1 text-xs text-gris">
              Fichier d'origine et pièces justificatives associées.
            </p>

            <div className="mt-3 rounded-lg border border-gray-200 bg-grisclair px-3 py-2 text-sm">
              <span className="font-medium text-nuit">Fichier :</span>{' '}
              {facture.fichier ? (
                <span className="text-bleu">{facture.fichier}</span>
              ) : (
                <span className="text-gris">non renseigné</span>
              )}
            </div>

            <ul className="mt-3 space-y-2">
              {(facture.pieces_justificatives ?? []).map((piece) => (
                <li
                  key={piece.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <span className="truncate text-nuit">{piece.nom_fichier}</span>
                  <span className="text-xs text-gris">
                    {formaterDate(piece.created_at)}
                  </span>
                </li>
              ))}
              {(facture.pieces_justificatives ?? []).length === 0 && (
                <li className="text-xs text-gris">Aucune pièce justificative pour le moment.</li>
              )}
            </ul>

            <label className="cl-btn-ghost mt-4 w-full cursor-pointer">
              Ajouter une pièce justificative
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const fichier = e.target.files?.[0];
                  if (fichier) deposerJustificatif(fichier);
                }}
              />
            </label>
          </section>
        </div>
      </div>
    </div>
  );
}
