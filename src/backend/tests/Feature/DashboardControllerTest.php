<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Modules\User\app\Models\User;
use Modules\User\app\Models\Role;
use Modules\User\app\Models\Permission;

class DashboardControllerTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(): User
    {
        return User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);
    }

    public function test_guest_gets_401(): void
    {
        $response = $this->postJson('/api/dashboard', [
            'widgets' => ['notifications'],
        ]);

        $response->assertStatus(401);
    }

    public function test_authenticated_user_sees_only_public_widgets(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/dashboard', [
                'widgets' => ['notifications', 'deadlines', 'myProtocols', 'adminPanel'],
            ]);

        $response->assertStatus(200);

        $response->assertJsonStructure([
            'widgets' => [
                'notifications',
                'deadlines',
            ],
            'user' => ['id', 'name', 'email', 'status', 'roles', 'permissions', 'profiles'],
            'meta' => ['timestamp', 'widgets_requested', 'widgets_authorized'],
        ]);

        $this->assertArrayNotHasKey('myProtocols', $response->json('widgets'));
        $this->assertArrayNotHasKey('adminPanel', $response->json('widgets'));
        $this->assertEquals(4, $response->json('meta.widgets_requested'));
        $this->assertEquals(2, $response->json('meta.widgets_authorized'));
    }

    public function test_user_with_permission_sees_protected_widget(): void
    {
        $permission = Permission::create(['code' => 'protocol.view', 'description' => 'Ver protocolos']);
        $role = Role::create(['name' => 'teacher', 'description' => 'Docente']);
        $role->permissions()->attach($permission);

        $user = $this->createUser();
        $user->roles()->attach($role);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/dashboard', [
                'widgets' => ['myProtocols', 'notifications'],
            ]);

        $response->assertStatus(200);

        $this->assertArrayHasKey('myProtocols', $response->json('widgets'));
        $this->assertArrayHasKey('notifications', $response->json('widgets'));
        $this->assertEquals(2, $response->json('meta.widgets_requested'));
        $this->assertEquals(2, $response->json('meta.widgets_authorized'));
    }

    public function test_user_without_permission_does_not_see_protected_widget(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/dashboard', [
                'widgets' => ['documentValidation'],
            ]);

        $response->assertStatus(200);

        $this->assertArrayNotHasKey('documentValidation', $response->json('widgets'));
        $this->assertEquals(0, $response->json('meta.widgets_authorized'));
    }

    public function test_unknown_widget_is_denied(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/dashboard', [
                'widgets' => ['nonexistent_widget'],
            ]);

        $response->assertStatus(200);

        $this->assertArrayNotHasKey('nonexistent_widget', $response->json('widgets'));
        $this->assertEquals(0, $response->json('meta.widgets_authorized'));
    }

    public function test_empty_widgets_list_returns_empty_response(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/dashboard', [
                'widgets' => [],
            ]);

        $response->assertStatus(200);
        $this->assertEmpty($response->json('widgets'));
        $this->assertEquals(0, $response->json('meta.widgets_requested'));
        $this->assertEquals(0, $response->json('meta.widgets_authorized'));
    }
}
