<?php

namespace Database\Seeders;

use App\Models\Fournisseur;
use Illuminate\Database\Seeder;

/**
 * FournisseurSeeder : création des fournisseurs marocains de démonstration.
 *
 * Les ICE sont des identifiants à 15 chiffres (format marocain).
 */
class FournisseurSeeder extends Seeder
{
    /**
     * Exécute le seeder.
     */
    public function run(): void
    {
        $fournisseurs = [
            ['nom' => 'Maroc Telecom', 'ice' => '001234567000012', 'telephone' => '+212 537 71 00 00'],
            ['nom' => 'ONEE', 'ice' => '002345678000023', 'telephone' => '+212 522 66 00 00'],
            ['nom' => 'IAM', 'ice' => '003456789000034', 'telephone' => '+212 522 20 00 00'],
            ['nom' => 'Lydec', 'ice' => '004567890000045', 'telephone' => '+212 522 20 30 00'],
            ['nom' => 'Fournisseur X', 'ice' => '005678901000056', 'telephone' => '+212 522 00 00 00'],
        ];

        foreach ($fournisseurs as $donnees) {
            Fournisseur::updateOrCreate(
                ['ice' => $donnees['ice']],
                $donnees
            );
        }
    }
}
