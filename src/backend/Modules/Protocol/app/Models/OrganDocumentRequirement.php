<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Organization\app\Models\Organ;
use Modules\User\app\Models\User;

class OrganDocumentRequirement extends Model
{
    protected $fillable = [
        'organ_id',
        'document_key',
        'name',
        'description',
        'is_optional',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_optional' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function organ(): BelongsTo
    {
        return $this->belongsTo(Organ::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(OrganDocumentRequirementEvent::class);
    }

    public function scopeActiveForOrgan(Builder $query, string $organType): Builder
    {
        return $query
            ->where('is_active', true)
            ->whereHas('organ', fn (Builder $organQuery) => $organQuery->where('type', $organType))
            ->orderBy('is_optional')
            ->orderBy('name');
    }
}
