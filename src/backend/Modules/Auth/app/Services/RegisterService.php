<?php

namespace Modules\Auth\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Modules\User\Models\Role;
use Modules\User\Models\User;
use Modules\User\Models\StudentProfile;

/**
 * Registo público — apenas estudantes.
 *
 * Fluxo:
 *  1. Criar user com status = active
 *  2. Atribuir role 'student'
 *  3. Criar student_profile com course_id + student_number
 *
 * Tudo numa transação — se qualquer passo falhar reverte tudo.
 */
class RegisterService
{
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {

            // 1 — Criar utilizador
            $user = User::create([
                'name'     => $data['name'],
                'email'    => $data['email'],
                'password' => Hash::make($data['password']),
                'status'   => 'active',
            ]);

            // 2 — Atribuir role 'student'
            $studentRole = Role::where('name', 'student')->firstOrFail();
            $user->roles()->attach($studentRole->id);

            // 3 — Criar perfil de estudante
            StudentProfile::create([
                'user_id'        => $user->id,
                'course_id'      => $data['course_id'],
                'student_number' => $data['student_number'],
                'supervisorID'   => null, // atribuído depois pelo coordenador(logica ainda por definir)
            ]);

            return $user;
        });
    }
}