<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * AuthController : authentification par token Sanctum.
 */
class AuthController extends Controller
{
    /**
     * Liste des rôles autorisés à l'inscription.
     *
     * @var array<int, string>
     */
    private const ROLES_AUTORISES = [
        User::ROLE_COLLABORATEUR,
        User::ROLE_VALIDEUR,
        User::ROLE_COMPTABLE,
        User::ROLE_ADMIN,
    ];

    /**
     * Connexion : vérifie les identifiants et renvoie un token Sanctum.
     */
    public function login(Request $request): JsonResponse
    {
        // Validation des données d'entrée
        $donnees = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Recherche de l'utilisateur par email
        $user = User::where('email', $donnees['email'])->first();

        // Vérification du mot de passe
        if (! $user || ! Hash::check($donnees['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        // Création du token nommé 'comptalink'
        $token = $user->createToken('comptalink')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    /**
     * Inscription d'un nouvel utilisateur.
     */
    public function register(Request $request): JsonResponse
    {
        // Validation des données d'entrée
        $donnees = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
            'role' => ['required', 'string', 'in:'.implode(',', self::ROLES_AUTORISES)],
        ]);

        // Création de l'utilisateur (le mot de passe est haché via le cast 'hashed')
        $user = User::create([
            'name' => $donnees['name'],
            'email' => $donnees['email'],
            'password' => $donnees['password'],
            'role' => $donnees['role'],
        ]);

        // Création du token nommé 'comptalink'
        $token = $user->createToken('comptalink')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ], 201);
    }

    /**
     * Déconnexion : supprime le token courant.
     */
    public function logout(Request $request): JsonResponse
    {
        // Suppression uniquement du token utilisé pour la requête courante
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie.',
        ]);
    }

    /**
     * Renvoie l'utilisateur authentifié.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }
}
