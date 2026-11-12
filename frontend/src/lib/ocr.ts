/**
 * COMPTALINK - Lecture OCR côté frontend (Tesseract.js)
 *
 * 1. Le fichier (image) est analysé localement par Tesseract.js.
 * 2. Le texte brut est interprété par des heuristiques pour proposer
 *    les champs de la facture (fournisseur, numéro, dates, montants).
 * 3. Tous les champs restent MODIFIABLES par l'utilisateur.
 */
import { createWorker } from 'tesseract.js';
import type { ChampsOcr } from '../types';

/** Fournisseurs marocains connus, utilisés pour reconnaître l'émetteur */
const FOURNISSEURS_CONNUS = [
  'Maroc Telecom',
  'ONEE',
  'IAM',
  'Lydec',
  'Fournisseur X',
  'Inwi',
  'Redal',
  'Amana',
];

/**
 * Lance la reconnaissance de texte sur une image.
 * @param fichier image (jpg, png…)
 * @param onProgress callback de progression (0-100)
 */
export async function lireTexteImage(
  fichier: File,
  onProgress?: (progression: number) => void,
): Promise<string> {
  const worker = await createWorker('fra', 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  try {
    const resultat = await worker.recognize(fichier);
    return resultat.data.text ?? '';
  } finally {
    await worker.terminate();
  }
}

/** Convertit "1 234,56" ou "1234.56" en nombre */
function versNombre(valeur: string): number {
  return Number(valeur.replace(/\s/g, '').replace(',', '.'));
}

/** Cherche une date au format jj/mm/aaaa ou jj-mm-aaaa */
function extraireDates(texte: string): string[] {
  const correspondances = texte.match(/\b(\d{2})[/\-.](\d{2})[/\-.](\d{4})\b/g) ?? [];
  return correspondances.map((d) => {
    const [jour, mois, annee] = d.split(/[/\-.]/);
    return `${annee}-${mois}-${jour}`;
  });
}

/** Ajoute un mois à une date ISO (date d'échéance par défaut) */
function ajouterUnMois(dateIso: string): string {
  if (!dateIso) return '';
  const date = new Date(dateIso);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

/**
 * Interprète le texte brut issu de l'OCR et propose les champs de la facture.
 * Les valeurs renvoyées sont des PROPOSITIONS à confirmer par l'utilisateur.
 */
export function analyserTexte(texte: string): ChampsOcr {
  const texteMaj = texte.toUpperCase();

  // Fournisseur : premier nom connu présent dans le document
  const fournisseur =
    FOURNISSEURS_CONNUS.find((f) => texteMaj.includes(f.toUpperCase())) ?? 'Fournisseur X';

  // Numéro de facture
  const numero =
    texte.match(/\b(?:FACTURE|FACT|N[°o]|INVOICE)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{3,})/i)?.[1] ??
    texte.match(/\b([A-Z]{2,4}\d{4,8})\b/)?.[1] ??
    '';

  // Dates
  const dates = extraireDates(texte);
  const dateFacture = dates[0] ?? new Date().toISOString().slice(0, 10);
  const dateEcheance = dates[1] ?? ajouterUnMois(dateFacture);

  // Montants : HT, TVA, TTC
  const htMatch = texte.match(/TOTAL\s*H\.?T\.?\s*[:\-]?\s*([\d\s.,]+)/i)?.[1];
  const tvaMatch = texte.match(/(?:TVA|T\.V\.A)\s*(?:20\s*%)?\s*[:\-]?\s*([\d\s.,]+)/i)?.[1];
  const ttcMatch = texte.match(/TOTAL\s*T\.?T\.?C\.?\s*[:\-]?\s*([\d\s.,]+)/i)?.[1];

  let montantHT = htMatch ? versNombre(htMatch) : 0;
  let tva = tvaMatch ? versNombre(tvaMatch) : 0;
  let montantTTC = ttcMatch ? versNombre(ttcMatch) : 0;

  // Repli : si seul le TTC est détecté, on applique le taux marocain de 20 %
  if (!montantTTC && montantHT) {
    montantTTC = Number((montantHT + tva).toFixed(2));
  }
  if (montantTTC && !montantHT) {
    montantHT = Number((montantTTC / 1.2).toFixed(2));
    tva = Number((montantTTC - montantHT).toFixed(2));
  }
  if (montantHT && !tva) {
    tva = Number((montantHT * 0.2).toFixed(2));
    montantTTC = Number((montantHT + tva).toFixed(2));
  }

  return {
    fournisseur,
    numero,
    date_facture: dateFacture,
    date_echeance: dateEcheance,
    montant_HT: Number(montantHT.toFixed(2)),
    tva: Number(tva.toFixed(2)),
    montant_TTC: Number(montantTTC.toFixed(2)),
  };
}
