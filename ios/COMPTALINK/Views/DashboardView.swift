//
//  DashboardView.swift
//  COMPTALINK - Tableau de bord iOS (4 cartes + échéances proches)
//

import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var session: SessionStore

    @State private var tableau: TableauDeBord?
    @State private var erreur: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    if let erreur {
                        Text(erreur).font(.footnote).foregroundColor(.red)
                    }

                    if let tableau {
                        // 4 cartes de synthèse
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            CarteStat(titre: "En attente",
                                      valeur: tableau.cartes.facturesEnAttente,
                                      couleur: Couleurs.bleu)
                            CarteStat(titre: "Échéances proches",
                                      valeur: tableau.cartes.echeancesProches,
                                      couleur: Couleurs.orange)
                            CarteStat(titre: "En retard",
                                      valeur: tableau.cartes.enRetard,
                                      couleur: .red)
                            CarteStat(titre: "Validées ce mois",
                                      valeur: tableau.cartes.valideesCeMois,
                                      couleur: .green)
                        }

                        // Répartition par statut
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Factures par statut").font(.headline)
                            ForEach(tableau.parStatut) { element in
                                HStack {
                                    Text(element.statut.rawValue).font(.footnote)
                                    Spacer()
                                    Text("\(element.total)").font(.footnote.bold())
                                }
                                ProgressView(value: Double(element.total),
                                             total: Double(max(1, tableau.parStatut.map(\.total).max() ?? 1)))
                                    .tint(Couleurs.bleu)
                            }
                        }
                        .padding()
                        .background(Color.white)
                        .cornerRadius(14)

                        // Échéances proches
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Échéances proches").font(.headline)
                            if tableau.echeancesProches.isEmpty {
                                Text("Aucune échéance dans les 30 jours.")
                                    .font(.footnote).foregroundColor(.gray)
                            }
                            ForEach(tableau.echeancesProches) { facture in
                                HStack {
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(facture.numero).font(.subheadline.bold())
                                        Text(facture.fournisseur?.nom ?? "—")
                                            .font(.caption).foregroundColor(.gray)
                                        Text("Échéance : \(facture.dateEcheance)")
                                            .font(.caption2).foregroundColor(Couleurs.orange)
                                    }
                                    Spacer()
                                    VStack(alignment: .trailing, spacing: 4) {
                                        Text(formaterMAD(facture.montantTTC))
                                            .font(.footnote.bold())
                                        EtiquetteStatut(statut: facture.statut)
                                    }
                                }
                                Divider()
                            }
                        }
                        .padding()
                        .background(Color.white)
                        .cornerRadius(14)
                    } else {
                        ProgressView("Chargement du tableau de bord…")
                            .padding(.top, 40)
                    }
                }
                .padding()
            }
            .background(Couleurs.grisClair.ignoresSafeArea())
            .navigationTitle("COMPTALINK")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Quitter") {
                        Task { await session.deconnexion() }
                    }
                }
            }
            .task {
                do {
                    tableau = try await APIClient.shared.tableauDeBord()
                } catch {
                    erreur = error.localizedDescription
                }
            }
        }
    }
}

/// Carte de statistique
struct CarteStat: View {
    let titre: String
    let valeur: Int
    let couleur: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(titre).font(.caption).foregroundColor(.gray)
                Spacer()
                Circle().fill(couleur).frame(width: 10, height: 10)
            }
            Text("\(valeur)").font(.title.bold()).foregroundColor(Couleurs.nuit)
        }
        .padding()
        .background(Color.white)
        .cornerRadius(14)
    }
}
