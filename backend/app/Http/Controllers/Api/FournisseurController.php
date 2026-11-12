<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Fournisseur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * FournisseurController : CRUD des fournisseurs.
 */
class FournisseurController extends Controller
{
    /**
     * Liste des fournisseurs avec le nombre de factures associées.
     */
    public function index(): JsonResponse
    {
        $fournisseurs = Fournisseur::withCount('factures')
            ->orderBy('nom')
            ->get();

        return response()->json($fournisseurs);
    }

    /**
     * Création d'un fournisseur.
     */
    public function store(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'ice' => ['nullable', 'string', 'max:255', 'unique:fournisseurs,ice'],
            'telephone' => ['nullable', 'string', 'max:255'],
        ]);

        $fournisseur = Fournisseur::create($donnees);

        return response()->json($fournisseur, 201);
    }

    /**
     * Détail d'un fournisseur.
     */
    public function show(Fournisseur $fournisseur): JsonResponse
    {
        // On charge le compteur de factures pour le détail
        $fournisseur->loadCount('factures');

        return response()->json($fournisseur);
    }

    /**
     * Mise à jour d'un fournisseur.
     */
    public function update(Request $request, Fournisseur $fournisseur): JsonResponse
    {
        $donnees = $request->validate([
            'nom' => ['sometimes', 'required', 'string', 'max:255'],
            'ice' => ['nullable', 'string', 'max:255', 'unique:fournisseurs,ice,'.$fournisseur->id],
            'telephone' => ['nullable', 'string', 'max:255'],
        ]);

        $fournisseur->update($donnees);

        return response()->json($fournisseur);
    }

    /**
     * Suppression d'un fournisseur.
     */
    public function destroy(Fournisseur $fournisseur): JsonResponse
    {
        $fournisseur->delete();

        return response()->json(['message' => 'Fournisseur supprimé.']);
    }
}
