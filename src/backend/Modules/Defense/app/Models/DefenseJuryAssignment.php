<?php

namespace Modules\Defense\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DefenseJuryAssignment extends Model
{
    protected $table = 'defense_jury_assignments';

    protected $fillable = [
        'defense_jury_id', 'assigned_at', 'due_at', 'status', 'return_note', 'returned_at'
    ];

    public function jury(): BelongsTo
    {
        return $this->belongsTo(DefenseJury::class, 'defense_jury_id');
    }
}
