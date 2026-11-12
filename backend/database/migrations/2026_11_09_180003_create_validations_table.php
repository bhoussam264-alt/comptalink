<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécute la migration : création de la table des validations.
     *
     * Une validation trace la décision d'un utilisateur sur une facture
     * (Approuvé, Rejeté, Correction).
     */
    public function up(): void
    {
        Schema::create('validations', function (Blueprint $table) {
            $table->id();
            $table->dateTime('date_validation');                        // Horodatage de la décision
            $table->string('decision');                                 // Approuvé | Rejeté | Correction
            $table->text('commentaire')->nullable();                    // Commentaire libre du valideur
            $table->foreignId('facture_id')->constrained('factures')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete(); // Valideur
            $table->timestamps();
        });
    }

    /**
     * Annule la migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('validations');
    }
};
