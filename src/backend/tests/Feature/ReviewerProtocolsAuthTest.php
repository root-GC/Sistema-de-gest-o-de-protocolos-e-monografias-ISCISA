<?php

namespace Tests\Feature;

use Tests\TestCase;

class ReviewerProtocolsAuthTest extends TestCase
{
    public function test_guest_access_to_reviewer_protocols_redirects_to_login_route(): void
    {
        $response = $this->get('/api/v1/reviewer/protocols');

        $response->assertRedirect('/api/login');
    }
}
