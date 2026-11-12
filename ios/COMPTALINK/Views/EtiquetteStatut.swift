//
//  EtiquetteStatut.swift
//  COMPTALINK - Composants d'affichage partagés (iOS)
//

import SwiftUI

/// Badge de statut de facture
struct EtiquetteStatut: View {
    let statut: Statut

    var body: some View {
        Text(statut.rawValue)
            .font(.caption.bold())
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(couleurFond.opacity(0.15))
            .foregroundColor(couleurFond)
            .cornerRadius(20)
    }

    private var couleurFond: Color {
        switch statut {
        case .recue: return .gray
        case .aVerifier: return .yellow
        case .enValidation: return Couleurs.orange
        case .validee: return .green
        case .pretePourSage: return Couleurs.bleu
        case .archivee: return .gray
        }
    }
}

/// Carte d'alerte de contrôle (le niveau traduit un risque, pas une certitude)
struct CarteAlerte: View {
    let alerte: Alerte
    var actionIgnorer: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(alerte.type).font(.subheadline.bold())
                if alerte.ignoree {
                    Text("Ignorée").font(.caption2.bold()).foregroundColor(.gray)
                }
            }
            Text(alerte.message).font(.footnote)
            if !alerte.ignoree, let actionIgnorer {
                Button("Ignorer l'alerte", action: actionIgnorer)
                    .font(.caption.bold())
                    .foregroundColor(Couleurs.nuit)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(couleur.opacity(0.12))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(couleur.opacity(0.4)))
        .cornerRadius(10)
    }

    private var couleur: Color {
        switch alerte.niveau {
        case "rouge": return .red
        case "orange": return Couleurs.orange
        default: return .yellow
        }
    }
}

/// Mise en forme des montants en dirhams
func formaterMAD(_ valeur: Double) -> String {
    let formateur = NumberFormatter()
    formateur.numberStyle = .decimal
    formateur.minimumFractionDigits = 2
    formateur.maximumFractionDigits = 2
    formateur.locale = Locale(identifier: "fr_FR")
    let texte = formateur.string(from: NSNumber(value: valeur)) ?? "0,00"
    return "\(texte) MAD"
}
