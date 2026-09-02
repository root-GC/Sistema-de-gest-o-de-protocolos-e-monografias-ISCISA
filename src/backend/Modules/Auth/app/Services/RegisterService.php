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

            $roleId = DB::table('roles')->where('name', 'student')->value('id');

            if (! $roleId) {
                throw new \RuntimeException("Role 'student' não encontrada — corre o RoleSeeder primeiro.");
            }

            DB::table('user_roles')->insert([
                'user_id'    => $user->id,
                'role_id'    => $roleId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $user->studentProfile()->create([
                'course_id'      => $data['course_id'],
                'supervisor_id'  => $data['supervisor_id'],
                'student_number' => $data['student_number'],
            ]);

            return $user;
        });

        $this->otpService->generateAndSend($user->email, 'register', $user->name);

        return $user;
    }
}
