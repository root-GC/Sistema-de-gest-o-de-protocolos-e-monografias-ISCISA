<?php

namespace Modules\Auth\app\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Modules\User\app\Models\User;

class RegisterService
{
    public function __construct(private OtpService $otpService) {}

    public function register(array $data): User
    {
        $user = DB::transaction(function () use ($data) {
            $user = User::create([
                'name'     => $data['name'],
                'email'    => $data['email'],
                'password' => Hash::make($data['password']),
                'status'   => 'pending', // só passa a 'active' após verificar o OTP
            ]);

            $roleName = $data['type'] === 'student' ? 'student' : 'teacher';
            $roleId   = DB::table('roles')->where('name', $roleName)->value('id');

            if (! $roleId) {
                throw new \RuntimeException("Role '{$roleName}' não encontrada — corre o RoleSeeder primeiro.");
            }

            DB::table('user_roles')->insert([
                'user_id'    => $user->id,
                'role_id'    => $roleId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

                if ($data['type'] === 'student') {
                    $user->studentProfile()->create([
                        'course_id'      => $data['course_id'],
                        'supervisor_id'  => $data['supervisor_id'],
                        'student_number' => $data['student_number'],
                    ]);
                } else {
                $user->teacherProfile()->create([
                    'scientific_area_id' => $data['scientific_area_id'],
                    'academic_degree'    => $data['academic_degree'],
                    'department'         => $data['department'] ?? null,
                    'is_internal'        => true,
                ]);
            }

            return $user;
        });

        $this->otpService->generateAndSend($user->email, 'register', $user->name);

        return $user;
    }
}