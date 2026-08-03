<?php
// Modules/Defense/app/Models/DefenseJury.php

namespace Modules\Defense\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};

class DefenseJury extends Model
{
    use SoftDeletes;

    protected $fillable = ['teacher_id', 'jury_role'];

    public function defense(): BelongsTo
    {
        return $this->belongsTo(Defense::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(\Modules\User\app\Models\TeacherProfile::class, 'teacher_id');
    }

    public function availabilityResponses(): HasMany
    {
        return $this->hasMany(DefenseJuryAvailability::class);
    }
}