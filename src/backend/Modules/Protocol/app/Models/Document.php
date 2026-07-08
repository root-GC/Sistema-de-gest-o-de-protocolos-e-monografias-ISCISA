<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\User\app\Models\User;

class Document extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'submited_by',
        'protocol_id',
        'document_type',
        'file_name',
        'file_path',
        'pages',
        'version',
        'status',
    ];

    protected $casts = [
        'pages' => 'integer',
        'version' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';

    public function protocol(): BelongsTo
    {
        return $this->belongsTo(Protocol::class);
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submited_by');
    }
}
