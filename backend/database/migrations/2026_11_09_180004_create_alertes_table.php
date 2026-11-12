<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécute la migration : création de la table des alertes.
     *
     * Les alertes représentent des RISQUES détectés automatiquement
     * (TVA incohérente, doublon, champ manquant...).
     */
    public function up(): void
    {
        Schema::create('alertes', function (Blueprint $table) {
            $table->id();
            $table->string('type');                                     // Ex : "TVA incohérente", "Doublon", "Champ manquant"
            $table->string('message');                                  // Message explicatif affiché à l'utilisateur
            $table->string('niveau')->default('orange');                // rouge | orange | jaune
            $table->boolean('ignoree')->default(false);                 // Le comptable peut ignorer une alerte
            $table->foreignId('facture_id')->constrained('factures')->cascadeOnDelete();
            // Facture en conflit (ex : doublon) : nullable, passe à NULL si elle est supprimée
            $table->foreignId('facture_concernee_id')->nullable()->constrained('factures')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Annule la migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('alertes');
    }
};
