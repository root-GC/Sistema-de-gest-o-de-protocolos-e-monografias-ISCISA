<?php

namespace Modules\Protocol\app\Services;

use Illuminate\Support\Collection;
use Modules\Protocol\app\Models\Topic;
use Modules\User\app\Models\User;

class TopicService
{
    public function submit(array $data, User $user): array
    {
        $similarTopics = $this->findSimilarApprovedTopics($data['title']);

        $topic = Topic::create([
            'student_id' => $user->id,
            'scientific_area_id' => $data['scientific_area_id'],
            'course_id' => $data['course_id'],
            'title' => $data['title'],
            'status' => 'topic_pending',
            'submitted_at' => now(),
        ]);

        $topic->load(['scientificArea:id,name', 'course:id,name,code']);

        return [
            'topic' => $topic,
            'similar_topics' => $similarTopics,
        ];
    }

    public function listForUser(User $user)
    {
        $query = Topic::query()
            ->with([
                'student:id,name,email',
                'scientificArea:id,name',
                'course:id,name,code',
            ])
            ->latest();

        if ($user->hasPermission('topic.view.all')) {
            return $query->get();
        }

        return $query->where('student_id', $user->id)->get();
    }

    private function findSimilarApprovedTopics(string $title): array
    {
        $approvedTopics = Topic::query()
            ->select(['id', 'title'])
            ->where('status', 'topic_approved')
            ->get();

        if ($approvedTopics->isEmpty()) {
            return [];
        }

        return $approvedTopics
            ->map(function (Topic $topic) use ($title) {
                similar_text(mb_strtolower($title), mb_strtolower($topic->title), $percent);

                return [
                    'id' => $topic->id,
                    'title' => $topic->title,
                    'similarity_percent' => round($percent, 2),
                ];
            })
            ->filter(fn(array $item) => $item['similarity_percent'] >= 60)
            ->sortByDesc('similarity_percent')
            ->take(5)
            ->values()
            ->all();
    }
}
