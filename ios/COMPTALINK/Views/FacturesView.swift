//
//  FacturesView.swift
//  COMPTALINK - Liste des factures iOS (recherche + filtre par statut)
//

import SwiftUI

struct FacturesView: View {
    @State private var factures: [Facture] = []
    @State private var recherche = ""
    @State private var statutFiltre: Statut?
    @State private var erreur: String?
    @State private var enChargement = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 10) {
                // Filtres
                Picker("Statut", selection: $statutFiltre) {
                    Text("Tous").tag(Statut?.none)
                    ForEach(Statut.allCases, id: \.self) { statut in
                        Text(statut.rawValue).tag(Statut?.some(statut))
                    }
                }
                .pickerStyle(.menu)
                .padding(.horizontal)

                if let erreur {
                    Text(erreur).font(.footnote).foregroundColor(.red)
                }

                if enChargement {
                    ProgressView().padding(.top, 30)
                }

                List(factures) { facture in
                    NavigationLink(destination: FactureDetailView(factureId: facture.id)) {
                        VStack(alignment: .leading, spacing: 5) {
                            HStack {
                                Text(facture.numero).font(.subheadline.bold())
                                Spacer()
                                EtiquetteStatut(statut: facture.statut)
                            }
                            Text(facture.fournisseur?.nom ?? "—")
                                .font(.caption).foregroundColor(.gray)
                            HStack {
                                Text("Échéance : \(facture.dateEcheance)")
                                    .font(.caption2).foregroundColor(.gray)
                                Spacer()
                                Text(formaterMAD(facture.montantTTC))
                                    .font(.caption.bold()).foregroundColor(Couleurs.nuit)
                            }
                            if !facture.alertesActives.isEmpty {
                                Text("\(facture.alertesActives.count) alerte(s) à vérifier")
                                    .font(.caption2.bold())
                                    .foregroundColor(Couleurs.orange)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
                .listStyle(.plain)
            }
            .searchable(text: $recherche, prompt: "N° de facture ou fournisseur")
            .onChange(of: recherche) { _, _ in Task { await charger() } }
            .onChange(of: statutFiltre) { _, _ in Task { await charger() } }
            .navigationTitle("Mes Factures")
            .task { await charger() }
            .refreshable { await charger() }
        }
    }

    /// Recharge la liste depuis GET /api/factures
    private func charger() async {
        enChargement = true
        do {
            factures = try await APIClient.shared.factures(statut: statutFiltre, recherche: recherche)
            erreur = nil
        } catch {
            erreur = error.localizedDescription
        }
        enChargement = false
    }
}
