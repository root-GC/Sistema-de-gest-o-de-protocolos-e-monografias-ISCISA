<?php

namespace Modules\Monograph\app\Models;

use Modules\Monograph\app\Enums\MonographStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany, HasOne};

class Monograph extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'protocol_id',
        'student_id',
        'supervisor_id',
        'code',
        'title',
        'status',
        'supervisor_endorsed_at',
        'submitted_at',
    ];

    protected $casts = [
        'status' => MonographStatus::class,
        'supervisor_endorsed_at' => 'datetime',
        'submitted_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(\Modules\User\app\Models\User::class, 'student_id');
    }

    public function supervisor(): BelongsTo
{
    return $this->belongsTo(\Modules\User\app\Models\TeacherProfile::class, 'supervisor_id');
}

    public function submissions(): HasMany
    {
        return $this->hasMany(MonographSubmission::class)->orderBy('version');
    }

    public function latestSubmission(): HasOne
    {
        return $this->hasOne(MonographSubmission::class)->latestOfMany('version');
    }

    public function defense(): HasOne
    {
        return $this->hasOne(\Modules\Defense\app\Models\Defense::class);
    }
}