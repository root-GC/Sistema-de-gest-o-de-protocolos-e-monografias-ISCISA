<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\app\Models\Organ;
use Modules\User\app\Models\User;

class WorkflowEvent extends Model
{
    protected $fillable = [
        'event_key',
        'source_table',
        'source_id',
        'subject_type',
        'subject_id',
        'actor_id',
        'organ_id',
        'document_revision_id',
        'action',
        'from_state',
        'to_state',
        'description',
        'metadata',
        'occurred_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'occurred_at' => 'datetime',
    ];

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function organ(): BelongsTo
    {
        return $this->belongsTo(Organ::class);
    }

    public function documentRevision(): BelongsTo
    {
        return $this->belongsTo(DocumentRevision::class);
    }
}
