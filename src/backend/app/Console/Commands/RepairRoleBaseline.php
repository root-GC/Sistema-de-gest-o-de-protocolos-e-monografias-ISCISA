<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Modules\Auth\database\seeders\RoleSeeder;

class RepairRoleBaseline extends Command
{
    protected $signature = 'auth:repair-role-baseline';

    protected $description = 'Garante roles, permissões e roles base de docente/supervisor sem mutar sessões de login.';

    public function handle(): int
    {
        DB::transaction(function (): void {
            app(RoleSeeder::class)->run();
        });

        $this->info('Roles, permissões e associações base de docentes/supervisores foram verificadas.');

        return self::SUCCESS;
    }
}
