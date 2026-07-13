<?php

namespace Tests\Unit;

use Modules\Protocol\app\Http\Requests\SubmitTopicRequest;
use Tests\TestCase;

class SubmitTopicRequestTest extends TestCase
{
    public function test_it_accepts_justification_in_topic_submission(): void
    {
        $request = new SubmitTopicRequest();
        $rules = $request->rules();

        $this->assertArrayHasKey('justification', $rules);
        $this->assertSame(['nullable', 'string', 'max:5000'], $rules['justification']);
    }
}
