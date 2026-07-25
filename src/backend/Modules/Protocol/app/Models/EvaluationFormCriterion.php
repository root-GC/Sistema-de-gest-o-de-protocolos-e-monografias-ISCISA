<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluationFormCriterion extends Model
{
    protected $fillable = [
        'evaluation_form_id',
        'criterion_id',
        'group_name',
        'criterion_name',
        'order_column',
    ];

    protected $casts = [
        'order_column' => 'integer',
    ];

    public function evaluationForm()
    {
        return $this->belongsTo(EvaluationForm::class, 'evaluation_form_id');
    }

    public function criterion()
    {
        return $this->belongsTo(EvaluationCriterion::class, 'criterion_id');
    }

    public function criterionReviews()
    {
        return $this->hasMany(EvaluationCriterionReview::class, 'evaluation_form_criterion_id');
    }
}
