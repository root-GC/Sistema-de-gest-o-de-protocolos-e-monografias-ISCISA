<?php

namespace Modules\Auth\app\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class GeneralAdminDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user()->loadMissing(['roles.permissions', 'directPermissions', 'adminProfile.organ']);
        $admin = $user->adminProfile;

        if (! $user->hasPermission('admin.organs') || $admin?->organ?->type !== 'scientific_direction') {
            abort(403);
        }

        $recentActivities = Schema::hasTable('workflow_events')
            ? DB::table('workflow_events')
                ->leftJoin('users as actors', 'actors.id', '=', 'workflow_events.actor_id')
                ->leftJoin('organs', 'organs.id', '=', 'workflow_events.organ_id')
                ->orderByDesc('workflow_events.occurred_at')
                ->limit(12)
                ->get([
                    'workflow_events.id',
                    'workflow_events.action',
                    'workflow_events.description',
                    'workflow_events.occurred_at as created_at',
                    'actors.name as actor_name',
                    'organs.name as organ_name',
                ])
                ->map(fn ($activity) => [
                    'id' => $activity->id,
                    'action' => $activity->action,
                    'description' => $activity->description
                        ?: trim(($activity->actor_name ? $activity->actor_name . ': ' : '') . $activity->action),
                    'created_at' => $activity->created_at,
                    'organ' => $activity->organ_name,
                ])
                ->values()
            : collect();

        return response()->json([
            'total_coordinators' => $this->activeCount('coordinator_profiles'),
            'total_secretaries' => $this->activeCount('secretary_profiles'),
            'total_presidents' => DB::table('admin_profiles')
                ->whereNull('deleted_at')
                ->where('access_scope', 'organ')
                ->count(),
            'total_courses' => $this->activeCount('courses'),
            'total_areas' => $this->activeCount('scientific_areas'),
            'total_organs' => $this->activeCount('organs'),
            'total_students' => $this->usersWithRole('student'),
            'total_teachers' => $this->usersWithRole('teacher'),
            'recent_activities' => $recentActivities,
        ]);
    }

    private function activeCount(string $table): int
    {
        return (int) DB::table($table)->whereNull('deleted_at')->count();
    }

    private function usersWithRole(string $role): int
    {
        return (int) DB::table('users')
            ->join('user_roles', 'user_roles.user_id', '=', 'users.id')
            ->join('roles', 'roles.id', '=', 'user_roles.role_id')
            ->whereNull('users.deleted_at')
            ->where('roles.name', $role)
            ->distinct('users.id')
            ->count('users.id');
    }
}
