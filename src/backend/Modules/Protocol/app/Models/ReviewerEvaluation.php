<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\User\app\Models\TeacherProfile;

class ReviewerEvaluation extends Model
{
    use SoftDeletes;

    public const STATUS_PENDING = 'pending';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_SUBMITTED = 'submitted';

    protected $fillable = [
        'evaluation_form_id',
        'protocol_review_assignment_id',
        'reviewer_id',
        'overall_comment',
        'recommendation',
        'status',
        'submitted_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    public function evaluationForm()
    {
        return $this->belongsTo(EvaluationForm::class, 'evaluation_form_id');
    }

    public function protocolReviewAssignment()
    {
        return $this->belongsTo(ProtocolReviewAssignment::class, 'protocol_review_assignment_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(TeacherProfile::class, 'reviewer_id');
    }

    public function criterionReviews()
    {
        return $this->hasMany(EvaluationCriterionReview::class, 'reviewer_evaluation_id');
    }
}
