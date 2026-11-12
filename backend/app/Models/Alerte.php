<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modèle Alerte : risque détecté automatiquement sur une facture.
 *
 * NOTE : une alerte est un INDICE (un risque potentiel), pas une certitude.
 */
class Alerte extends Model
{
    use HasFactory;

    /**
     * Les attributs assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'type',
        'message',
        'niveau',
        'ignoree',
        'facture_id',
        'facture_concernee_id',
    ];

    /**
     * Les attributs à caster.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'ignoree' => 'boolean',
        ];
    }

    /**
     * Facture à l'origine de l'alerte.
     */
    public function facture(): BelongsTo
    {
        return $this->belongsTo(Facture::class, 'facture_id');
    }

    /**
     * Facture en conflit (cas du doublon).
     */
    public function factureConcernee(): BelongsTo
    {
        return $this->belongsTo(Facture::class, 'facture_concernee_id');
    }
}
