<?php
// Modules/Defense/app/Models/DefenseJuryAvailability.php

namespace Modules\Defense\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DefenseJuryAvailability extends Model
{
    protected $table = 'defense_jury_availability';

    protected $fillable = [
        'defense_jury_id', 'proposed_at', 'response',
        'alternative_datetime', 'note', 'responded_at',
    ];

    protected $casts = [
        'proposed_at' => 'datetime',
        'alternative_datetime' => 'datetime',
        'responded_at' => 'datetime',
    ];

    public function jury(): BelongsTo
    {
        return $this->belongsTo(DefenseJury::class, 'defense_jury_id');
    }
}