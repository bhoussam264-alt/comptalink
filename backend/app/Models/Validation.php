<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modèle Validation : décision d'un utilisateur sur une facture.
 */
class Validation extends Model
{
    use HasFactory;

    /**
     * Décisions possibles d'une validation.
     */
    public const DECISION_APPROUVE = 'Approuvé';

    public const DECISION_REJETE = 'Rejeté';

    public const DECISION_CORRECTION = 'Correction';

    /**
     * Les attributs assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'date_validation',
        'decision',
        'commentaire',
        'facture_id',
        'user_id',
    ];

    /**
     * Les attributs à caster.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_validation' => 'datetime',
        ];
    }

    /**
     * Facture concernée par la validation.
     */
    public function facture(): BelongsTo
    {
        return $this->belongsTo(Facture::class, 'facture_id');
    }

    /**
     * Utilisateur ayant réalisé la validation.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
