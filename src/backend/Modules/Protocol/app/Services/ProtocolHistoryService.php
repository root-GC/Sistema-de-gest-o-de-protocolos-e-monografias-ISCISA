<?php

namespace Modules\Protocol\app\Services;

use App\Services\WorkflowTransitionService;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\ProtocolHistory;
use Modules\User\app\Models\User;

class ProtocolHistoryService
{
    public function record(
        Protocol $protocol,
        string $action,
        ?User $actor = null,
        ?int $organId = null,
        ?string $oldStatus = null,
        ?string $newStatus = null,
        ?string $description = null,
        array $metadata = []
    ): ProtocolHistory {
        $history = ProtocolHistory::create([
            'protocol_id' => $protocol->id,
            'organ_id' => $organId,
            'actor_id' => $actor?->id,
            'action' => $action,
            'description' => $description,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'metadata' => $metadata === [] ? null : $metadata,
            'occurred_at' => now(),
        ]);

        $event = app(WorkflowTransitionService::class)->record(
            $protocol,
            'protocol',
            $action,
            $actor,
            $organId,
            $oldStatus,
            $newStatus,
            $description,
            $metadata,
        );

        $event->update([
            'source_table' => 'protocol_histories',
            'source_id' => $history->id,
        ]);

        return $history;
    }
}
