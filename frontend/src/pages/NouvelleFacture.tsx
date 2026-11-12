/**
 * COMPTALINK - Écran 5 : Nouvelle facture (Import + Lecture OCR)
 *
 * 1. L'utilisateur importe un PDF ou une image.
 * 2. L'OCR (Tesseract.js côté navigateur pour les images, API OCR simulée
 *    côté Laravel pour les PDF) propose les champs de la facture.
 * 3. Tous les champs sont MODIFIABLES avant confirmation.
 */
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, messageErreur } from '../lib/api';
import { analyserTexte, lireTexteImage } from '../lib/ocr';
import type { ChampsOcr, Facture, Fournisseur } from '../types';

/** Formulaire vide (valeurs par défaut de l'écran) */
const CHAMPS_VIDES: ChampsOcr & { fournisseur_id: number | '' } = {
  fournisseur: '',
  fournisseur_id: '',
  numero: '',
  date_facture: new Date().toISOString().slice(0, 10),
  date_echeance: '',
  montant_HT: 0,
  tva: 0,
  montant_TTC: 0,
};

export default function NouvelleFacture() {
  const navigate = useNavigate();
  const inputFichier = useRef<HTMLInputElement>(null);

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [champs, setChamps] = useState(CHAMPS_VIDES);
  const [fichier, setFichier] = useState<File | null>(null);
  const [nomFichier, setNomFichier] = useState('');
  const [progression, setProgression] = useState(0);
  const [enLecture, setEnLecture] = useState(false);
  const [proposeParOcr, setProposeParOcr] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState('');

  /** Chargement de la liste des fournisseurs (liste déroulante) */
  useEffect(() => {
    api
      .get<Fournisseur[]>('/fournisseurs')
      .then((reponse) => setFournisseurs(reponse.data))
      .catch(() => setFournisseurs([]));
  }, []);

  /** Import du fichier + lancement de la lecture OCR */
  const importerFichier = async (evenement: ChangeEvent<HTMLInputElement>) => {
    const selection = evenement.target.files?.[0];
    if (!selection) return;

    setFichier(selection);
    setNomFichier(selection.name);
    setErreur('');
    setProgression(0);
    setEnLecture(true);

    try {
      let propositions: ChampsOcr;

      if (selection.type.startsWith('image/')) {
        // Lecture réelle par Tesseract.js dans le navigateur
        const texte = await lireTexteImage(selection, setProgression);
        propositions = analyserTexte(texte);
      } else {
        // PDF : l'API OCR simulée du backend propose des champs déterministes
        setProgression(60);
        const reponse = await api.post<{ champs: ChampsOcr }>('/ocr/extract', {
          nom_fichier: selection.name,
        });
        propositions = reponse.data.champs;
        setProgression(100);
      }

      setChamps((precedent) => ({ ...precedent, ...propositions }));
      setProposeParOcr(true);
    } catch {
      setErreur(
        "La lecture automatique a échoué. Vous pouvez saisir les champs manuellement : ils seront contrôlés par COMPTALINK.",
      );
      setProposeParOcr(true);
    } finally {
      setEnLecture(false);
    }
  };

  /** Mise à jour d'un champ du formulaire */
  const majChamp = (nom: keyof typeof CHAMPS_VIDES, valeur: string | number) => {
    setChamps((precedent) => ({ ...precedent, [nom]: valeur }));
  };

  /** Recalcule automatiquement le TTC lorsque le HT ou la TVA change */
  const majMontants = (nom: 'montant_HT' | 'tva', valeur: number) => {
    setChamps((precedent) => {
      const ht = nom === 'montant_HT' ? valeur : precedent.montant_HT;
      const tva = nom === 'tva' ? valeur : precedent.tva;
      return {
        ...precedent,
        [nom]: valeur,
        montant_TTC: Number((ht + tva).toFixed(2)),
      };
    });
  };

  /** Confirmation des champs : création de la facture dans Laravel */
  const confirmerChamps = async (evenement: FormEvent) => {
    evenement.preventDefault();
    setErreur('');
    setEnregistrement(true);

    try {
      // 1. Résolution du fournisseur (création à la volée si le nom est inconnu)
      let fournisseurId = champs.fournisseur_id;
      if (!fournisseurId) {
        const existant = fournisseurs.find(
          (fournisseur) =>
            fournisseur.nom.toLowerCase().trim() === champs.fournisseur.toLowerCase().trim(),
        );
        if (existant) {
          fournisseurId = existant.id;
        } else {
          const creation = await api.post<Fournisseur>('/fournisseurs', {
            nom: champs.fournisseur || 'Fournisseur X',
          });
          fournisseurId = creation.data.id;
        }
      }

      // 2. Création de la facture (les contrôles et alertes sont faits côté Laravel)
      const reponse = await api.post<Facture>('/factures', {
        numero: champs.numero,
        date_facture: champs.date_facture,
        date_echeance: champs.date_echeance || champs.date_facture,
        montant_HT: champs.montant_HT,
        tva: champs.tva,
        montant_TTC: champs.montant_TTC,
        fournisseur_id: fournisseurId,
        source: 'ocr',
        fichier: nomFichier || null,
      });

      const factureCreee = reponse.data;

      // 3. Dépôt du justificatif (fichier d'origine) dans le dossier de la facture
      if (fichier) {
        const donnees = new FormData();
        donnees.append('fichier', fichier);
        await api.post(`/factures/${factureCreee.id}/pieces-justificatives`, donnees, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigate(`/factures/${factureCreee.id}`);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-nuit">Nouvelle facture</h1>
        <p className="text-sm text-gris">
          Importez le PDF ou l'image de la facture fournisseur, vérifiez les champs proposés puis
          confirmez.
        </p>
      </div>

      {erreur && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erreur}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Zone d'import */}
        <section className="cl-card p-5">
          <h2 className="text-lg font-semibold text-nuit">1. Import du document</h2>
          <p className="mt-1 text-xs text-gris">
            Formats acceptés : PDF, JPG, PNG (facture fournisseur scannée ou photographiée).
          </p>

          <div
            className="mt-4 cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-grisclair p-6 text-center transition hover:border-bleu"
            onClick={() => inputFichier.current?.click()}
          >
            <svg
              viewBox="0 0 24 24"
              className="mx-auto h-10 w-10 text-bleu"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M12 16V4m0 0L8 8m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" />
            </svg>
            <p className="mt-2 text-sm font-semibold text-nuit">
              Cliquez pour sélectionner un fichier
            </p>
            <p className="text-xs text-gris">ou déposez votre facture ici</p>
            {nomFichier && (
              <p className="mt-3 truncate rounded-lg bg-white px-3 py-2 text-xs font-medium text-bleu">
                {nomFichier}
              </p>
            )}
          </div>

          <input
            ref={inputFichier}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={importerFichier}
          />

          {enLecture && (
            <div className="mt-4">
              <p className="text-xs font-medium text-nuit">
                Lecture OCR en cours… {progression}%
              </p>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-grisclair">
                <div
                  className="h-full rounded-full bg-bleu transition-all"
                  style={{ width: `${progression}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-5 space-y-2 text-xs text-gris">
            <p className="font-semibold text-nuit">Contrôles automatiques COMPTALINK :</p>
            <p>• TVA incohérente si HT + TVA ≠ TTC</p>
            <p>• Doublon potentiel si fournisseur, n° et montant identiques</p>
            <p>• Champ manquant si une information obligatoire est absente</p>
          </div>
        </section>

        {/* Formulaire pré-rempli */}
        <section className="cl-card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-nuit">2. Vérification des champs</h2>
            {proposeParOcr && (
              <span className="rounded-full border border-orange/30 bg-orange/10 px-3 py-1 text-xs font-semibold text-orange">
                Proposé par OCR - À vérifier
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gris">
            Tous les champs proposés sont modifiables. COMPTALINK relancera les contrôles après
            confirmation.
          </p>

          <form onSubmit={confirmerChamps} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="cl-label" htmlFor="fournisseur">
                Fournisseur
              </label>
              <input
                id="fournisseur"
                className="cl-input"
                list="liste-fournisseurs"
                value={champs.fournisseur}
                onChange={(e) => {
                  const valeur = e.target.value;
                  const trouve = fournisseurs.find((f) => f.nom === valeur);
                  setChamps((precedent) => ({
                    ...precedent,
                    fournisseur: valeur,
                    fournisseur_id: trouve ? trouve.id : '',
                  }));
                }}
                placeholder="Ex. Maroc Telecom"
                required
              />
              <datalist id="liste-fournisseurs">
                {fournisseurs.map((fournisseur) => (
                  <option key={fournisseur.id} value={fournisseur.nom} />
                ))}
              </datalist>
              <p className="mt-1 text-xs text-gris">
                Un fournisseur inconnu sera créé automatiquement dans COMPTALINK.
              </p>
            </div>

            <div>
              <label className="cl-label" htmlFor="numero">
                N° de facture
              </label>
              <input
                id="numero"
                className="cl-input"
                value={champs.numero}
                onChange={(e) => majChamp('numero', e.target.value)}
                placeholder="Ex. FA-2026-015"
                required
              />
            </div>

            <div>
              <label className="cl-label" htmlFor="date_facture">
                Date de facture
              </label>
              <input
                id="date_facture"
                type="date"
                className="cl-input"
                value={champs.date_facture}
                onChange={(e) => majChamp('date_facture', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="cl-label" htmlFor="date_echeance">
                Date d'échéance
              </label>
              <input
                id="date_echeance"
                type="date"
                className="cl-input"
                value={champs.date_echeance}
                onChange={(e) => majChamp('date_echeance', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="cl-label" htmlFor="montant_HT">
                Montant HT (MAD)
              </label>
              <input
                id="montant_HT"
                type="number"
                step="0.01"
                min="0"
                className="cl-input"
                value={champs.montant_HT}
                onChange={(e) => majMontants('montant_HT', Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="cl-label" htmlFor="tva">
                TVA (MAD)
              </label>
              <input
                id="tva"
                type="number"
                step="0.01"
                min="0"
                className="cl-input"
                value={champs.tva}
                onChange={(e) => majMontants('tva', Number(e.target.value))}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="cl-label" htmlFor="montant_TTC">
                Montant TTC (MAD)
              </label>
              <input
                id="montant_TTC"
                type="number"
                step="0.01"
                min="0"
                className="cl-input"
                value={champs.montant_TTC}
                onChange={(e) => majChamp('montant_TTC', Number(e.target.value))}
                required
              />
              <p className="mt-1 text-xs text-gris">
                Pré-calculé automatiquement à partir de HT + TVA, mais modifiable (un écart
                déclenchera l'alerte rouge « TVA incohérente »).
              </p>
            </div>

            <div className="sm:col-span-2 flex flex-wrap gap-3 pt-1">
              <button
                type="submit"
                className="cl-btn-primary"
                disabled={enregistrement || enLecture}
              >
                {enregistrement ? 'Enregistrement…' : 'Confirmer les champs'}
              </button>
              <button
                type="button"
                className="cl-btn-ghost"
                onClick={() => {
                  setChamps(CHAMPS_VIDES);
                  setNomFichier('');
                  setFichier(null);
                  setProposeParOcr(false);
                  if (inputFichier.current) inputFichier.current.value = '';
                }}
              >
                Réinitialiser
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
