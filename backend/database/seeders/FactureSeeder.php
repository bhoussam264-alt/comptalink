<?php

namespace Database\Seeders;

use App\Models\Alerte;
use App\Models\Facture;
use App\Models\Fournisseur;
use App\Models\PieceJustificative;
use App\Models\User;
use App\Models\Validation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * FactureSeeder : création des factures de démonstration COMPTALINK.
 *
 * Le jeu de données couvre les 6 statuts, inclut des échéances proches et en retard,
 * un doublon volontaire (pour l'alerte "Doublon") et une incohérence de TVA
 * (pour l'alerte rouge "TVA incohérente").
 */
class FactureSeeder extends Seeder
{
    /**
     * Exécute le seeder.
     */
    public function run(): void
    {
        // Récupération des référentiels créés par les seeders précédents
        $fournisseurs = Fournisseur::pluck('id', 'nom');
        $userCollab = User::where('email', 'collab@comptalink.ma')->first();
        $userValideur = User::where('email', 'valideur@comptalink.ma')->first();
        $userComptable = User::where('email', 'comptable@comptalink.ma')->first();

        // Référence temporelle : aujourd'hui (fuseau Africa/Casablanca)
        $aujourdhui = Carbon::today();

        // -----------------------------------------------------------------
        // Définition des factures de démonstration
        // Chaque entrée : [clé, numero, fournisseur, HT, TVA, TTC, statut, date_facture, date_echeance, responsable, source]
        // -----------------------------------------------------------------
        $definitions = [
            // 1 - Reçue, échéance proche (+20 j)
            ['f1', 'FA-2026-001', 'Maroc Telecom', 1000.00, 200.00, 1200.00, Facture::STATUT_RECUE, -5, 20, $userCollab, 'manuel'],
            // 2 - À vérifier (issue de l'OCR), échéance proche (+10 j)
            ['f2', 'EN-2026-002', 'ONEE', 2500.00, 500.00, 3000.00, Facture::STATUT_A_VERIFIER, -10, 10, $userCollab, 'ocr'],
            // 3 - En validation, EN RETARD (-5 j)
            ['f3', 'IA-2026-003', 'IAM', 800.00, 160.00, 960.00, Facture::STATUT_EN_VALIDATION, -20, -5, $userValideur, 'manuel'],
            // 4 - Validée, EN RETARD (-10 j)
            ['f4', 'LY-2026-004', 'Lydec', 1500.00, 300.00, 1800.00, Facture::STATUT_VALIDEE, -40, -10, $userComptable, 'manuel'],
            // 5 - Prête pour Sage, échéance proche (+25 j)
            ['f5', 'FX-2026-005', 'Fournisseur X', 5000.00, 1000.00, 6000.00, Facture::STATUT_PRETE_SAGE, -30, 25, $userComptable, 'manuel'],
            // 6 - DOUBLON volontaire de la facture #1 (même fournisseur + numéro + TTC)
            ['f6', 'FA-2026-001', 'Maroc Telecom', 1000.00, 200.00, 1200.00, Facture::STATUT_RECUE, -3, 27, $userCollab, 'email'],
            // 7 - TVA INCOHÉRENTE volontaire (1000 + 250 = 1250 <> 1200), échéance proche (+15 j)
            ['f7', 'EN-2026-007', 'ONEE', 1000.00, 250.00, 1200.00, Facture::STATUT_A_VERIFIER, -8, 15, $userCollab, 'manuel'],
            // 8 - Archivée (échéance dépassée)
            ['f8', 'IA-2026-008', 'IAM', 750.00, 150.00, 900.00, Facture::STATUT_ARCHIVEE, -60, -30, $userComptable, 'manuel'],
        ];

        /** @var array<string, Facture> $factures */
        $factures = [];

        foreach ($definitions as $def) {
            [$cle, $numero, $nomFournisseur, $ht, $tva, $ttc, $statut, $joursFacture, $joursEcheance, $responsable, $source] = $def;

            $factures[$cle] = Facture::create([
                'numero' => $numero,
                'fournisseur_id' => $fournisseurs[$nomFournisseur],
                'montant_HT' => $ht,
                'tva' => $tva,
                'montant_TTC' => $ttc,
                'statut' => $statut,
                'date_facture' => $aujourdhui->copy()->addDays($joursFacture),
                'date_echeance' => $aujourdhui->copy()->addDays($joursEcheance),
                'user_id' => $responsable?->id,
                'source' => $source,
                'fichier' => "factures/{$numero}.pdf",
            ]);
        }

        // -----------------------------------------------------------------
        // Alertes de démonstration
        // NOTE : ces alertes reprennent les règles de contrôle du FactureController
        // (des RISQUES / INDICES, pas des certitudes). Elles sont insérées ici pour
        // que la démo présente immédiatement des alertes après le seeding.
        // -----------------------------------------------------------------

        // Alerte rouge : incohérence TVA sur la facture #7
        Alerte::create([
            'type' => 'TVA incohérente',
            'niveau' => 'rouge',
            'message' => 'Incohérence constatée : HT (1 000,00) + TVA (250,00) = 1 250,00, alors que le TTC saisi est 1 200,00 (écart de 50,00).',
            'facture_id' => $factures['f7']->id,
        ]);

        // Alerte orange : doublon entre la facture #6 et la facture #1
        Alerte::create([
            'type' => 'Doublon',
            'niveau' => 'orange',
            'message' => 'Doublon potentiel : une facture identique existe déjà (n° '.$factures['f1']->numero.').',
            'facture_id' => $factures['f6']->id,
            'facture_concernee_id' => $factures['f1']->id,
        ]);

        // -----------------------------------------------------------------
        // Validations de démonstration
        // -----------------------------------------------------------------
        Validation::create([
            'date_validation' => Carbon::now()->subDays(4),
            'decision' => Validation::DECISION_APPROUVE,
            'commentaire' => 'Facture vérifiée et approuvée, montants conformes au bon de commande.',
            'facture_id' => $factures['f4']->id,
            'user_id' => $userComptable->id,
        ]);

        Validation::create([
            'date_validation' => Carbon::now()->subDays(2),
            'decision' => Validation::DECISION_CORRECTION,
            'commentaire' => 'TVA à corriger : le total TTC ne correspond pas au calcul HT + TVA.',
            'facture_id' => $factures['f7']->id,
            'user_id' => $userValideur->id,
        ]);

        Validation::create([
            'date_validation' => Carbon::now()->subDays(29),
            'decision' => Validation::DECISION_REJETE,
            'commentaire' => 'Facture rejetée : prestation non justifiée, archivée sans paiement.',
            'facture_id' => $factures['f8']->id,
            'user_id' => $userComptable->id,
        ]);

        // -----------------------------------------------------------------
        // Pièces justificatives de démonstration
        // -----------------------------------------------------------------
        $pieces = [
            ['f1', 'bon_livraison_FA-2026-001.pdf'],
            ['f4', 'bon_commande_LY-2026-004.pdf'],
            ['f5', 'devis_FX-2026-005.pdf'],
        ];

        foreach ($pieces as [$cle, $nomFichier]) {
            PieceJustificative::create([
                'nom_fichier' => $nomFichier,
                'chemin' => 'pieces_justificatives/'.$nomFichier,
                'facture_id' => $factures[$cle]->id,
            ]);
        }
    }
}
