<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\app\Models\Organ;
use Modules\User\app\Models\User;

class DocumentRevision extends Model
{
    public const AVAILABILITY_AVAILABLE = 'available';
    public const AVAILABILITY_MISSING = 'missing';

    protected $fillable = [
        'documentable_type',
        'documentable_id',
        'source_table',
        'source_id',
        'submission_number',
        'revision_number',
        'document_key',
        'file_name',
        'storage_disk',
        'file_path',
        'mime_type',
        'file_size',
        'sha256',
        'availability',
        'captured_by',
        'organ_id',
        'parent_revision_id',
        'captured_at',
    ];

    protected $casts = [
        'submission_number' => 'integer',
        'revision_number' => 'integer',
        'file_size' => 'integer',
        'captured_at' => 'datetime',
    ];

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'captured_by');
    }

    public function organ(): BelongsTo
    {
        return $this->belongsTo(Organ::class);
    }

    public function parentRevision(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_revision_id');
    }
}
