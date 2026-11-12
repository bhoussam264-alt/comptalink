//
//  LoginView.swift
//  COMPTALINK - Connexion / Inscription (iOS)
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject var session: SessionStore

    @State private var modeInscription = false
    @State private var email = "admin@comptalink.ma"
    @State private var motDePasse = "123456"
    @State private var nom = ""
    @State private var role: Role = .collaborateur

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // En-tête de marque
                VStack(spacing: 8) {
                    Image(systemName: "doc.text.magnifyingglass")
                        .font(.system(size: 46))
                        .foregroundColor(Couleurs.bleu)
                    Text("COMPTALINK")
                        .font(.largeTitle.bold())
                        .foregroundColor(Couleurs.nuit)
                    Text("Factures fournisseurs · Maroc")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                .padding(.top, 40)

                // Formulaire
                VStack(spacing: 14) {
                    if modeInscription {
                        Champ(icone: "person.fill", texte: "Nom complet", valeur: $nom)
                    }
                    Champ(icone: "envelope.fill", texte: "Adresse e-mail", valeur: $email,
                          clavier: .emailAddress)
                    ChampSecurise(icone: "lock.fill", texte: "Mot de passe", valeur: $motDePasse)

                    if modeInscription {
                        Picker("Rôle", selection: $role) {
                            ForEach(Role.allCases, id: \.self) { valeur in
                                Text(valeur.rawValue).tag(valeur)
                            }
                        }
                        .pickerStyle(.menu)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    if let erreur = session.erreur {
                        Text(erreur)
                            .font(.footnote)
                            .foregroundColor(.red)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Button {
                        Task {
                            if modeInscription {
                                await session.inscription(nom: nom, email: email,
                                                          motDePasse: motDePasse, role: role)
                            } else {
                                await session.connexion(email: email, motDePasse: motDePasse)
                            }
                        }
                    } label: {
                        HStack {
                            if session.enChargement { ProgressView().tint(.white) }
                            Text(modeInscription ? "S'inscrire" : "Se connecter")
                                .bold()
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Couleurs.bleu)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(session.enChargement)

                    Button(modeInscription ? "J'ai déjà un compte" : "Créer un compte") {
                        modeInscription.toggle()
                    }
                    .font(.footnote.bold())
                    .foregroundColor(Couleurs.bleu)
                }
                .padding(20)
                .background(Color.white)
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.06), radius: 8, y: 3)

                // Comptes de démonstration
                VStack(alignment: .leading, spacing: 8) {
                    Text("Comptes de démonstration (mot de passe : 123456)")
                        .font(.caption.bold())
                        .foregroundColor(.gray)
                    ForEach(["admin@comptalink.ma", "comptable@comptalink.ma",
                             "valideur@comptalink.ma", "collab@comptalink.ma"], id: \.self) { compte in
                        Button {
                            email = compte
                            motDePasse = "123456"
                            modeInscription = false
                        } label: {
                            Text(compte)
                                .font(.footnote)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.vertical, 6)
                        }
                        .foregroundColor(Couleurs.nuit)
                    }
                }
                .padding(16)
                .background(Color.white)
                .cornerRadius(16)

                Spacer(minLength: 20)
            }
            .padding(20)
        }
        .background(Couleurs.grisClair.ignoresSafeArea())
    }
}

/// Champ de saisie avec icône
struct Champ: View {
    let icone: String
    let texte: String
    @Binding var valeur: String
    var clavier: UIKeyboardType = .default

    var body: some View {
        HStack {
            Image(systemName: icone).foregroundColor(Couleurs.bleu)
            TextField(texte, text: $valeur)
                .keyboardType(clavier)
                .autocapitalization(.none)
                .disableAutocorrection(true)
        }
        .padding()
        .background(Couleurs.grisClair)
        .cornerRadius(10)
    }
}

/// Champ mot de passe
struct ChampSecurise: View {
    let icone: String
    let texte: String
    @Binding var valeur: String

    var body: some View {
        HStack {
            Image(systemName: icone).foregroundColor(Couleurs.bleu)
            SecureField(texte, text: $valeur)
        }
        .padding()
        .background(Couleurs.grisClair)
        .cornerRadius(10)
    }
}
