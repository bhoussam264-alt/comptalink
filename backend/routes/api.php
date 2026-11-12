<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FactureController;
use App\Http\Controllers\Api\FournisseurController;
use App\Http\Controllers\Api\OcrController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ValidationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes de l'API COMPTALINK
|--------------------------------------------------------------------------
| Préfixe automatique : /api (défini dans bootstrap/app.php).
*/

// --- Routes publiques (authentification) ---
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register'])->name('register');

// --- Routes protégées par Sanctum ---
Route::middleware('auth:sanctum')->group(function () {
    // Authentification de l'utilisateur connecté
    Route::get('/me', [AuthController::class, 'me'])->name('me');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Gestion des utilisateurs (store/update/destroy réservés à l'Admin dans le contrôleur)
    Route::apiResource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);

    // Gestion des fournisseurs
    Route::apiResource('fournisseurs', FournisseurController::class);

    // Gestion des factures
    Route::apiResource('factures', FactureController::class);

    // Actions spécifiques sur les factures
    Route::post('/factures/{facture}/statut', [FactureController::class, 'changerStatut'])->name('factures.statut');
    Route::post('/factures/{facture}/assigner', [FactureController::class, 'assigner'])->name('factures.assigner');
    Route::post('/factures/{facture}/ignorer-alerte', [FactureController::class, 'ignorerAlerte'])->name('factures.ignorer-alerte');
    Route::post('/factures/{facture}/pieces-justificatives', [FactureController::class, 'uploadPieceJustificative'])->name('factures.pieces-justificatives');
    Route::post('/factures/{facture}/transferer-email', [FactureController::class, 'transfererEmail'])->name('factures.transferer-email');

    // Validations
    Route::get('/validations', [ValidationController::class, 'index'])->name('validations.index');
    Route::post('/validations', [ValidationController::class, 'store'])->name('validations.store');

    // Tableau de bord
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // OCR (simulation côté serveur)
    Route::post('/ocr/extract', [OcrController::class, 'extract'])->name('ocr.extract');
});
