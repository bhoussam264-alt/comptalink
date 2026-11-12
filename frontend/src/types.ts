/**
 * COMPTALINK - Types partagés du frontend
 * Reflètent le contrat de l'API REST Laravel (backend/app/Http/Controllers/Api)
 */

/** Rôles applicatifs */
export type Role = 'Collaborateur' | 'Valideur' | 'Comptable' | 'Admin';

/** Cycle de vie d'une facture fournisseur */
export type Statut =
  | 'Reçue'
  | 'À vérifier'
  | 'En validation'
  | 'Validée'
  | 'Prête pour Sage'
  | 'Archivée';

/** Décision de validation */
export type Decision = 'Approuvé' | 'Rejeté' | 'Correction';

/** Nature d'une alerte de contrôle */
export type TypeAlerte = 'Doublon' | 'TVA incohérente' | 'Champ manquant';

/** Niveau de risque d'une alerte */
export type NiveauAlerte = 'rouge' | 'orange' | 'jaune';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at?: string;
}

export interface Fournisseur {
  id: number;
  nom: string;
  ice: string | null;
  telephone: string | null;
  created_at?: string;
  factures_count?: number;
}

export interface Alerte {
  id: number;
  type: TypeAlerte;
  message: string;
  niveau: NiveauAlerte;
  ignoree: boolean;
  facture_id: number;
  facture_concernee_id: number | null;
}

export interface PieceJustificative {
  id: number;
  nom_fichier: string;
  chemin: string;
  facture_id: number;
  created_at?: string;
}

export interface Validation {
  id: number;
  date_validation: string;
  decision: Decision;
  commentaire: string | null;
  facture_id: number;
  user_id: number;
  user?: User;
  facture?: Facture;
}

export interface Facture {
  id: number;
  numero: string;
  date_facture: string;
  date_echeance: string;
  montant_HT: number;
  tva: number;
  montant_TTC: number;
  statut: Statut;
  fournisseur_id: number;
  user_id: number | null;
  source?: 'ocr' | 'manuel' | 'email';
  fichier?: string | null;
  fournisseur?: Fournisseur;
  responsable?: User;
  alertes?: Alerte[];
  validations?: Validation[];
  pieces_justificatives?: PieceJustificative[];
  created_at?: string;
  updated_at?: string;
}

/** Champs proposés par l'OCR (tous modifiables par l'utilisateur) */
export interface ChampsOcr {
  fournisseur: string;
  numero: string;
  date_facture: string;
  date_echeance: string;
  montant_HT: number;
  tva: number;
  montant_TTC: number;
}

export interface CartesDashboard {
  factures_en_attente: number;
  echeances_proches: number;
  en_retard: number;
  validees_ce_mois: number;
}

export interface RepartitionStatut {
  statut: Statut;
  total: number;
}

export interface Dashboard {
  cartes: CartesDashboard;
  par_statut: RepartitionStatut[];
  echeances_proches: Facture[];
  dernieres_actions: Validation[];
}

export interface LoginResponse {
  token: string;
  user: User;
}
