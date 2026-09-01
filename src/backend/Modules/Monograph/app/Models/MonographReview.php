<?php

namespace Modules\Monograph\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonographReview extends Model
{
    protected $fillable = [
        'stage',
        'decision',
        'reason',
        'decided_at',
        'decided_by_user_id',
        'decided_by_role',
    ];

    protected $casts = [
        'decided_at' => 'datetime'
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(
            MonographSubmission::class,
            'monograph_submission_id'
        );
    }

    public function decidedBy(): BelongsTo
    {
        return $this->belongsTo(
            \Modules\User\app\Models\User::class,
            'decided_by_user_id'
        );
    }
}
