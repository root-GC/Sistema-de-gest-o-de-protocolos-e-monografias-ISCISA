<?php

namespace Modules\Organization\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'scientific_area_id',
        'name',
        'code',
    ];

    public function scientificArea(): BelongsTo
    {
        return $this->belongsTo(ScientificArea::class);
    }

    public function studentProfiles(): HasMany
    {
        return $this->hasMany(StudentProfile::class);
    }

    // public function coordinatorProfiles(): HasMany
    // {
    //     return $this->hasMany(CoordinatorProfile::class);
    // }

    public function coordinator()
    {
        return $this->hasOne(CoordinatorProfile::class);
    }
    
}