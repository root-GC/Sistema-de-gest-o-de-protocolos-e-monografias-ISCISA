<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Protocol\app\Models\TopicReviewEvaluation;
use Modules\User\app\Models\TeacherProfile;
use Modules\User\app\Models\User;

class TopicReviewAssignment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'topic_id',
        'reviewer_id',
        'assigned_by_id',
        'assigned_at',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
    ];

    public function topic()
    {
        return $this->belongsTo(Topic::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(TeacherProfile::class, 'reviewer_id');
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by_id');
    }

    public function evaluation()
    {
        return $this->hasOne(TopicReviewEvaluation::class, 'assignment_id');
    }
}
