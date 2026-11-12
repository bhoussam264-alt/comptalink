<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécute la migration : création de la table des factures fournisseurs.
     *
     * Statuts possibles : Reçue, À vérifier, En validation, Validée, Prête pour Sage, Archivée.
     */
    public function up(): void
    {
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->string('numero');                                   // Numéro de facture fournisseur
            $table->date('date_facture');                               // Date d'émission de la facture
            $table->date('date_echeance');                              // Date d'échéance de règlement
            $table->decimal('montant_HT', 12, 2);                       // Montant hors taxes
            $table->decimal('tva', 12, 2);                              // Montant de la TVA
            $table->decimal('montant_TTC', 12, 2);                      // Montant toutes taxes comprises
            $table->string('statut')->default('Reçue');                 // Statut dans le workflow
            // Fournisseur émetteur : suppression en cascade si le fournisseur est supprimé
            $table->foreignId('fournisseur_id')->constrained('fournisseurs')->cascadeOnDelete();
            // Responsable interne de la facture (nullable) : passe à NULL si l'utilisateur est supprimé
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('source')->nullable();                       // Origine : 'ocr', 'manuel', 'email'...
            $table->string('fichier')->nullable();                      // Chemin du fichier original
            $table->timestamps();
        });
    }

    /**
     * Annule la migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
