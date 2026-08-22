<?php

namespace Modules\Auth\app\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Modules\Auth\app\Services\TeacherImportService;
use Modules\Auth\app\Services\TeacherInviteService;
use Modules\Organization\app\Models\Organ;
use Modules\User\app\Models\User;

class AdminTeacherController extends Controller
{
    /**
     * Roles atribuídas por defeito a qualquer docente criado por este fluxo.
     * Todo docente gerido pelo núcleo é sempre teacher + supervisor.
     * 'reviewer' fica de fora por agora — será atribuída via update() no futuro.
     */
    private const DEFAULT_ROLES = ['teacher', 'supervisor'];

    public function __construct(
        private TeacherInviteService $inviteService,
        private TeacherImportService $importService,
    ) {}

    /**
     * Só admins de núcleo podem gerir docentes. Devolve o órgão + a área
     * científica que vai ser herdada por qualquer docente criado.
     */
    private function actorNucleus(Request $request): Organ
    {
        $profile = $request->user()->adminProfile;
        abort_unless($profile && $profile->organ, 403, 'Sem permissão para gerir docentes.');
        abort_unless($profile->organ->isNucleus(), 403, 'Só administradores de núcleo podem criar docentes.');

        return $profile->organ;
    }

    private function resolveScientificAreaId(Organ $organ): int
    {
        $area = $organ->scientificArea()->first();
        abort_if(! $area, 422, 'Este núcleo ainda não tem uma área científica configurada.');

        return $area->id;
    }

    // GET /api/v1/admin/teachers
    public function index(Request $request)
    {
        $organ = $this->actorNucleus($request);

        $users = User::with(['roles', 'teacherProfile.scientificArea'])
            ->whereHas('roles', fn ($q) => $q->where('name', 'teacher'))
            ->whereHas('teacherProfile.scientificArea', fn ($q) => $q->where('organ_id', $organ->id))
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%"))
            ->paginate($request->per_page ?? 15);

        return response()->json([
            'data'         => $users->items(),
            'total'        => $users->total(),
            'current_page' => $users->currentPage(),
        ]);
    }

    // POST /api/v1/admin/teachers — criação manual (um docente de cada vez)
    // Cria sempre com teacher + supervisor.
    public function store(Request $request)
    {
        $organ = $this->actorNucleus($request);

        $data = $request->validate([
            'name'  => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
        ]);

        $data['scientific_area_id'] = $this->resolveScientificAreaId($organ);
        $data['roles'] = self::DEFAULT_ROLES;

        try {
            $user = $this->inviteService->invite($data);

            Log::info('[AdminTeacherController] store — docente criado', [
                'user_id' => $user->id, 'organ_id' => $organ->id, 'roles' => self::DEFAULT_ROLES,
            ]);

            return response()->json([
                'message' => 'Convite enviado com sucesso.',
                'user'    => $user->load('roles', 'teacherProfile.scientificArea'),
            ], 201);
        } catch (\Exception $e) {
            Log::error('[AdminTeacherController] store — ERRO', ['error' => $e->getMessage()]);

            return response()->json(['message' => 'Erro ao criar docente: ' . $e->getMessage()], 500);
        }
    }

    // POST /api/v1/admin/teachers/import — importação em massa via Excel/CSV
    // Todos os docentes importados saem sempre com teacher + supervisor.
    public function import(Request $request)
    {
        $organ = $this->actorNucleus($request);

        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:5120'],
        ]);

        $scientificAreaId = $this->resolveScientificAreaId($organ);

        try {
            $report = $this->importService->importFromFile($request->file('file'), $scientificAreaId);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        Log::info('[AdminTeacherController] import — concluído', [
            'organ_id' => $organ->id,
            'criados'  => count($report['created']),
            'falhados' => count($report['failed']),
        ]);

        return response()->json([
            'message' => sprintf('%d docente(s) criado(s), %d falha(s).', count($report['created']), count($report['failed'])),
            'created' => $report['created'],
            'failed'  => $report['failed'],
        ]);
    }

    // PUT /api/v1/admin/teachers/{id} — admin pode editar nome/email/status
    // (Aqui é que, no futuro, entrará a atribuição da role reviewer.)
    public function update(Request $request, int $id)
    {
        $organ   = $this->actorNucleus($request);
        $teacher = $this->findOwnTeacher($id, $organ);

        $data = $request->validate([
            'name'   => ['sometimes', 'string', 'max:255'],
            'email'  => ['sometimes', 'email', 'unique:users,email,' . $id],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);

        $teacher->update($data);

        return response()->json([
            'message' => 'Docente atualizado.',
            'user'    => $teacher->fresh()->load('roles', 'teacherProfile.scientificArea'),
        ]);
    }

    // DELETE /api/v1/admin/teachers/{id}
    public function destroy(Request $request, int $id)
    {
        $organ   = $this->actorNucleus($request);
        $teacher = $this->findOwnTeacher($id, $organ);

        $teacher->delete();

        return response()->json(['message' => 'Docente eliminado.']);
    }

    private function findOwnTeacher(int $id, Organ $organ): User
    {
        $teacher = User::with('teacherProfile.scientificArea')->findOrFail($id);

        abort_unless(
            $teacher->hasRole('teacher') && $teacher->teacherProfile?->scientificArea?->organ_id === $organ->id,
            403,
            'Este docente não pertence ao teu núcleo.'
        );

        return $teacher;
    }
}