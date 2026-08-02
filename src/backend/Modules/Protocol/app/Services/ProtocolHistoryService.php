<?php

namespace Modules\Protocol\app\Services;

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
        return ProtocolHistory::create([
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
    }
}
