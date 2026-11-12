<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécute la migration : création de la table des pièces justificatives.
     *
     * Une pièce justificative est un document rattaché à une facture
     * (bon de livraison, bon de commande, reçu de paiement...).
     */
    public function up(): void
    {
        Schema::create('pieces_justificatives', function (Blueprint $table) {
            $table->id();
            $table->string('nom_fichier');                              // Nom lisible du fichier
            $table->string('chemin');                                   // Chemin de stockage (disque public)
            $table->foreignId('facture_id')->constrained('factures')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Annule la migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('pieces_justificatives');
    }
};
