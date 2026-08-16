<?php

namespace Modules\Organization\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organ extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'type',
        'description',
    ];

    // nucleus | scientific_committee | bioethics_committee | scientific_direction
    const TYPES = [
        'nucleus',
        'scientific_committee',
        'bioethics_committee',
        'scientific_direction',
    ];

    /**
     * Áreas científicas associadas a este órgão (apenas núcleos)
     */
    public function scientificAreas(): HasMany
    {
        return $this->hasMany(ScientificArea::class, 'organ_id');
    }

    /**
     * Membros do órgão
     */
    public function members(): HasMany
    {
        return $this->hasMany(OrganMember::class);
    }

    /**
     * Secretários associados a este órgão
     */
    public function secretaries(): HasMany
    {
        return $this->hasMany(SecretaryProfile::class);
    }

    /**
     * Perfis de administrador associados a este órgão
     */
    public function adminProfiles(): HasMany
    {
        return $this->hasMany(AdminProfile::class);
    }

    /**
     * Único órgão que autoriza criar os outros 3 executivos + coordenadores.
     * Centralizado aqui para não espalhar comparações de string pelos controllers.
     */
    public function isScientificDirection(): bool
    {
        return $this->type === 'scientific_direction';
    }

    /**
     * Verifica se o órgão é um núcleo
     */
    public function isNucleus(): bool
    {
        return $this->type === 'nucleus';
    }
}