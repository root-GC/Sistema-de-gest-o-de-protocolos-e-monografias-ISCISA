<?php

namespace Modules\Organization\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Auth\app\Models\User;

class SecretaryProfile extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'organ_id',
        'scientific_area_id',
        'office',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function organ(): BelongsTo
    {
        return $this->belongsTo(Organ::class);
    }

    public function scientificArea(): BelongsTo
    {
        return $this->belongsTo(ScientificArea::class);
    }
}