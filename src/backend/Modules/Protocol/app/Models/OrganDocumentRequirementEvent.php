<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Organization\app\Models\Organ;
use Modules\User\app\Models\User;

class OrganDocumentRequirementEvent extends Model
{
    protected $fillable = [
        'organ_document_requirement_id',
        'organ_id',
        'actor_id',
        'action',
        'old_values',
        'new_values',
        'occurred_at',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'occurred_at' => 'datetime',
    ];

    public function requirement(): BelongsTo
    {
        return $this->belongsTo(OrganDocumentRequirement::class, 'organ_document_requirement_id');
    }

    public function organ(): BelongsTo
    {
        return $this->belongsTo(Organ::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
