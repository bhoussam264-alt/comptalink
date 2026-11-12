//
//  Models.swift
//  COMPTALINK - Modèles partagés avec l'API REST Laravel
//

import Foundation

/// Rôles applicatifs
enum Role: String, Codable, CaseIterable {
    case collaborateur = "Collaborateur"
    case valideur = "Valideur"
    case comptable = "Comptable"
    case admin = "Admin"
}

/// Cycle de vie d'une facture
enum Statut: String, Codable, CaseIterable {
    case recue = "Reçue"
    case aVerifier = "À vérifier"
    case enValidation = "En validation"
    case validee = "Validée"
    case pretePourSage = "Prête pour Sage"
    case archivee = "Archivée"

    /// Couleur d'affichage associée au statut
    var couleur: String {
        switch self {
        case .recue: return "gray"
        case .aVerifier: return "yellow"
        case .enValidation: return "orange"
        case .validee: return "green"
        case .pretePourSage: return "blue"
        case .archivee: return "gray"
        }
    }
}

/// Décision de validation
enum Decision: String, Codable {
    case approuve = "Approuvé"
    case rejete = "Rejeté"
    case correction = "Correction"
}

struct Utilisateur: Codable, Identifiable {
    let id: Int
    let name: String
    let email: String
    let role: Role
}

struct Fournisseur: Codable, Identifiable {
    let id: Int
    let nom: String
    let ice: String?
    let telephone: String?
}

struct Alerte: Codable, Identifiable {
    let id: Int
    let type: String
    let message: String
    let niveau: String
    let ignoree: Bool
    let factureId: Int
    let factureConcerneeId: Int?

    enum CodingKeys: String, CodingKey {
        case id, type, message, niveau, ignoree
        case factureId = "facture_id"
        case factureConcerneeId = "facture_concernee_id"
    }
}

struct PieceJustificative: Codable, Identifiable {
    let id: Int
    let nomFichier: String
    let chemin: String

    enum CodingKeys: String, CodingKey {
        case id, chemin
        case nomFichier = "nom_fichier"
    }
}

struct Validation: Codable, Identifiable {
    let id: Int
    let dateValidation: String
    let decision: Decision
    let commentaire: String?
    let utilisateur: Utilisateur?

    enum CodingKeys: String, CodingKey {
        case id, decision, commentaire
        case dateValidation = "date_validation"
        case utilisateur = "user"
    }
}

struct Facture: Codable, Identifiable {
    let id: Int
    let numero: String
    let dateFacture: String
    let dateEcheance: String
    let montantHT: Double
    let tva: Double
    let montantTTC: Double
    let statut: Statut
    let fournisseurId: Int
    let userId: Int?
    let fichier: String?
    let fournisseur: Fournisseur?
    let responsable: Utilisateur?
    let alertes: [Alerte]?
    let validations: [Validation]?
    let piecesJustificatives: [PieceJustificative]?

    enum CodingKeys: String, CodingKey {
        case id, numero, statut, tva, fichier
        case dateFacture = "date_facture"
        case dateEcheance = "date_echeance"
        case montantHT = "montant_HT"
        case montantTTC = "montant_TTC"
        case fournisseurId = "fournisseur_id"
        case userId = "user_id"
        case fournisseur, responsable, alertes, validations
        case piecesJustificatives = "pieces_justificatives"
    }

    /// Raccourci : alertes encore actives
    var alertesActives: [Alerte] {
        (alertes ?? []).filter { !$0.ignoree }
    }
}

/// Réponse de /api/dashboard
struct TableauDeBord: Codable {
    let cartes: Cartes
    let parStatut: [Repartition]
    let echeancesProches: [Facture]
    let dernieresActions: [Validation]

    struct Cartes: Codable {
        let facturesEnAttente: Int
        let echeancesProches: Int
        let enRetard: Int
        let valideesCeMois: Int

        enum CodingKeys: String, CodingKey {
            case facturesEnAttente = "factures_en_attente"
            case echeancesProches = "echeances_proches"
            case enRetard = "en_retard"
            case valideesCeMois = "validees_ce_mois"
        }
    }

    struct Repartition: Codable, Identifiable {
        let statut: Statut
        let total: Int
        var id: String { statut.rawValue }
    }

    enum CodingKeys: String, CodingKey {
        case cartes
        case parStatut = "par_statut"
        case echeancesProches = "echeances_proches"
        case dernieresActions = "dernieres_actions"
    }
}

/// Réponse de /api/login et /api/register
struct ReponseConnexion: Codable {
    let token: String
    let user: Utilisateur
}
