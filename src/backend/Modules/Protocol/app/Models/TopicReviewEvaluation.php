<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Protocol\app\Models\TopicReviewAssignment;
use Modules\User\app\Models\TeacherProfile;

class TopicReviewEvaluation extends Model
{
    use SoftDeletes;

    public const DECISION_APPROVED = 'approved';
    public const DECISION_REJECTED = 'rejected';

    protected $fillable = [
        'topic_id',
        'assignment_id',
        'reviewer_id',
        'decision',
        'comments',
        'evaluated_at',
    ];

    protected $casts = [
        'evaluated_at' => 'datetime',
    ];

    public function topic()
    {
        return $this->belongsTo(Topic::class);
    }

    public function assignment()
    {
        return $this->belongsTo(TopicReviewAssignment::class, 'assignment_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(TeacherProfile::class, 'reviewer_id');
    }
}
