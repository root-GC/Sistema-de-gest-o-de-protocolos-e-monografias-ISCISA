<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluationCriterionReview extends Model
{
    protected $fillable = [
        'reviewer_evaluation_id',
        'evaluation_form_criterion_id',
        'comment',
    ];

    public function reviewerEvaluation()
    {
        return $this->belongsTo(ReviewerEvaluation::class, 'reviewer_evaluation_id');
    }

    public function formCriterion()
    {
        return $this->belongsTo(EvaluationFormCriterion::class, 'evaluation_form_criterion_id');
    }
}
