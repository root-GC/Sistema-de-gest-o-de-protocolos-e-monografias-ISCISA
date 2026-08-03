<?php
// Modules/Defense/app/Models/Defense.php

namespace Modules\Defense\app\Models;

use Modules\Defense\app\Enums\DefenseStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};

class Defense extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'monograph_id', 'coordinator_id', 'status', 'scheduled_at', 'location',
        'final_grade', 'requires_corrections', 'corrections_notes', 'minutes_file_path',
    ];

    protected $casts = [
        'status' => DefenseStatus::class,
        'scheduled_at' => 'datetime',
        'final_grade' => 'decimal:2',
        'requires_corrections' => 'boolean',
    ];

    public function monograph(): BelongsTo
    {
        return $this->belongsTo(\Modules\Monograph\app\Models\Monograph::class);
    }

    public function coordinator(): BelongsTo
    {
        return $this->belongsTo(\Modules\User\app\Models\TeacherProfile::class, 'coordinator_id');
    }

    public function jury(): HasMany
    {
        return $this->hasMany(DefenseJury::class);
    }

    public function finalDocuments(): HasMany
    {
        return $this->hasMany(DefenseFinalDocument::class)->orderBy('version');
    }

    public function latestFinalDocument(): ?DefenseFinalDocument
    {
        return $this->finalDocuments()->latest('version')->first();
    }
}