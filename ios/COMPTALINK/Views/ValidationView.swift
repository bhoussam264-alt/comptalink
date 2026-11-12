//
//  ValidationView.swift
//  COMPTALINK - File de validation iOS (factures en attente de décision)
//

import SwiftUI

struct ValidationView: View {
    @State private var factures: [Facture] = []
    @State private var erreur: String?
    @State private var commentaires: [Int: String] = [:]

    var body: some View {
        NavigationStack {
            Group {
                if let erreur {
                    Text(erreur).font(.footnote).foregroundColor(.red).padding()
                } else if factures.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "checkmark.seal")
                            .font(.system(size: 40)).foregroundColor(Couleurs.bleu)
                        Text("Aucune facture à valider").font(.headline)
                        Text("Toutes les factures assignées ont été traitées.")
                            .font(.footnote).foregroundColor(.gray)
                    }
                    .padding(.top, 60)
                } else {
                    List(factures) { facture in
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text(facture.numero).font(.subheadline.bold())
                                Spacer()
                                Text(formaterMAD(facture.montantTTC)).font(.footnote.bold())
                            }
                            Text("\(facture.fournisseur?.nom ?? "—") · Échéance \(facture.dateEcheance)")
                                .font(.caption).foregroundColor(.gray)

                            ForEach(facture.alertesActives) { alerte in
                                Text("\(alerte.type) : \(alerte.message)")
                                    .font(.caption2)
                                    .foregroundColor(alerte.niveau == "rouge" ? .red : Couleurs.orange)
                            }

                            TextField("Commentaire de décision", text: Binding(
                                get: { commentaires[facture.id] ?? "" },
                                set: { commentaires[facture.id] = $0 }
                            ))
                            .textFieldStyle(.roundedBorder)

                            HStack(spacing: 8) {
                                BoutonCompact(titre: "Approuver", couleur: Couleurs.bleu) {
                                    await decider(facture, .approuve)
                                }
                                BoutonCompact(titre: "Correction", couleur: Couleurs.orange) {
                                    await decider(facture, .correction)
                                }
                                BoutonCompact(titre: "Rejeter", couleur: .red) {
                                    await decider(facture, .rejete)
                                }
                            }
                        }
                        .padding(.vertical, 6)
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Validation")
            .task { await charger() }
            .refreshable { await charger() }
        }
    }

    private func charger() async {
        do {
            factures = try await APIClient.shared.factures(statut: .enValidation)
            erreur = nil
        } catch {
            erreur = error.localizedDescription
        }
    }

    private func decider(_ facture: Facture, _ decision: Decision) async {
        do {
            try await APIClient.shared.valider(factureId: facture.id, decision: decision,
                                               commentaire: commentaires[facture.id])
            commentaires[facture.id] = ""
            await charger()
        } catch {
            erreur = error.localizedDescription
        }
    }
}

/// Petit bouton d'action pour les listes
struct BoutonCompact: View {
    let titre: String
    let couleur: Color
    let action: () async -> Void

    var body: some View {
        Button {
            Task { await action() }
        } label: {
            Text(titre)
                .font(.caption.bold())
                .padding(.horizontal, 10)
                .padding(.vertical, 7)
                .background(couleur.opacity(0.15))
                .foregroundColor(couleur)
                .cornerRadius(8)
        }
    }
}
