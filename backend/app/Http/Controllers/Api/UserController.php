<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * UserController : gestion des utilisateurs.
 *
 * - index : accessible à tout utilisateur authentifié (alimente la liste déroulante "Responsable").
 * - store / update / destroy : réservés au rôle Admin.
 */
class UserController extends Controller
{
    /**
     * Liste de tous les utilisateurs.
     */
    public function index(): JsonResponse
    {
        // Tri par nom pour une liste déroulante stable
        $utilisateurs = User::orderBy('name')->get();

        return response()->json($utilisateurs);
    }

    /**
     * Création d'un utilisateur (Admin uniquement).
     */
    public function store(Request $request): JsonResponse
    {
        // Contrôle du rôle : seul un Admin peut créer un utilisateur
        if ($request->user()->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $donnees = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'string', 'in:Collaborateur,Valideur,Comptable,Admin'],
        ]);

        $donnees['password'] = Hash::make($donnees['password']);

        $utilisateur = User::create($donnees);

        return response()->json($utilisateur, 201);
    }

    /**
     * Mise à jour d'un utilisateur (Admin uniquement).
     */
    public function update(Request $request, User $user): JsonResponse
    {
        // Contrôle du rôle : seul un Admin peut modifier un utilisateur
        if ($request->user()->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $donnees = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['sometimes', 'nullable', 'string', 'min:6'],
            'role' => ['sometimes', 'required', 'string', 'in:Collaborateur,Valideur,Comptable,Admin'],
        ]);

        // On ne modifie le mot de passe que s'il est fourni
        if (! empty($donnees['password'])) {
            $donnees['password'] = Hash::make($donnees['password']);
        } else {
            unset($donnees['password']);
        }

        $user->update($donnees);

        return response()->json($user);
    }

    /**
     * Suppression d'un utilisateur (Admin uniquement).
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        // Contrôle du rôle : seul un Admin peut supprimer un utilisateur
        if ($request->user()->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        // Sécurité : empêcher l'auto-suppression du compte connecté
        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'Impossible de supprimer votre propre compte.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé.']);
    }
}
