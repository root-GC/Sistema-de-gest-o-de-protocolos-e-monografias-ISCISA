<?php
// Modules/Defense/app/Models/DefenseFinalDocument.php

namespace Modules\Defense\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DefenseFinalDocument extends Model
{
    protected $fillable = [
        'defense_id', 'submitted_by', 'file_name', 'file_path', 'version',
        'status', 'validated_by', 'validation_notes', 'validated_at',
    ];

    protected $casts = ['validated_at' => 'datetime'];

    public function defense(): BelongsTo
    {
        return $this->belongsTo(Defense::class);
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(\Modules\User\app\Models\User::class, 'submitted_by');
    }

    public function validatedBy(): BelongsTo
    {
        return $this->belongsTo(\Modules\User\app\Models\User::class, 'validated_by');
    }
}