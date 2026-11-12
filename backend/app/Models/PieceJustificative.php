<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modèle PieceJustificative : document rattaché à une facture.
 */
class PieceJustificative extends Model
{
    use HasFactory;

    /**
     * Nom explicite de la table (le pluriel automatique serait incorrect).
     *
     * @var string
     */
    protected $table = 'pieces_justificatives';

    /**
     * Les attributs assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nom_fichier',
        'chemin',
        'facture_id',
    ];

    /**
     * Facture à laquelle la pièce est rattachée.
     */
    public function facture(): BelongsTo
    {
        return $this->belongsTo(Facture::class, 'facture_id');
    }
}
