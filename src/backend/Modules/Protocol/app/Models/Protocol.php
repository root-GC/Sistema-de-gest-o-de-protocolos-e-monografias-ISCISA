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
    public const STATUS_DOCUMENTS_PENDING_CC = 'protocol_documents_pending_cc';
    public const STATUS_DOCUMENTS_PENDING_CIBS = 'protocol_documents_pending_cibs';
    public const STATUS_PENDING_COMITE_CIENTIFICO = 'protocol_pending_comite_cientifico';
    public const STATUS_IN_REVIEW_COMITE_CIENTIFICO = 'protocol_in_review_comite_cientifico';
    public const STATUS_PARECER_PENDING_CC_SIGNATURE = 'protocol_parecer_pending_cc_signature';
    public const STATUS_PENDING_COMITE_BIOETICA = 'protocol_pending_comite_bioetica';
    public const STATUS_IN_REVIEW_COMITE_BIOETICA = 'protocol_in_review_comite_bioetica';
    public const STATUS_PARECER_PENDING_CIBS_SIGNATURE = 'protocol_parecer_pending_cibs_signature';
    public const STATUS_REJECTED_NUCLEO = 'protocol_rejected_nucleo';
    public const STATUS_REJECTED_CC = 'protocol_rejected_cc';
    public const STATUS_REJECTED_BIOETICA = 'protocol_rejected_bioetica';
    public const STATUS_APPROVED_FINAL = 'protocol_approved_final';
    public const STATUS_REJECTED_FINAL = 'protocol_rejected_final';

    public const ORGAN_NUCLEO = 'nucleo';
    public const ORGAN_COMITE_CIENTIFICO = 'comite_cientifico';
    public const ORGAN_COMITE_BIOETICA = 'comite_bioetica';

    public const ORGAN_TYPE_NUCLEUS = 'nucleus';
    public const ORGAN_TYPE_SCIENTIFIC_COMMITTEE = 'scientific_committee';
    public const ORGAN_TYPE_BIOETHICS_COMMITTEE = 'bioethics_committee';

    public const ORGAN_FLOW = [
        self::ORGAN_TYPE_NUCLEUS => [
            'next_status' => self::STATUS_PENDING_COMITE_CIENTIFICO,
            'in_review_status' => self::STATUS_IN_REVIEW_NUCLEO,
            'next_organ_type' => self::ORGAN_TYPE_SCIENTIFIC_COMMITTEE,
            'next_form_organ' => self::ORGAN_COMITE_CIENTIFICO,
            'version_prefix' => 'CC_V',
            'version_field' => 'cc_version',
        ],
        self::ORGAN_TYPE_SCIENTIFIC_COMMITTEE => [
            'next_status' => self::STATUS_PENDING_COMITE_BIOETICA,
            'in_review_status' => self::STATUS_IN_REVIEW_COMITE_CIENTIFICO,
            'next_organ_type' => self::ORGAN_TYPE_BIOETHICS_COMMITTEE,
            'next_form_organ' => self::ORGAN_COMITE_BIOETICA,
            'version_prefix' => 'CIBS_V',
            'version_field' => 'cb_version',
        ],
        self::ORGAN_TYPE_BIOETHICS_COMMITTEE => [
            'next_status' => self::STATUS_APPROVED_FINAL,
            'in_review_status' => self::STATUS_IN_REVIEW_COMITE_BIOETICA,
            'next_organ_type' => null,
            'next_form_organ' => null,
            'version_prefix' => null,
            'version_field' => null,
        ],
    ];

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

    public static function rejectedStatuses(): array
    {
        return [
            self::STATUS_REJECTED_SUPERVISOR,
            self::STATUS_REJECTED_NUCLEO,
            self::STATUS_REJECTED_CC,
            self::STATUS_REJECTED_BIOETICA,
            self::STATUS_REJECTED_FINAL,
        ];
    }

    public static function resubmittableStatuses(): array
    {
        return self::rejectedStatuses();
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING_SUPERVISOR => 'Aguardando aprovacao do supervisor',
            self::STATUS_REJECTED_SUPERVISOR => 'Não aprovado pelo supervisor',
            self::STATUS_PENDING_NUCLEO => 'Encaminhado ao Nucleo Cientifico',
            self::STATUS_IN_REVIEW_NUCLEO => 'Em avaliacao pelo Nucleo Cientifico',
            self::STATUS_DOCUMENTS_PENDING_CC => 'Aguardando validacao dos anexos pelo Comite Cientifico',
            self::STATUS_DOCUMENTS_PENDING_CIBS => 'Aguardando validacao dos anexos pelo Comite de Bioetica',
            self::STATUS_PENDING_COMITE_CIENTIFICO => 'Encaminhado ao Comite Cientifico',
            self::STATUS_IN_REVIEW_COMITE_CIENTIFICO => 'Em avaliacao pelo Comite Cientifico',
            self::STATUS_PARECER_PENDING_CC_SIGNATURE => 'Parecer do Comite Cientifico a aguardar assinatura',
            self::STATUS_PENDING_COMITE_BIOETICA => 'Encaminhado ao Comite de Bioetica',
            self::STATUS_IN_REVIEW_COMITE_BIOETICA => 'Em avaliacao pelo Comite de Bioetica',
            self::STATUS_PARECER_PENDING_CIBS_SIGNATURE => 'Parecer do Comite de Bioetica a aguardar assinatura',
            self::STATUS_REJECTED_NUCLEO => 'Não aprovado pelo Núcleo Científico',
            self::STATUS_REJECTED_CC => 'Não aprovado pelo Comité Científico',
            self::STATUS_REJECTED_BIOETICA => 'Não aprovado pelo Comite de Bioetica',
            self::STATUS_APPROVED_FINAL => 'Aprovado',
            self::STATUS_REJECTED_FINAL => 'Não aprovado (final)',
            default => $this->status,
        };
    }

    public static function organTypeFromFormOrgan(string $organ): ?string
    {
        return match ($organ) {
            self::ORGAN_NUCLEO, self::ORGAN_TYPE_NUCLEUS => self::ORGAN_TYPE_NUCLEUS,
            self::ORGAN_COMITE_CIENTIFICO, self::ORGAN_TYPE_SCIENTIFIC_COMMITTEE => self::ORGAN_TYPE_SCIENTIFIC_COMMITTEE,
            self::ORGAN_COMITE_BIOETICA, self::ORGAN_TYPE_BIOETHICS_COMMITTEE => self::ORGAN_TYPE_BIOETHICS_COMMITTEE,
            default => null,
        };
    }

    public static function formOrganFromOrganType(string $organType): ?string
    {
        return match ($organType) {
            self::ORGAN_TYPE_NUCLEUS => self::ORGAN_NUCLEO,
            self::ORGAN_TYPE_SCIENTIFIC_COMMITTEE => self::ORGAN_COMITE_CIENTIFICO,
            self::ORGAN_TYPE_BIOETHICS_COMMITTEE => self::ORGAN_COMITE_BIOETICA,
            default => null,
        };
    }

    public static function submissionVersionLabel(int $submissionNumber): string
    {
        return 'V' . max(1, $submissionNumber);
    }

    public static function organVersionLabel(string $organType, int $versionNumber = 1): ?string
    {
        $versionNumber = max(1, $versionNumber);

        return match ($organType) {
            self::ORGAN_TYPE_NUCLEUS => 'NC_V' . $versionNumber,
            self::ORGAN_TYPE_SCIENTIFIC_COMMITTEE => 'CC_V' . $versionNumber,
            self::ORGAN_TYPE_BIOETHICS_COMMITTEE => 'CIBS_V' . $versionNumber,
            default => null,
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

    public function histories()
    {
        return $this->hasMany(ProtocolHistory::class);
    }

    public function opinions()
    {
        return $this->hasMany(Opinion::class);
    }

    public function protocolDocumentRequirements()
    {
        return $this->hasMany(ProtocolDocumentRequirement::class);
    }

    public function supervisor()
    {
        return $this->belongsTo(TeacherProfile::class, 'supervisor_id');
    }
}
