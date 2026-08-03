<?php

namespace Modules\Defense\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\{DB, Schema};

/**
 * Cria uma Defense já em 'aguarda_juri', simulando que uma monografia
 * já foi 'verificada' — sem precisar de correr o fluxo completo do
 * Monograph. Requer que TestUserSeeder e MonographTestSeeder já
 * tenham corrido (para termos users, teacher_profiles, e uma
 * monograph existente).
 */
class DefenseTestSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $monographId = DB::table('monographs')->value('id');

        if (!$monographId) {
            $this->command->error('Corre primeiro o MonographTestSeeder.');
            return;
        }

        // força o estado para 'verificada', para a Defense fazer sentido
        DB::table('monographs')->where('id', $monographId)->update(['status' => 'verificada']);

        $defenseId = DB::table('defenses')->updateOrInsert(
            ['monograph_id' => $monographId],
            ['status' => 'aguarda_juri', 'created_at' => $now, 'updated_at' => $now]
        );

        $defenseId = DB::table('defenses')->where('monograph_id', $monographId)->value('id');

        // três docentes extra, distintos do supervisor, para servir de júri
        $coordinatorUserId = DB::table('users')->where('email', 'coord@iscisa.ac.mz')->value('id');
        $revisoraUserId    = DB::table('users')->where('email', 'revisora@iscisa.ac.mz')->value('id');

        $this->command->info("Defense ID: {$defenseId}");
        $this->command->info("Monograph ID: {$monographId} (forçado para 'verificada')");
        $this->command->info('Coordenador: coord@iscisa.ac.mz / password123');
        $this->command->info('Revisora (pode ser arguente): revisora@iscisa.ac.mz / password123');
    }
}