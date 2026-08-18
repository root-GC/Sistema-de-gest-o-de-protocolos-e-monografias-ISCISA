<?php

// Modules/Organization/App/Http/Middleware/EnsureTeacherProfileComplete.php

namespace Modules\Organization\App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Modules\Organization\App\Models\TeacherProfile;

class EnsureTeacherProfileComplete
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Verificar se o utilizador está autenticado
        if (!$user) {
            return $next($request);
        }

        // Verificar se tem a role "teacher"
        if (!$user->hasRole('teacher')) {
            return $next($request);
        }

        // Carregar o perfil do docente
        $teacherProfile = $user->teacherProfile;

        // Se não tem perfil, bloquear
        if (!$teacherProfile) {
            return response()->json([
                'message' => 'Complete o seu perfil antes de continuar.',
                'profile_incomplete' => true,
                'required_fields' => TeacherProfile::REQUIRED_FIELDS,
                'missing_fields' => TeacherProfile::REQUIRED_FIELDS,
            ], 403);
        }

        // Verificar se o perfil está incompleto
        if ($teacherProfile->isIncomplete()) {
            return response()->json([
                'message' => 'Complete o seu perfil antes de continuar.',
                'profile_incomplete' => true,
                'required_fields' => TeacherProfile::REQUIRED_FIELDS,
                'missing_fields' => $teacherProfile->getMissingFields(),
                'current_values' => [
                    'academic_degree' => $teacherProfile->academic_degree,
                    'department' => $teacherProfile->department,
                ],
            ], 403);
        }

        return $next($request);
    }
}