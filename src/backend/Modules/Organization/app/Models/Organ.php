<?php

namespace Modules\Organization\Models;

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

    public function scientificAreas(): HasMany
    {
        return $this->hasMany(ScientificArea::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(OrganMember::class);
    }

    public function secretaries(): HasMany
    {
        return $this->hasMany(SecretaryProfile::class);
    }
}