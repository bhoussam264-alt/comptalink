//
//  SessionStore.swift
//  COMPTALINK - État de session (jeton Sanctum + utilisateur connecté)
//

import Foundation
import SwiftUI

@MainActor
final class SessionStore: ObservableObject {
    @Published var utilisateur: Utilisateur?
    @Published var enChargement = false
    @Published var erreur: String?

    private let cleToken = "comptalink_token_ios"

    init() {
        // Restauration de la session précédente
        if let jeton = UserDefaults.standard.string(forKey: cleToken) {
            APIClient.shared.token = jeton
        }
    }

    /// Connexion à COMPTALINK
    func connexion(email: String, motDePasse: String) async {
        enChargement = true
        erreur = nil
        do {
            let reponse = try await APIClient.shared.connexion(email: email, motDePasse: motDePasse)
            APIClient.shared.token = reponse.token
            UserDefaults.standard.set(reponse.token, forKey: cleToken)
            utilisateur = reponse.user
        } catch {
            erreur = error.localizedDescription
        }
        enChargement = false
    }

    /// Inscription d'un nouvel utilisateur
    func inscription(nom: String, email: String, motDePasse: String, role: Role) async {
        enChargement = true
        erreur = nil
        do {
            let reponse = try await APIClient.shared.inscription(nom: nom, email: email,
                                                                 motDePasse: motDePasse, role: role)
            APIClient.shared.token = reponse.token
            UserDefaults.standard.set(reponse.token, forKey: cleToken)
            utilisateur = reponse.user
        } catch {
            erreur = error.localizedDescription
        }
        enChargement = false
    }

    /// Déconnexion
    func deconnexion() async {
        await APIClient.shared.deconnexion()
        APIClient.shared.token = nil
        UserDefaults.standard.removeObject(forKey: cleToken)
        utilisateur = nil
    }
}
