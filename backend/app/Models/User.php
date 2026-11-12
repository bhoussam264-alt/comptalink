<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Modèle User : utilisateur de l'application COMPTALINK.
 *
 * Rôles possibles : Collaborateur, Valideur, Comptable, Admin.
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Constantes de rôles (réutilisables pour les contrôles d'accès).
     */
    public const ROLE_ADMIN = 'Admin';

    public const ROLE_COMPTABLE = 'Comptable';

    public const ROLE_VALIDEUR = 'Valideur';

    public const ROLE_COLLABORATEUR = 'Collaborateur';

    /**
     * Les attributs assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * Les attributs masqués lors de la sérialisation.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Les attributs à caster.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Factures dont cet utilisateur est le responsable.
     */
    public function factures(): HasMany
    {
        return $this->hasMany(Facture::class, 'user_id');
    }

    /**
     * Validations réalisées par cet utilisateur.
     */
    public function validations(): HasMany
    {
        return $this->hasMany(Validation::class, 'user_id');
    }
}
