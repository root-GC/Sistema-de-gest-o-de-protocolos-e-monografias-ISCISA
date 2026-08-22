
php artisan optimize:clear

php artisan migrate:fresh `
  --path=Modules/Auth/Database/Migrations `
  --path=Modules/Organization/Database/Migrations `
  --path=Modules/Protocol/Database/Migrations `
  --path=Modules/User/database/migrations

php artisan db:seed --class="Modules\Auth\Database\Seeders\AuthDatabaseSeeder"

php artisan db:seed --class="Modules\Organization\Database\Seeders\OrganizationDatabaseSeeder"



php artisan db:seed --class="Modules\Protocol\Database\Seeders\ProtocolDatabaseSeeder"

php artisan db:seed --class="Modules\User\database\seeders\DatabaseSeeder"