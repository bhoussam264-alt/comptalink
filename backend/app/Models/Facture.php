<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modèle Facture : facture fournisseur gérée dans COMPTALINK.
 */
class Facture extends Model
{
    use HasFactory;

    /**
     * Statuts possibles du workflow d'une facture.
     */
    public const STATUT_RECUE = 'Reçue';

    public const STATUT_A_VERIFIER = 'À vérifier';

    public const STATUT_EN_VALIDATION = 'En validation';

    public const STATUT_VALIDEE = 'Validée';

    public const STATUT_PRETE_SAGE = 'Prête pour Sage';

    public const STATUT_ARCHIVEE = 'Archivée';

    /**
     * Liste complète des statuts autorisés.
     *
     * @var array<int, string>
     */
    public const STATUTS = [
        self::STATUT_RECUE,
        self::STATUT_A_VERIFIER,
        self::STATUT_EN_VALIDATION,
        self::STATUT_VALIDEE,
        self::STATUT_PRETE_SAGE,
        self::STATUT_ARCHIVEE,
    ];

    /**
     * Les attributs assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'numero',
        'date_facture',
        'date_echeance',
        'montant_HT',
        'tva',
        'montant_TTC',
        'statut',
        'fournisseur_id',
        'user_id',
        'source',
        'fichier',
    ];

    /**
     * Les attributs à caster.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_facture' => 'date',
            'date_echeance' => 'date',
            'montant_HT' => 'decimal:2',
            'tva' => 'decimal:2',
            'montant_TTC' => 'decimal:2',
        ];
    }

    /**
     * Fournisseur émetteur de la facture.
     */
    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(Fournisseur::class, 'fournisseur_id');
    }

    /**
     * Responsable interne de la facture.
     */
    public function responsable(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Validations associées à la facture.
     */
    public function validations(): HasMany
    {
        return $this->hasMany(Validation::class, 'facture_id');
    }

    /**
     * Alertes (risques détectés) associées à la facture.
     */
    public function alertes(): HasMany
    {
        return $this->hasMany(Alerte::class, 'facture_id');
    }

    /**
     * Pièces justificatives rattachées à la facture.
     */
    public function piecesJustificatives(): HasMany
    {
        return $this->hasMany(PieceJustificative::class, 'facture_id');
    }
}
