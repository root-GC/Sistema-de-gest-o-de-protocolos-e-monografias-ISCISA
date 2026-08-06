<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\User\app\Models\User;

class Opinion extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'protocol_id',
        'evaluation_form_id',
        'version',
        'organ',
        'decision',
        'observations',
        'issued_by',
        'issued_at',
        'document_path',
        'signed_document_path',
        'signed_file_name',
        'signed_by',
        'signed_at',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'signed_at' => 'datetime',
    ];

    public function protocol()
    {
        return $this->belongsTo(Protocol::class);
    }

    public function evaluationForm()
    {
        return $this->belongsTo(EvaluationForm::class, 'evaluation_form_id');
    }

    public function issuedBy()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function signedBy()
    {
        return $this->belongsTo(User::class, 'signed_by');
    }

    public function isSigned(): bool
    {
        return (bool) $this->signed_document_path;
    }

    public function effectiveVersion(): string
    {
        if ($this->relationLoaded('evaluationForm') && $this->evaluationForm?->version) {
            return $this->evaluationForm->version;
        }

        return $this->version;
    }
}
