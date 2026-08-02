<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Modules\User\app\Models\User;

class ProtocolDocumentRequirement extends Model
{
    public const ORGAN_CC = 'comite_cientifico';

    public const CC_REQUIRED_DOCUMENTS = [
        'cover_letter' => 'Carta de cobertura',
        'credentials' => 'Credenciais',
        'originality_declaration' => 'Declaração de originalidade',
        'academic_record_declaration' => 'Declaração do registo académico',
        'financial_statement_declaration' => 'Declaração do extracto financeiro',
        'authors_responsibility_list' => 'Lista de autores e responsabilidade',
    ];

    protected $fillable = [
        'protocol_id',
        'document_key',
        'nome',
        'required_for_organ',
        'file_path',
        'file_name',
        'enviado',
        'aprovado',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'enviado' => 'boolean',
        'aprovado' => 'boolean',
        'reviewed_at' => 'datetime',
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
            return 'Reprovado';
        }

        return 'Pendente de validação';
    }
}
