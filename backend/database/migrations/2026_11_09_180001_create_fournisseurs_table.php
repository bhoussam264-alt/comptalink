<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécute la migration : création de la table des fournisseurs.
     */
    public function up(): void
    {
        Schema::create('fournisseurs', function (Blueprint $table) {
            $table->id();
            $table->string('nom');                          // Raison sociale du fournisseur
            $table->string('ice')->nullable()->unique();    // Identifiant Commun de l'Entreprise (15 chiffres)
            $table->string('telephone')->nullable();        // Téléphone de contact
            $table->timestamps();                           // created_at / updated_at
        });
    }

    /**
     * Annule la migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('fournisseurs');
    }
};
