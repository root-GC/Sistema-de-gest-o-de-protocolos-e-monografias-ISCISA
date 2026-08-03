<?php

namespace Modules\Monograph\app\Listeners;

use Illuminate\Support\Facades\DB;

class LogWorkflowTransition
{
    public function handle(object $event): void
    {
        DB::table('workflow_transitions')->insert([
            'submission_id' => $event->monograph->id ?? null,
            'module'        => 'monograph',
            'event'         => get_class($event),
            'to_state'      => $event->monograph->status?->value ?? null,
            'created_at'    => now(),
        ]);
    }
}