<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EvaluationForm extends Model
{
    use SoftDeletes;

    public const FORM_TYPE_EVALUATION = 'evaluation';
    public const FORM_TYPE_DELIBERATION = 'deliberation';
    public const STATUS_PENDING_REVIEW = 'pending_review';
    public const STATUS_IN_REVIEW = 'in_review';
    public const STATUS_CONCLUDED = 'concluded';
    public const STATUS_DELIBERATION_PENDING = 'deliberation_pending';
    public const STATUS_DELIBERATION_SCHEDULED = 'deliberation_scheduled';
    public const STATUS_IN_DELIBERATION = 'in_deliberation';
    public const STATUS_DELIBERATED = 'deliberated';         // houve consenso — vai para decisão final
    public const STATUS_NOT_DELIBERATED = 'not_deliberated'; // sem consenso — aguarda nova marcação

    protected $fillable = [
        'protocol_id',
        'version',
        'form_type',
        'parent_form_id',
        'organ',
        'status',
        'final_decision',
        'decided_by',
        'decided_at',
        'conclusion_summary',
        'deliberation_date',
        'deliberation_location',
        'deliberation_scheduled_by',
    ];

    protected $casts = [
        'decided_at' => 'datetime',
        'deliberation_date' => 'datetime',
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

    public function deliberationScheduledBy()
    {
        return $this->belongsTo(\Modules\User\app\Models\User::class, 'deliberation_scheduled_by');
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

    public function isDeliberation(): bool
    {
        return $this->form_type === self::FORM_TYPE_DELIBERATION;
    }

    public function needsDeliberation(): bool
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
