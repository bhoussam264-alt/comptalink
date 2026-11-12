//
//  COMPTALINKApp.swift
//  COMPTALINK - Application iOS complémentaire au Web
//
//  Mêmes fonctionnalités que le Web : scan, liste des factures, détail,
//  validation et tableau de bord. L'application consomme la même API REST Laravel.
//

import SwiftUI

@main
struct COMPTALINKApp: App {
    /// Session partagée (jeton Sanctum + utilisateur connecté)
    @StateObject private var session = SessionStore()

    var body: some Scene {
        WindowGroup {
            if session.utilisateur == nil {
                LoginView()
                    .environmentObject(session)
            } else {
                ContenuPrincipal()
                    .environmentObject(session)
            }
        }
    }
}

/// Navigation principale après connexion
struct ContenuPrincipal: View {
    @EnvironmentObject var session: SessionStore

    var body: some View {
        TabView {
            DashboardView()
                .tabItem { Label("Tableau de bord", systemImage: "chart.bar.fill") }

            FacturesView()
                .tabItem { Label("Factures", systemImage: "doc.text.fill") }

            ScanView()
                .tabItem { Label("Scanner", systemImage: "doc.viewfinder") }

            ValidationView()
                .tabItem { Label("Validation", systemImage: "checkmark.seal.fill") }
        }
        .tint(Couleurs.bleu)
    }
}

/// Charte graphique COMPTALINK
enum Couleurs {
    static let nuit = Color(red: 0x1E / 255, green: 0x3A / 255, blue: 0x5F / 255)
    static let bleu = Color(red: 0x2E / 255, green: 0x86 / 255, blue: 0xAB / 255)
    static let orange = Color(red: 0xF1 / 255, green: 0x8F / 255, blue: 0x01 / 255)
    static let grisClair = Color(red: 0xF4 / 255, green: 0xF6 / 255, blue: 0xF9 / 255)
}
