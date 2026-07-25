<?php

namespace Modules\Monograph\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonographComment extends Model
{
    protected $fillable = [
        'monograph_submission_id', 'commented_by_user_id',
        'commented_by_role', 'comment',
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(MonographSubmission::class, 'monograph_submission_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(\Modules\User\app\Models\User::class, 'commented_by_user_id');
    }
}