<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Modules\User\app\Models\User;

class ProtocolDocumentRequirement extends Model
{
    public const ORGAN_CC = 'comite_cientifico';

    public const ORGAN_CIBS = 'comite_bioetica';

    public const CC_REQUIRED_DOCUMENTS = [
        'cover_letter' => 'Carta de cobertura',
        'credentials' => 'Credenciais',
        'originality_declaration' => 'Declaração de originalidade',
        'academic_record_declaration' => 'Declaração do registo académico',
        'financial_statement_declaration' => 'Declaração do extracto financeiro',
        'authors_responsibility_list' => 'Lista de autores e responsabilidade',
        'folha_info_instrucoes' => 'Folha de informação ao participante – instruções de preenchimento',
        'folha_info_participante' => 'Folha de informação ao participante',
        'consentimento_participante' => 'Termo de consentimento livre e informado do participante',
        'carta_autorizacao_supervisor' => 'Carta de autorização do supervisor para a submissão do protocolo (actualizada)',
        'cv_estudante' => 'Curriculum Vitae do estudante ou pesquisador',
        'cv_supervisor' => 'Curriculum Vitae do supervisor (e do co-supervisor, caso aplicável)',
    ];

    public const CIBS_REQUIRED_DOCUMENTS = [
        'carta_revisao_bioetica_cibs' => 'Carta de solicitação de revisão bioética ao CIBS-ISCISA',
        'declaracao_compromisso_bioetica_cibs' => 'Declaração de compromisso do estudante ou investigador, em cumprir os princípios de bioética e aceitação das normas e procedimentos do CIBS-ISCISA',
        'declaracao_conflito_interesses' => 'Declaração de comunicação de conflito de interesse',
    ];

    public const CIBS_AUTO_DOCUMENT_KEY = 'parecer_cc_assinado';

    public const CIBS_AUTO_DOCUMENT_NAME = 'Parecer assinado do Comité Científico';

    public const OPTIONAL_DOCUMENTS = [
        'consentimento_tutor' => 'Termo de consentimento livre e informado do pai/mãe ou tutor legal da criança menor de dezoito anos de idade (caso aplicável)',
        'assentimento_menor' => 'Termo de assentimento do participante menor, de doze a dezassete anos de idade (caso aplicável)',
    ];

    protected $fillable = [
        'protocol_id',
        'organ_document_requirement_id',
        'submission_number',
        'document_key',
        'nome',
        'description',
        'required_for_organ',
        'file_path',
        'file_name',
        'enviado',
        'aprovado',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
        'is_optional',
        'archived_at',
    ];

    protected $casts = [
        'enviado' => 'boolean',
        'aprovado' => 'boolean',
        'is_optional' => 'boolean',
        'reviewed_at' => 'datetime',
        'archived_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = [
        'file_url',
        'download_url',
        'status_label',
    ];

    public function protocol(): BelongsTo
    {
        return $this->belongsTo(Protocol::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function catalogRequirement(): BelongsTo
    {
        return $this->belongsTo(OrganDocumentRequirement::class, 'organ_document_requirement_id');
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path ? Storage::disk('public')->url($this->file_path) : null;
    }

    public function getDownloadUrlAttribute(): ?string
    {
        return $this->file_path
            ? url("api/v1/protocols/{$this->protocol_id}/required-documents/{$this->id}/download")
            : null;
    }

    public function getStatusLabelAttribute(): string
    {
        if (! $this->enviado) {
            return 'Não enviado';
        }

        if ($this->aprovado === true) {
            return 'Aprovado';
        }

        if ($this->aprovado === false) {
            return 'Não aprovado';
        }

        return 'Pendente de validação';
    }
}
