<?php

namespace Modules\Protocol\app\Services;

use App\Services\WorkflowTransitionService;
use Modules\Protocol\app\Models\Topic;
use Modules\Protocol\app\Models\TopicHistory;
use Modules\User\app\Models\User;

class TopicHistoryService
{
    public function record(
        Topic $topic,
        string $action,
        ?User $actor = null,
        ?string $oldStatus = null,
        ?string $newStatus = null,
        ?string $description = null,
        array $metadata = []
    ): TopicHistory {
        $topic->loadMissing('scientificArea:id,organ_id');

        $organId = $topic->scientificArea?->organ_id
            ?: $topic->scientificArea()->value('organ_id');

        $history = TopicHistory::create([
            'topic_id' => $topic->id,
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
            $topic,
            'topic',
            $action,
            $actor,
            $organId,
            $oldStatus,
            $newStatus,
            $description,
            $metadata,
        );

        $event->update([
            'source_table' => 'topic_histories',
            'source_id' => $history->id,
        ]);

        return $history;
    }
}
