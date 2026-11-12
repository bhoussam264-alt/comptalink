<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modèle Fournisseur : fournisseur de biens ou de services.
 */
class Fournisseur extends Model
{
    use HasFactory;

    /**
     * Les attributs assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nom',
        'ice',
        'telephone',
    ];

    /**
     * Factures rattachées à ce fournisseur.
     */
    public function factures(): HasMany
    {
        return $this->hasMany(Facture::class, 'fournisseur_id');
    }
}
