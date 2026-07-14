<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\User\app\Models\TeacherProfile;
use Modules\User\app\Models\Organ;
use Modules\User\app\Models\User;

class Protocol extends Model
{
    use SoftDeletes;

    public const STATUS_PENDING_SUPERVISOR = 'protocol_pending_supervisor';
    public const STATUS_REJECTED_SUPERVISOR = 'protocol_rejected_supervisor';
    public const STATUS_PENDING_NUCLEO = 'protocol_pending_nucleo';
    public const STATUS_IN_REVIEW_NUCLEO = 'protocol_in_review_nucleo';
    public const STATUS_PENDING_COMITE_CIENTIFICO = 'protocol_pending_comite_cientifico';
    public const STATUS_PENDING_COMITE_BIOETICA = 'protocol_pending_comite_bioetica';
    public const STATUS_APPROVED_FINAL = 'protocol_approved_final';
    public const STATUS_REJECTED_FINAL = 'protocol_rejected_final';

    protected $fillable = [
        'student',
        'supervisor_id',
        'current_organ_id',
        'code',
        'topic_id',
        'approved_by_supervisor',
        'protocol_type',
        'submission_number',
        'status',
        'version',
        'submitted_at',
        'supervisor_decision_at',
        'justification',
        'nc_version',
        'cc_version',
        'cb_version',
    ];

    protected $casts = [
        'approved_by_supervisor' => 'boolean',
        'submitted_at' => 'datetime',
        'supervisor_decision_at' => 'datetime',
        'submission_number' => 'integer',
        'nc_version' => 'integer',
        'cc_version' => 'integer',
        'cb_version' => 'integer',
    ];

    protected $appends = [
        'status_label',
    ];

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING_SUPERVISOR => 'Aguardando aprovacao do supervisor',
            self::STATUS_REJECTED_SUPERVISOR => 'Rejeitado pelo supervisor',
            self::STATUS_PENDING_NUCLEO => 'Encaminhado ao Nucleo Cientifico',
            self::STATUS_IN_REVIEW_NUCLEO => 'Em avaliacao pelo Nucleo Cientifico',
            self::STATUS_PENDING_COMITE_CIENTIFICO => 'Encaminhado ao Comite Cientifico',
            self::STATUS_PENDING_COMITE_BIOETICA => 'Encaminhado ao Comite de Bioetica',
            self::STATUS_APPROVED_FINAL => 'Aprovado',
            self::STATUS_REJECTED_FINAL => 'Rejeitado',
            default => $this->status,
        };
    }

    public function topic()
    {
        return $this->belongsTo(Topic::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student');
    }

    public function currentOrgan()
    {
        return $this->belongsTo(Organ::class, 'current_organ_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function latestDocument()
    {
        return $this->hasOne(Document::class)->latest('version');
    }

    public function reviewAssignments()
    {
        return $this->hasMany(ProtocolReviewAssignment::class);
    }

        public function supervisor()
    {
        return $this->belongsTo(TeacherProfile::class, 'supervisor_id');
    }
}
