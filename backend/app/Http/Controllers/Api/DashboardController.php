<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use App\Models\Validation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

/**
 * DashboardController : données agrégées pour le tableau de bord.
 */
class DashboardController extends Controller
{
    /**
     * Renvoie l'ensemble des indicateurs du tableau de bord.
     */
    public function index(): JsonResponse
    {
        $aujourdhui = Carbon::today();
        $dans30Jours = Carbon::today()->addDays(30);
        $debutMois = Carbon::now()->startOfMonth();
        $finMois = Carbon::now()->endOfMonth();

        // --- Cartes de synthèse ---
        $facturesEnAttente = Facture::whereIn('statut', [
            Facture::STATUT_RECUE,
            Facture::STATUT_A_VERIFIER,
            Facture::STATUT_EN_VALIDATION,
        ])->count();

        $echeancesProchesTotal = Facture::where('statut', '!=', Facture::STATUT_ARCHIVEE)
            ->whereBetween('date_echeance', [$aujourdhui, $dans30Jours])
            ->count();

        $enRetard = Facture::where('statut', '!=', Facture::STATUT_ARCHIVEE)
            ->where('date_echeance', '<', $aujourdhui)
            ->count();

        $valideesCeMois = Validation::where('decision', Validation::DECISION_APPROUVE)
            ->whereBetween('date_validation', [$debutMois, $finMois])
            ->count();

        // --- Répartition par statut (y compris les statuts à 0) ---
        $compteursParStatut = Facture::selectRaw('statut, count(*) as total')
            ->groupBy('statut')
            ->pluck('total', 'statut');

        $parStatut = [];
        foreach (Facture::STATUTS as $statut) {
            $parStatut[] = [
                'statut' => $statut,
                'total' => (int) ($compteursParStatut[$statut] ?? 0),
            ];
        }

        // --- 5 prochaines échéances (non archivées, dans les 30 jours) ---
        $echeancesProches = Facture::with('fournisseur')
            ->where('statut', '!=', Facture::STATUT_ARCHIVEE)
            ->whereBetween('date_echeance', [$aujourdhui, $dans30Jours])
            ->orderBy('date_echeance')
            ->limit(5)
            ->get();

        // --- 8 dernières actions de validation ---
        $dernieresActions = Validation::with(['user', 'facture'])
            ->orderByDesc('date_validation')
            ->limit(8)
            ->get();

        return response()->json([
            'cartes' => [
                'factures_en_attente' => $facturesEnAttente,
                'echeances_proches' => $echeancesProchesTotal,
                'en_retard' => $enRetard,
                'validees_ce_mois' => $valideesCeMois,
            ],
            'par_statut' => $parStatut,
            'echeances_proches' => $echeancesProches,
            'dernieres_actions' => $dernieresActions,
        ]);
    }
}
