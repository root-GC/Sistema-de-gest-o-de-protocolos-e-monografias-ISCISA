<?php

namespace Modules\Protocol\app\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class SystemStatusController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user()->loadMissing('adminProfile');

        abort_unless(
            $user->hasPermission('admin.settings')
                && $user->adminProfile?->access_scope === 'global',
            403,
        );

        $services = [
            $this->check('Base de dados', fn () => DB::select('select 1')),
            $this->check('Cache', fn () => Cache::store()->get('__sgpmc_health_probe__')),
            $this->check('Armazenamento', function (): void {
                // Reaches the configured adapter without writing historical files.
                Storage::disk()->exists('__sgpmc_health_probe__');
            }),
            $this->queueStatus(),
            $this->onlyOfficeStatus(),
        ];

        return response()->json([
            'checked_at' => now()->toIso8601String(),
            'services' => $services,
            'summary' => [
                'healthy' => collect($services)->where('status', 'healthy')->count(),
                'degraded' => collect($services)->where('status', 'degraded')->count(),
                'down' => collect($services)->where('status', 'down')->count(),
            ],
        ]);
    }

    private function queueStatus(): array
    {
        return $this->check('Fila', function (): array {
            if (! Schema::hasTable('jobs')) {
                return [
                    'status' => 'degraded',
                    'detail' => 'A tabela de fila nao esta configurada.',
                ];
            }

            $pending = DB::table('jobs')->count();
            $failed = Schema::hasTable('failed_jobs') ? DB::table('failed_jobs')->count() : 0;

            return [
                'status' => $failed > 0 ? 'degraded' : 'healthy',
                'detail' => "{$pending} pendente(s), {$failed} falha(s).",
            ];
        });
    }

    private function onlyOfficeStatus(): array
    {
        $baseUrl = rtrim((string) env('ONLYOFFICE_URL'), '/');

        if ($baseUrl === '') {
            return [
                'name' => 'OnlyOffice',
                'status' => 'degraded',
                'detail' => 'OnlyOffice nao esta configurado.',
                'response_time_ms' => null,
            ];
        }

        return $this->check('OnlyOffice', function () use ($baseUrl): array {
            $response = Http::connectTimeout(2)->timeout(4)->get($baseUrl . '/healthcheck');

            return [
                'status' => $response->successful() || $response->status() === 405 ? 'healthy' : 'down',
                'detail' => 'HTTP ' . $response->status(),
            ];
        });
    }

    private function check(string $name, callable $operation): array
    {
        $startedAt = microtime(true);

        try {
            $result = $operation();
            $elapsed = (int) round((microtime(true) - $startedAt) * 1000);

            return [
                'name' => $name,
                'status' => is_array($result) ? ($result['status'] ?? 'healthy') : 'healthy',
                'detail' => is_array($result) ? ($result['detail'] ?? 'Disponivel.') : 'Disponivel.',
                'response_time_ms' => $elapsed,
            ];
        } catch (\Throwable $exception) {
            report($exception);

            return [
                'name' => $name,
                'status' => 'down',
                'detail' => 'Indisponivel. Consulte os registos do servidor.',
                'response_time_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            ];
        }
    }
}
