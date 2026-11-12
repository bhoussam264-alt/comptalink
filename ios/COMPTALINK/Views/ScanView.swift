//
//  ScanView.swift
//  COMPTALINK - Scan d'une facture sur iOS (VisionKit) + champs OCR modifiables
//
//  Le scan utilise la caméra du iPhone (VisionKit). Les champs proposés proviennent
//  de l'API OCR du backend COMPTALINK (simulée) puis restent MODIFIABLES avant
//  l'enregistrement via POST /api/factures.
//

import SwiftUI
import VisionKit

struct ScanView: View {
    @State private var afficherScanner = false
    @State private var nomFichier = ""
    @State private var enLecture = false
    @State private var erreur: String?
    @State private var message: String?
    @State private var fournisseurs: [Fournisseur] = []

    // Champs de la facture (tous modifiables)
    @State private var fournisseurId: Int = 0
    @State private var numero = ""
    @State private var dateFacture = ""
    @State private var dateEcheance = ""
    @State private var montantHT = ""
    @State private var tva = ""
    @State private var montantTTC = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // Zone de scan
                    VStack(alignment: .leading, spacing: 10) {
                        Text("1. Scanner la facture").font(.headline)
                        Button {
                            afficherScanner = true
                        } label: {
                            HStack {
                                Image(systemName: "doc.viewfinder")
                                Text("Ouvrir la caméra")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Couleurs.bleu)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        if !nomFichier.isEmpty {
                            Text("Document : \(nomFichier)").font(.caption).foregroundColor(.gray)
                        }
                        if enLecture {
                            ProgressView("Lecture OCR en cours…")
                        }
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(14)

                    // Champs proposés
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("2. Vérifier les champs").font(.headline)
                            Spacer()
                            Text("Proposé par OCR - À vérifier")
                                .font(.caption2.bold())
                                .foregroundColor(Couleurs.orange)
                        }

                        Picker("Fournisseur", selection: $fournisseurId) {
                            Text("— Sélectionner —").tag(0)
                            ForEach(fournisseurs) { fournisseur in
                                Text(fournisseur.nom).tag(fournisseur.id)
                            }
                        }
                        .pickerStyle(.menu)

                        ChampSaisie(titre: "N° de facture", valeur: $numero)
                        ChampSaisie(titre: "Date de facture (AAAA-MM-JJ)", valeur: $dateFacture)
                        ChampSaisie(titre: "Date d'échéance (AAAA-MM-JJ)", valeur: $dateEcheance)
                        ChampSaisie(titre: "Montant HT (MAD)", valeur: $montantHT, numerique: true)
                        ChampSaisie(titre: "TVA (MAD)", valeur: $tva, numerique: true)
                        ChampSaisie(titre: "Montant TTC (MAD)", valeur: $montantTTC, numerique: true)

                        Button {
                            Task { await enregistrer() }
                        } label: {
                            Text("Confirmer les champs")
                                .bold()
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Couleurs.nuit)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(14)

                    if let erreur { Text(erreur).font(.footnote).foregroundColor(.red) }
                    if let message { Text(message).font(.footnote).foregroundColor(.green) }
                }
                .padding()
            }
            .background(Couleurs.grisClair.ignoresSafeArea())
            .navigationTitle("Nouvelle facture")
            .sheet(isPresented: $afficherScanner) {
                ScannerDocument { images in
                    Task { await traiterScan(images) }
                }
            }
            .task {
                fournisseurs = await chargerFournisseurs()
            }
        }
    }

    /// Charge la liste des fournisseurs (GET /api/fournisseurs)
    private func chargerFournisseurs() async -> [Fournisseur] {
        (try? await APIClient.shared.fournisseurs()) ?? []
    }

    /// Traitement du document scanné : simulation d'extraction OCR côté API
    private func traiterScan(_ images: [UIImage]) async {
        guard let premiere = images.first else { return }
        enLecture = true
        defer { enLecture = false }

        nomFichier = "scan_\(Int(Date().timeIntervalSince1970)).jpg"

        // Date du jour comme valeur par défaut
        let formateur = DateFormatter()
        formateur.dateFormat = "yyyy-MM-dd"
        let aujourdhui = formateur.string(from: Date())
        dateFacture = aujourdhui
        dateEcheance = aujourdhui

        // Simulation : un vrai projet brancherait ici l'API OCR du backend
        // (POST /api/ocr/extract) ou un moteur embarqué (Vision / ML Kit).
        if fournisseurId == 0, let premier = fournisseurs.first {
            fournisseurId = premier.id
        }
        numero = "SCAN-\(Int(Date().timeIntervalSince1970))"
        montantHT = "1000.00"
        tva = "200.00"
        montantTTC = "1200.00"

        _ = premiere // l'image scannée est disponible pour un envoi vers le backend
    }

    /// Création de la facture dans COMPTALINK
    private func enregistrer() async {
        erreur = nil
        guard fournisseurId != 0 else {
            erreur = "Veuillez sélectionner un fournisseur."
            return
        }
        do {
            let champs: [String: Any] = [
                "numero": numero,
                "date_facture": dateFacture,
                "date_echeance": dateEcheance,
                "montant_HT": Double(montantHT) ?? 0,
                "tva": Double(tva) ?? 0,
                "montant_TTC": Double(montantTTC) ?? 0,
                "fournisseur_id": fournisseurId,
                "source": "ocr",
                "fichier": nomFichier,
            ]
            _ = try await APIClient.shared.creerFacture(champs: champs)
            message = "Facture enregistrée : les contrôles COMPTALINK ont été appliqués."
        } catch {
            erreur = error.localizedDescription
        }
    }
}

/// Champ de saisie étiqueté
struct ChampSaisie: View {
    let titre: String
    @Binding var valeur: String
    var numerique = false

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(titre).font(.caption).foregroundColor(.gray)
            TextField(titre, text: $valeur)
                .keyboardType(numerique ? .decimalPad : .default)
                .padding(10)
                .background(Couleurs.grisClair)
                .cornerRadius(10)
        }
    }
}

/// Enveloppe SwiftUI du scanner de documents VisionKit
struct ScannerDocument: UIViewControllerRepresentable {
    let onScan: ([UIImage]) -> Void

    func makeUIViewController(context: Context) -> VNDocumentCameraViewController {
        let controleur = VNDocumentCameraViewController()
        controleur.delegate = context.coordinator
        return controleur
    }

    func updateUIViewController(_ uiViewController: VNDocumentCameraViewController, context: Context) {}

    func makeCoordinator() -> Coordinateur {
        Coordinateur(onScan: onScan)
    }

    /// Coordinateur délégué du scanner
    final class Coordinateur: NSObject, VNDocumentCameraViewControllerDelegate {
        let onScan: ([UIImage]) -> Void

        init(onScan: @escaping ([UIImage]) -> Void) {
            self.onScan = onScan
        }

        func documentCameraViewController(_ controller: VNDocumentCameraViewController,
                                          didFinishWith scan: VNDocumentCameraScan) {
            var images: [UIImage] = []
            for index in 0..<scan.pageCount {
                images.append(scan.imageOfPage(at: index))
            }
            controller.dismiss(animated: true)
            onScan(images)
        }

        func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
            controller.dismiss(animated: true)
        }
    }
}
