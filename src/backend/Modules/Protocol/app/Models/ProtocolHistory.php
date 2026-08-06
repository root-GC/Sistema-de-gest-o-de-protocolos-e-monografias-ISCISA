<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\app\Models\Organ;
use Modules\User\app\Models\User;

class ProtocolHistory extends Model
{
    protected $fillable = [
        'protocol_id',
        'organ_id',
        'actor_id',
        'action',
        'description',
        'old_status',
        'new_status',
        'metadata',
        'occurred_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'occurred_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function protocol(): BelongsTo
    {
        return $this->belongsTo(Protocol::class);
    }

    public function organ(): BelongsTo
    {
        return $this->belongsTo(Organ::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
