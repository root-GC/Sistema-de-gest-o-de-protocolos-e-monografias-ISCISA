<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EvaluationForm extends Model
{
    use SoftDeletes;

    public const STATUS_PENDING_REVIEW = 'pending_review';
    public const STATUS_IN_REVIEW = 'in_review';
    public const STATUS_CONCLUDED = 'concluded';

    protected $fillable = [
        'protocol_id',
        'version',
        'organ',
        'status',
        'final_decision',
        'decided_by',
        'decided_at',
        'conclusion_summary',
    ];

    protected $casts = [
        'decided_at' => 'datetime',
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
}
