<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * OcrController : extraction OCR SIMULÉE.
 *
 * ATTENTION : il s'agit d'une SIMULATION côté serveur. Aucun moteur OCR réel
 * (Tesseract, Google Vision...) n'est appelé. Les champs renvoyés sont générés
 * de manière DÉTERMINISTE à partir du nom de fichier, afin de permettre la démo
 * et les tests sans dépendance externe. L'intégration d'un vrai moteur OCR
 * remplacera ultérieurement cette méthode.
 */
class OcrController extends Controller
{
    /**
     * Fournisseurs plausibles pour la simulation.
     *
     * @var array<int, string>
     */
    private const FOURNISSEURS = [
        'Maroc Telecom',
        'ONEE',
        'IAM',
        'Lydec',
        'Fournisseur X',
    ];

    /**
     * Extrait (simule) les champs d'une facture à partir d'un nom de fichier.
     */
    public function extract(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'nom_fichier' => ['required', 'string', 'max:255'],
        ]);

        $nomFichier = $donnees['nom_fichier'];

        // Graine déterministe : même fichier => même résultat
        $graine = crc32($nomFichier);

        // Choix déterministe du fournisseur
        $fournisseur = self::FOURNISSEURS[$graine % count(self::FOURNISSEURS)];

        // Numéro de facture plausible
        $numero = sprintf('FA-%s-%04d', date('Y'), $graine % 10000);

        // Dates : facture il y a quelques jours, échéance = +1 mois
        $dateFacture = Carbon::today()->subDays($graine % 30);
        $dateEcheance = $dateFacture->copy()->addMonth();

        // Montants cohérents avec une TVA à 20 %
        $montantHT = round((($graine % 500000) / 100) + 100, 2);
        $tva = round($montantHT * 0.20, 2);
        $montantTTC = round($montantHT + $tva, 2);

        return response()->json([
            'champs' => [
                'fournisseur' => $fournisseur,
                'numero' => $numero,
                'date_facture' => $dateFacture->format('Y-m-d'),
                'date_echeance' => $dateEcheance->format('Y-m-d'),
                'montant_HT' => $montantHT,
                'tva' => $tva,
                'montant_TTC' => $montantTTC,
                'source' => 'ocr',
            ],
            'confiance' => 0.9,
        ]);
    }
}
