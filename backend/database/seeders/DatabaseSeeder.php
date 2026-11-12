<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * DatabaseSeeder : point d'entrée du seeding.
 *
 * Ordre important : utilisateurs et fournisseurs d'abord, puis factures
 * (qui dépendent des deux premiers).
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Exécute les seeders de l'application.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            FournisseurSeeder::class,
            FactureSeeder::class,
        ]);
    }
}
