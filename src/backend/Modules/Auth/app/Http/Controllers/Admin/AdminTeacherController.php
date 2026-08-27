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
     * Roles atribuídas por defeito a qualquer docente criado
     * pelo Presidente do Núcleo.
     *
     * Todo docente criado por este fluxo será:
     *
     * - teacher
     * - supervisor
     *
     * reviewer NÃO é atribuído aqui.
     * reviewer é uma função dentro de um órgão e é gerida
     * através de OrganMember.
     */
    private const DEFAULT_ROLES = [
        'teacher',
        'supervisor',
    ];

    public function __construct(
        private TeacherInviteService $inviteService,
        private TeacherImportService $importService,
    ) {}

    /**
     * Obter o Núcleo do administrador autenticado.
     *
     * Este controller é exclusivamente responsável pela
     * gestão dos docentes dos Núcleos.
     */
    private function actorNucleus(Request $request): Organ
    {
        $profile = $request->user()->adminProfile;

        abort_unless(
            $profile && $profile->organ,
            403,
            'Sem permissão para gerir docentes.'
        );

        abort_unless(
            $profile->organ->isNucleus(),
            403,
            'Só presidentes de Núcleo podem gerir docentes.'
        );

        return $profile->organ;
    }

    /**
     * Obter a área científica pertencente ao Núcleo.
     *
     * Os docentes registados pelo Núcleo herdam
     * automaticamente a área científica do próprio Núcleo.
     */
    private function resolveScientificAreaId(Organ $organ): int
    {
        $area = $organ->scientificArea()->first();

        abort_if(
            !$area,
            422,
            'Este núcleo ainda não tem uma área científica configurada.'
        );

        return $area->id;
    }

    /**
     * GET /api/v1/admin/teachers
     *
     * Lista apenas os docentes pertencentes ao Núcleo
     * do presidente autenticado.
     *
     * IMPORTANTE:
     * Este endpoint NÃO é utilizado pelos Comitês.
     *
     * Para selecionar revisores/membros de um órgão,
     * utiliza-se:
     *
     * GET /organ-members/available-teachers
     */
    public function index(Request $request)
    {
        $organ = $this->actorNucleus($request);

        $users = User::with([
                'roles',
                'teacherProfile.scientificArea',
                'teacherProfile.course',
            ])
            ->whereHas('roles', function ($q) {
                $q->where('name', 'teacher');
            })
            ->whereHas(
                'teacherProfile.scientificArea',
                function ($q) use ($organ) {
                    $q->where('organ_id', $organ->id);
                }
            )
            ->when(
                $request->search,
                function ($q, $search) {
                    $q->where(function ($q) use ($search) {
                        $q->where(
                            'name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'email',
                            'like',
                            "%{$search}%"
                        );
                    });
                }
            )
            ->orderBy('name')
            ->paginate(
                $request->per_page ?? 15
            );

        return response()->json([
            'data' => $users->items(),

            'total' => $users->total(),

            'current_page' => $users->currentPage(),

            'last_page' => $users->lastPage(),
        ]);
    }

    /**
     * POST /api/v1/admin/teachers
     *
     * Criar manualmente um docente.
     *
     * Apenas Presidentes de Núcleo podem executar esta operação.
     *
     * O docente recebe:
     *
     * - teacher
     * - supervisor
     *
     * A área científica é herdada do Núcleo.
     */
    public function store(Request $request)
    {
        $organ = $this->actorNucleus($request);

        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'unique:users,email',
            ],
        ]);

        $data['scientific_area_id'] =
            $this->resolveScientificAreaId($organ);

        $data['roles'] = self::DEFAULT_ROLES;

        try {

            $user = $this->inviteService->invite($data);

            Log::info(
                '[AdminTeacherController] store — docente criado',
                [
                    'user_id' => $user->id,
                    'organ_id' => $organ->id,
                    'roles' => self::DEFAULT_ROLES,
                ]
            );

            return response()->json([
                'message' => 'Docente criado com sucesso.',

                'user' => $user->load(
                    'roles',
                    'teacherProfile.scientificArea',
                    'teacherProfile.course'
                ),
            ], 201);

        } catch (\Exception $e) {

            Log::error(
                '[AdminTeacherController] store — ERRO',
                [
                    'error' => $e->getMessage(),
                ]
            );

            return response()->json([
                'message' =>
                    'Erro ao criar docente: ' .
                    $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/teachers/import
     *
     * Importação em massa de docentes.
     *
     * Todos os docentes importados recebem:
     *
     * - teacher
     * - supervisor
     *
     * e são associados à área científica do Núcleo.
     */
    public function import(Request $request)
    {
        $organ = $this->actorNucleus($request);

        $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:xlsx,xls,csv,txt',
                'max:5120',
            ],
        ]);

        $scientificAreaId =
            $this->resolveScientificAreaId($organ);

        try {

            $report = $this->importService->importFromFile(
                $request->file('file'),
                $scientificAreaId
            );

        } catch (\RuntimeException $e) {

            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        Log::info(
            '[AdminTeacherController] import — concluído',
            [
                'organ_id' => $organ->id,

                'criados' =>
                    count($report['created']),

                'falhados' =>
                    count($report['failed']),
            ]
        );

        return response()->json([
            'message' => sprintf(
                '%d docente(s) criado(s), %d falha(s).',
                count($report['created']),
                count($report['failed'])
            ),

            'created' => $report['created'],

            'failed' => $report['failed'],
        ]);
    }

    /**
     * PUT /api/v1/admin/teachers/{id}
     *
     * Editar um docente pertencente ao próprio Núcleo.
     */
    public function update(
        Request $request,
        int $id
    ) {
        $organ = $this->actorNucleus($request);

        $teacher = $this->findOwnTeacher(
            $id,
            $organ
        );

        $data = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:255',
            ],

            'email' => [
                'sometimes',
                'email',
                'unique:users,email,' . $id,
            ],

            'status' => [
                'sometimes',
                'in:active,inactive',
            ],
        ]);

        $teacher->update($data);

        return response()->json([
            'message' => 'Docente atualizado.',

            'user' => $teacher
                ->fresh()
                ->load(
                    'roles',
                    'teacherProfile.scientificArea',
                    'teacherProfile.course'
                ),
        ]);
    }

    /**
     * DELETE /api/v1/admin/teachers/{id}
     *
     * Eliminar um docente pertencente ao próprio Núcleo.
     */
    public function destroy(
        Request $request,
        int $id
    ) {
        $organ = $this->actorNucleus($request);

        $teacher = $this->findOwnTeacher(
            $id,
            $organ
        );

        $teacher->delete();

        return response()->json([
            'message' => 'Docente eliminado.',
        ]);
    }

    /**
     * Garantir que o docente pertence ao Núcleo
     * do presidente autenticado.
     */
    private function findOwnTeacher(
        int $id,
        Organ $organ
    ): User {
        $teacher = User::with([
            'teacherProfile.scientificArea',
            'teacherProfile.course',
        ])->findOrFail($id);

        abort_unless(
            $teacher->hasRole('teacher') &&
            $teacher
                ->teacherProfile
                ?->scientificArea
                ?->organ_id === $organ->id,
            403,
            'Este docente não pertence ao teu núcleo.'
        );

        return $teacher;
    }
}
