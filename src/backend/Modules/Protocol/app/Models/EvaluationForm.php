<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EvaluationForm extends Model
{
    use SoftDeletes;

    public const FORM_TYPE_EVALUATION = 'evaluation';
    public const FORM_TYPE_HARMONIZATION = 'harmonization';

    public const STATUS_PENDING_REVIEW = 'pending_review';
    public const STATUS_IN_REVIEW = 'in_review';
    public const STATUS_CONCLUDED = 'concluded';

    protected $fillable = [
        'protocol_id',
        'version',
        'form_type',
        'parent_form_id',
        'organ',
        'status',
        'final_decision',
        'harmonized_decision',
        'harmonized_at',
        'decided_by',
        'decided_at',
        'conclusion_summary',
    ];

    protected $casts = [
        'decided_at' => 'datetime',
        'harmonized_at' => 'datetime',
    ];

    public function protocol()
    {
        return $this->belongsTo(Protocol::class);
    }

    public function formCriteria()
    {
        return $this->hasMany(EvaluationFormCriterion::class, 'evaluation_form_id');
    }

    public function reviewerEvaluations()
    {
        return $this->hasMany(ReviewerEvaluation::class, 'evaluation_form_id');
    }

    public function opinions()
    {
        return $this->hasMany(Opinion::class, 'evaluation_form_id');
    }

    public function decidedBy()
    {
        return $this->belongsTo(\Modules\User\app\Models\User::class, 'decided_by');
    }

    public function parentForm()
    {
        return $this->belongsTo(self::class, 'parent_form_id');
    }

    public function childForms()
    {
        return $this->hasMany(self::class, 'parent_form_id');
    }

    public function isEvaluation(): bool
    {
        return $this->form_type === self::FORM_TYPE_EVALUATION;
    }

    public function isHarmonization(): bool
    {
        return $this->form_type === self::FORM_TYPE_HARMONIZATION;
    }

    public function needsHarmonization(): bool
    {
        return $this->reviewerEvaluations()
            ->where('needs_deliberation', true)
            ->exists();
    }

    public function hasAllSubmitted(): bool
    {
        return ! $this->reviewerEvaluations()
            ->whereNotIn('status', [ReviewerEvaluation::STATUS_SUBMITTED])
            ->exists();
    }

    public function hasAnyNotApproved(): bool
    {
        return $this->reviewerEvaluations()
            ->where('decision', ReviewerEvaluation::DECISION_NOT_APPROVED)
            ->exists();
    }
}
