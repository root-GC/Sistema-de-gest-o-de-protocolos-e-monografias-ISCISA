<?php

namespace Modules\Organization\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Auth\app\Models\User;

class CoordinatorProfile extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'scientific_area_id',
        'course_id',
        'office',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scientificArea(): BelongsTo
    {
        return $this->belongsTo(ScientificArea::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}