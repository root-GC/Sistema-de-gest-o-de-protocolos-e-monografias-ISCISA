<?php

namespace Tests\Unit;

use Illuminate\Http\Request;
use Modules\Protocol\app\Http\Resources\ProtocolReviewerResource;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\Topic;
use Tests\TestCase;

class ProtocolReviewerResourceTest extends TestCase
{
    public function test_it_handles_a_topic_without_course_without_throwing(): void
    {
        $topic = new Topic();
        $topic->forceFill([
            'id' => 6,
            'title' => 'Tema sem curso',
            'status' => Topic::STATUS_IN_REVIEW,
        ]);
        $topic->setRelation('scientificArea', null);
        $topic->setRelation('course', null);

        $protocol = new Protocol();
        $protocol->forceFill([
            'id' => 1,
            'code' => 'PTM0001E',
            'protocol_type' => 'protocol',
            'status' => Protocol::STATUS_IN_REVIEW_NUCLEO,
            'version' => 'NC_V1',
            'submitted_at' => now(),
        ]);
        $protocol->setRelation('topic', $topic);
        $protocol->setRelation('reviewAssignments', collect());

        $data = (new ProtocolReviewerResource($protocol))->toArray(Request::create('/api/v1/reviewer/protocols', 'GET'));

        $this->assertSame(6, $data['topic']['id']);
        $this->assertNull($data['topic']['course']);
    }
}
