<?php

namespace Modules\User\database\seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use RuntimeException;

class StudentsSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $password = Hash::make('password123');
        $studentRoleId = DB::table('roles')->where('name', 'student')->value('id');

        if (! $studentRoleId) {
            throw new RuntimeException("Role 'student' não encontrada — corre o RoleSeeder primeiro.");
        }

        $courses = DB::table('courses')
            ->orderBy('code')
            ->get(['id', 'name', 'code']);

        $sharedCourse = $courses->firstWhere('code', 'MED') ?? $courses->first();

        if (! $sharedCourse || $courses->count() < 8) {
            throw new RuntimeException('São necessários pelo menos 8 cursos para criar os estudantes de teste.');
        }

        $assignments = [
            ['course' => $sharedCourse, 'number' => 1],
            ['course' => $sharedCourse, 'number' => 2],
            ['course' => $sharedCourse, 'number' => 3],
        ];

        foreach ($courses->where('id', '!=', $sharedCourse->id)->take(7) as $course) {
            $assignments[] = ['course' => $course, 'number' => 1];
        }

        $sharedSupervisorId = $this->supervisorIdForCourse($sharedCourse->id);

        foreach ($assignments as $index => $assignment) {
            $course = $assignment['course'];
            $supervisorId = $course->id === $sharedCourse->id
                ? $sharedSupervisorId
                : $this->supervisorIdForCourse($course->id);
            $email = sprintf(
                'estudante.%s.%02d@iscisa.ac.mz',
                Str::slug($course->name, '.'),
                $assignment['number']
            );

            DB::table('users')->updateOrInsert(
                ['email' => $email],
                [
                    'name' => sprintf('Estudante %s %02d', $course->name, $assignment['number']),
                    'password' => $password,
                    'status' => 'active',
                    'email_verified_at' => $now,
                    'deleted_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ] + (Schema::hasColumn('users', 'must_reset_password') ? ['must_reset_password' => false] : [])
            );

            $userId = DB::table('users')->where('email', $email)->value('id');

            DB::table('user_roles')->updateOrInsert(
                ['user_id' => $userId, 'role_id' => $studentRoleId],
                [
                    'deleted_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );

            DB::table('student_profiles')->updateOrInsert(
                ['user_id' => $userId],
                [
                    'course_id' => $course->id,
                    'supervisor_id' => $supervisorId,
                    'student_number' => sprintf('2026-EST-%03d', $index + 1),
                    'deleted_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }

    private function supervisorIdForCourse(int $courseId): int
    {
        $supervisorId = DB::table('teacher_profiles')
            ->where('course_id', $courseId)
            ->orderBy('id')
            ->value('id');

        if (! $supervisorId) {
            throw new RuntimeException("Nenhum supervisor encontrado para o curso ID {$courseId}.");
        }

        return $supervisorId;
    }
}
