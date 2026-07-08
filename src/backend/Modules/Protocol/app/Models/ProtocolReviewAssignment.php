<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Protocol\app\Models\Protocol;
use Modules\User\app\Models\Organ;
use Modules\User\app\Models\TeacherProfile;

class ProtocolReviewAssignment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'protocol_id',
        'organ_id',
        'reviewer_one',
        'reviewer_two',
        'review_order',
        'status',
        'assigned_at',
    ];

    protected $casts = [
        'review_order' => 'boolean',
        'assigned_at' => 'datetime',
    ];

    public function protocol()
    {
        return $this->belongsTo(Protocol::class);
    }

    public function organ()
    {
        return $this->belongsTo(Organ::class);
    }

    public function reviewerOne()
    {
        return $this->belongsTo(TeacherProfile::class, 'reviewer_one');
    }

    public function reviewerTwo()
    {
        return $this->belongsTo(TeacherProfile::class, 'reviewer_two');
    }
}
