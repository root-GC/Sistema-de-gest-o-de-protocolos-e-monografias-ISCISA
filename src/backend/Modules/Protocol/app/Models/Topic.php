<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\User\app\Models\TeacherProfile;
use Modules\User\app\Models\Course;
use Modules\User\app\Models\ScientificArea;
use Modules\User\app\Models\User;

class Topic extends Model
{
    use SoftDeletes;

    public const STATUS_PENDING_SUPERVISOR = 'topic_pending_supervisor';
    public const STATUS_PENDING_NUCLEO = 'topic_pending_nucleo';
    public const STATUS_ASSIGNED = 'topic_assigned_for_review';
    public const STATUS_IN_REVIEW = 'topic_in_review';
    public const STATUS_APPROVED_NUCLEO = 'topic_approved_nucleo';
    public const STATUS_REJECTED_SUPERVISOR = 'topic_rejected_supervisor';
    public const STATUS_REJECTED_NUCLEO = 'topic_rejected_nucleo';

    public const SUPERVISOR_STATUS_PENDING = 'pending';
    public const SUPERVISOR_STATUS_APPROVED = 'approved';
    public const SUPERVISOR_STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'student_id',
        'supervisor_id',
        'scientific_area_id',
        'course_id',
        'title',
        'status',
        'supervisor_status',
        'justification',
        'document_path',
        'document_name',
        'supervisor_comment',
        'supervisor_decision_at',
        'submitted_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'supervisor_decision_at' => 'datetime',
    ];

    protected $appends = [
        'status_label',
        'has_document',
    ];

    protected $hidden = [
        'document_path',
    ];

    public function getHasDocumentAttribute(): bool
    {
        return ! empty($this->document_path);
    }

    public static function rejectedStatuses(): array
    {
        return [
            self::STATUS_REJECTED_SUPERVISOR,
            self::STATUS_REJECTED_NUCLEO,
            'topic_rejected',
        ];
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'topic_pending' => 'Aguardando aprovação do supervisor',
            'topic_approved' => 'Aguardando aprovação do Nucleo Cientifico',
            'topic_rejected' => 'Não aprovado pelo supervisor',
            self::STATUS_PENDING_SUPERVISOR => 'Aguardando aprovação do supervisor',
            self::STATUS_PENDING_NUCLEO => 'Aguardando atribuição de avaliadores',
            self::STATUS_ASSIGNED => 'Avaliadores atribuídos, em revisão',
            self::STATUS_IN_REVIEW => 'Em revisão pelo Nucleo Cientifico',
            self::STATUS_APPROVED_NUCLEO => 'Aprovado pelo Nucleo Cientifico',
            self::STATUS_REJECTED_SUPERVISOR => 'Não aprovado pelo supervisor',
            self::STATUS_REJECTED_NUCLEO => 'Não aprovado pelo Nucleo Cientifico',
            default => $this->status,
        };
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function supervisor()
    {
        return $this->belongsTo(TeacherProfile::class, 'supervisor_id');
    }

    public function scientificArea()
    {
        return $this->belongsTo(ScientificArea::class, 'scientific_area_id');
    }

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function reviewAssignments()
    {
        return $this->hasMany(TopicReviewAssignment::class);
    }

    public function reviewEvaluations()
    {
        return $this->hasMany(TopicReviewEvaluation::class);
    }

    public function reviewComments()
    {
        return $this->hasMany(TopicReviewComment::class);
    }

    public function histories()
    {
        return $this->hasMany(TopicHistory::class);
    }

    public function reviewers()
    {
        return $this->hasManyThrough(
            TeacherProfile::class,
            TopicReviewAssignment::class,
            'topic_id',
            'id',
            'id',
            'reviewer_id'
        );
    }

    public function protocols()
    {
        return $this->hasMany(Protocol::class);
    }
}
