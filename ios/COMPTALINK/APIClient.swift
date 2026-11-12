//
//  APIClient.swift
//  COMPTALINK - Client HTTP vers l'API REST Laravel (authentification Sanctum)
//

import Foundation

/// Erreurs réseau lisibles par l'utilisateur
enum ErreurAPI: LocalizedError {
    case mauvaiseReponse(Int)
    case message(String)

    var errorDescription: String? {
        switch self {
        case .mauvaiseReponse(let code):
            return "Erreur serveur COMPTALINK (\(code))."
        case .message(let texte):
            return texte
        }
    }
}

/// Client API partagé par toute l'application iOS
final class APIClient {
    static let shared = APIClient()

    /// URL de l'API Laravel.
    /// - Simulateur : 127.0.0.1 fonctionne.
    /// - iPhone physique : remplacer par l'IP locale du Mac (ex. http://192.168.1.20:8000/api).
    static let baseURL = URL(string: "http://127.0.0.1:8000/api")!

    /// Jeton Sanctum courant
    var token: String?

    private let decodeur = JSONDecoder()

    /// Exécute une requête et décode la réponse JSON
    private func executer<T: Decodable>(
        _ chemin: String,
        methode: String = "GET",
        corps: [String: Any]? = nil
    ) async throws -> T {
        var requete = URLRequest(url: APIClient.baseURL.appendingPathComponent(chemin))
        requete.httpMethod = methode
        requete.setValue("application/json", forHTTPHeaderField: "Accept")
        requete.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token {
            requete.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let corps {
            requete.httpBody = try JSONSerialization.data(withJSONObject: corps)
        }

        let (donnees, reponse) = try await URLSession.shared.data(for: requete)
        let code = (reponse as? HTTPURLResponse)?.statusCode ?? 0

        guard (200..<300).contains(code) else {
            // Le backend Laravel renvoie un objet { message: "..." } en cas d'erreur
            if let objet = try? JSONSerialization.jsonObject(with: donnees) as? [String: Any],
               let texte = objet["message"] as? String {
                throw ErreurAPI.message(texte)
            }
            throw ErreurAPI.mauvaiseReponse(code)
        }

        return try decodeur.decode(T.self, from: donnees)
    }

    // MARK: - Authentification

    /// Connexion (POST /api/login)
    func connexion(email: String, motDePasse: String) async throws -> ReponseConnexion {
        try await executer("login", methode: "POST", corps: [
            "email": email,
            "password": motDePasse,
        ])
    }

    /// Inscription (POST /api/register)
    func inscription(nom: String, email: String, motDePasse: String, role: Role) async throws -> ReponseConnexion {
        try await executer("register", methode: "POST", corps: [
            "name": nom,
            "email": email,
            "password": motDePasse,
            "password_confirmation": motDePasse,
            "role": role.rawValue,
        ])
    }

    /// Déconnexion (POST /api/logout)
    func deconnexion() async {
        let _: ReponseVide? = try? await executer("logout", methode: "POST", corps: [:])
    }

    // MARK: - Données

    /// Liste des factures, filtrable par statut et recherche
    func factures(statut: Statut? = nil, recherche: String? = nil) async throws -> [Facture] {
        var composants = URLComponents(url: APIClient.baseURL.appendingPathComponent("factures"),
                                       resolvingAgainstBaseURL: false)!
        var elements: [URLQueryItem] = []
        if let statut { elements.append(URLQueryItem(name: "statut", value: statut.rawValue)) }
        if let recherche, !recherche.isEmpty {
            elements.append(URLQueryItem(name: "recherche", value: recherche))
        }
        composants.queryItems = elements.isEmpty ? nil : elements

        var requete = URLRequest(url: composants.url!)
        requete.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token { requete.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }

        let (donnees, _) = try await URLSession.shared.data(for: requete)
        return try decodeur.decode([Facture].self, from: donnees)
    }

    /// Détail d'une facture (GET /api/factures/{id})
    func facture(id: Int) async throws -> Facture {
        try await executer("factures/\(id)")
    }

    /// Tableau de bord (GET /api/dashboard)
    func tableauDeBord() async throws -> TableauDeBord {
        try await executer("dashboard")
    }

    /// Liste des utilisateurs (liste déroulante « Responsable »)
    func utilisateurs() async throws -> [Utilisateur] {
        try await executer("users")
    }

    /// Liste des fournisseurs (GET /api/fournisseurs)
    func fournisseurs() async throws -> [Fournisseur] {
        try await executer("fournisseurs")
    }

    // MARK: - Actions

    /// Change le statut d'une facture
    func changerStatut(factureId: Int, statut: Statut) async throws {
        let _: ReponseVide = try await executer("factures/\(factureId)/statut", methode: "POST",
                                                corps: ["statut": statut.rawValue])
    }

    /// Assigne un responsable
    func assigner(factureId: Int, utilisateurId: Int) async throws {
        let _: ReponseVide = try await executer("factures/\(factureId)/assigner", methode: "POST",
                                                corps: ["user_id": utilisateurId])
    }

    /// Ignore une alerte de contrôle
    func ignorerAlerte(factureId: Int, alerteId: Int) async throws {
        let _: ReponseVide = try await executer("factures/\(factureId)/ignorer-alerte", methode: "POST",
                                                corps: ["alerte_id": alerteId])
    }

    /// Enregistre une décision de validation (POST /api/validations)
    func valider(factureId: Int, decision: Decision, commentaire: String?) async throws {
        let _: ReponseVide = try await executer("validations", methode: "POST", corps: [
            "facture_id": factureId,
            "decision": decision.rawValue,
            "commentaire": commentaire ?? "",
        ])
    }

    /// Crée une facture à partir des champs issus du scan (POST /api/factures)
    func creerFacture(champs: [String: Any]) async throws -> Facture {
        try await executer("factures", methode: "POST", corps: champs)
    }
}

/// Réponse vide (endpoints qui ne renvoient pas de données utiles)
struct ReponseVide: Codable {
    let message: String?
}
