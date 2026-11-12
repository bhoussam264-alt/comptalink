<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * UserSeeder : création des comptes de démonstration COMPTALINK.
 *
 * Mot de passe commun à tous les comptes de démo : 123456
 */
class UserSeeder extends Seeder
{
    /**
     * Exécute le seeder.
     */
    public function run(): void
    {
        $utilisateurs = [
            ['name' => 'Administrateur', 'email' => 'admin@comptalink.ma', 'role' => User::ROLE_ADMIN],
            ['name' => 'Comptable Démo', 'email' => 'comptable@comptalink.ma', 'role' => User::ROLE_COMPTABLE],
            ['name' => 'Valideur Démo', 'email' => 'valideur@comptalink.ma', 'role' => User::ROLE_VALIDEUR],
            ['name' => 'Collaborateur Démo', 'email' => 'collab@comptalink.ma', 'role' => User::ROLE_COLLABORATEUR],
        ];

        foreach ($utilisateurs as $donnees) {
            // Le mot de passe est haché automatiquement par le cast 'hashed' du modèle User
            User::updateOrCreate(
                ['email' => $donnees['email']],
                [
                    'name' => $donnees['name'],
                    'password' => '123456',
                    'role' => $donnees['role'],
                ]
            );
        }
    }
}
