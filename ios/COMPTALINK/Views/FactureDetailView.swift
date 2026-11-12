//
//  FactureDetailView.swift
//  COMPTALINK - Détail d'une facture sur iOS : alertes, responsable, validation
//

import SwiftUI

struct FactureDetailView: View {
    let factureId: Int

    @State private var facture: Facture?
    @State private var utilisateurs: [Utilisateur] = []
    @State private var commentaire = ""
    @State private var message: String?
    @State private var erreur: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if let erreur {
                    Text(erreur).font(.footnote).foregroundColor(.red)
                }
                if let message {
                    Text(message).font(.footnote).foregroundColor(.green)
                }

                if let facture {
                    // En-tête
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text(facture.numero).font(.title2.bold())
                            Spacer()
                            EtiquetteStatut(statut: facture.statut)
                        }
                        Text(facture.fournisseur?.nom ?? "—").font(.subheadline).foregroundColor(.gray)
                        Text("Facture du \(facture.dateFacture) · Échéance \(facture.dateEcheance)")
                            .font(.caption).foregroundColor(.gray)
                        Text(formaterMAD(facture.montantTTC)).font(.title3.bold())
                            .foregroundColor(Couleurs.nuit)
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(14)

                    // Alertes de contrôle
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Contrôles et alertes").font(.headline)
                        if (facture.alertes ?? []).isEmpty {
                            Text("Aucune anomalie détectée.")
                                .font(.footnote).foregroundColor(.green)
                        }
                        ForEach(facture.alertes ?? []) { alerte in
                            CarteAlerte(alerte: alerte) {
                                Task { await ignorer(alerte: alerte) }
                            }
                        }
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(14)

                    // Responsable
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Responsable").font(.headline)
                        Picker("Assigner à", selection: Binding(
                            get: { facture.userId ?? 0 },
                            set: { nouvelle in Task { await assigner(utilisateurId: nouvelle) } }
                        )) {
                            Text("Non assignée").tag(0)
                            ForEach(utilisateurs) { utilisateur in
                                Text("\(utilisateur.name) (\(utilisateur.role.rawValue))")
                                    .tag(utilisateur.id)
                            }
                        }
                        .pickerStyle(.menu)
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(14)

                    // Décision
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Décision de validation").font(.headline)
                        TextField("Commentaire (optionnel)", text: $commentaire)
                            .padding(10)
                            .background(Couleurs.grisClair)
                            .cornerRadius(10)

                        BoutonDecision(titre: "Approuver", couleur: Couleurs.bleu) {
                            await valider(.approuve)
                        }
                        BoutonDecision(titre: "Demander correction", couleur: Couleurs.orange) {
                            await valider(.correction)
                        }
                        BoutonDecision(titre: "Rejeter", couleur: .red) {
                            await valider(.rejete)
                        }

                        if facture.statut == .validee {
                            BoutonDecision(titre: "Prête pour Sage", couleur: Couleurs.nuit) {
                                await changerStatut(.pretePourSage)
                            }
                        }
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(14)

                    // Piste d'audit
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Historique (piste d'audit)").font(.headline)
                        if (facture.validations ?? []).isEmpty {
                            Text("Aucune action enregistrée.").font(.footnote).foregroundColor(.gray)
                        }
                        ForEach(facture.validations ?? []) { validation in
                            VStack(alignment: .leading, spacing: 2) {
                                Text("\(validation.decision.rawValue) — \(validation.utilisateur?.name ?? "Utilisateur")")
                                    .font(.footnote.bold())
                                if let texte = validation.commentaire, !texte.isEmpty {
                                    Text("« \(texte) »").font(.caption).foregroundColor(.gray)
                                }
                                Text(validation.dateValidation).font(.caption2).foregroundColor(.gray)
                            }
                            Divider()
                        }
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(14)
                } else {
                    ProgressView().padding(.top, 40)
                }
            }
            .padding()
        }
        .background(Couleurs.grisClair.ignoresSafeArea())
        .navigationTitle("Détail facture")
        .navigationBarTitleDisplayMode(.inline)
        .task { await charger() }
    }

    // MARK: - Actions

    private func charger() async {
        do {
            facture = try await APIClient.shared.facture(id: factureId)
            utilisateurs = (try? await APIClient.shared.utilisateurs()) ?? []
        } catch {
            erreur = error.localizedDescription
        }
    }

    private func valider(_ decision: Decision) async {
        do {
            try await APIClient.shared.valider(factureId: factureId, decision: decision,
                                               commentaire: commentaire.isEmpty ? nil : commentaire)
            message = "Décision « \(decision.rawValue) » enregistrée."
            commentaire = ""
            await charger()
        } catch {
            erreur = error.localizedDescription
        }
    }

    private func changerStatut(_ statut: Statut) async {
        do {
            try await APIClient.shared.changerStatut(factureId: factureId, statut: statut)
            await charger()
        } catch {
            erreur = error.localizedDescription
        }
    }

    private func assigner(utilisateurId: Int) async {
        do {
            try await APIClient.shared.assigner(factureId: factureId, utilisateurId: utilisateurId)
            await charger()
        } catch {
            erreur = error.localizedDescription
        }
    }

    private func ignorer(alerte: Alerte) async {
        do {
            try await APIClient.shared.ignorerAlerte(factureId: factureId, alerteId: alerte.id)
            await charger()
        } catch {
            erreur = error.localizedDescription
        }
    }
}

/// Bouton d'action asynchrone
struct BoutonDecision: View {
    let titre: String
    let couleur: Color
    let action: () async -> Void

    var body: some View {
        Button {
            Task { await action() }
        } label: {
            Text(titre)
                .bold()
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(couleur)
                .foregroundColor(.white)
                .cornerRadius(10)
        }
    }
}
