<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use App\Models\Validation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ValidationController : enregistrement des décisions de validation.
 */
class ValidationController extends Controller
{
    /**
     * Liste des validations, filtrable par facture_id.
     */
    public function index(Request $request): JsonResponse
    {
        $requete = Validation::with(['user', 'facture'])->latest('date_validation');

        // Filtre optionnel sur une facture donnée
        if ($request->filled('facture_id')) {
            $requete->where('facture_id', $request->query('facture_id'));
        }

        return response()->json($requete->get());
    }

    /**
     * Enregistre une décision de validation et met à jour le statut de la facture.
     *
     * Mapping des statuts :
     *  - Approuvé   => 'Validée'
     *  - Correction => 'À vérifier'
     *  - Rejeté     => 'Archivée'
     */
    public function store(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'facture_id' => ['required', 'exists:factures,id'],
            'decision' => ['required', 'string', 'in:Approuvé,Rejeté,Correction'],
            'commentaire' => ['nullable', 'string'],
        ]);

        // Création de la validation : date du jour et valideur = utilisateur connecté
        $validation = Validation::create([
            'date_validation' => now(),
            'decision' => $donnees['decision'],
            'commentaire' => $donnees['commentaire'] ?? null,
            'facture_id' => $donnees['facture_id'],
            'user_id' => $request->user()->id,
        ]);

        // Mise à jour du statut de la facture selon la décision
        $facture = Facture::findOrFail($donnees['facture_id']);

        $facture->statut = match ($donnees['decision']) {
            Validation::DECISION_APPROUVE => Facture::STATUT_VALIDEE,
            Validation::DECISION_CORRECTION => Facture::STATUT_A_VERIFIER,
            Validation::DECISION_REJETE => Facture::STATUT_ARCHIVEE,
        };

        $facture->save();

        return response()->json($validation->load(['user', 'facture']), 201);
    }
}
