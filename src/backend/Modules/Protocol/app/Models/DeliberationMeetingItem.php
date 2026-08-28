<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;

class DeliberationMeetingItem extends Model
{
    public const STATUS_SCHEDULED = 'scheduled';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_DELIBERATED = 'deliberated';

    public const STATUS_NOT_DELIBERATED = 'not_deliberated';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'meeting_id',
        'evaluation_form_id',
        'queue_entered_at',
        'status',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'queue_entered_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function meeting()
    {
        return $this->belongsTo(DeliberationMeeting::class, 'meeting_id');
    }

    public function evaluationForm()
    {
        return $this->belongsTo(EvaluationForm::class, 'evaluation_form_id');
    }
}
