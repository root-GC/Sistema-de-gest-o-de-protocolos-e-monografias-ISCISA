# Plano de Correção — Fluxo de Transição de Protocolos Entre Órgãos

## Bugs Identificados

| # | Bug | Ficheiro | Local |
|---|-----|----------|-------|
| 1 | `current_organ_id` nunca actualizado na transição | `EvaluationService.php:217-227` | `$protocolUpdates` não inclui `current_organ_id` |
| 2 | Status seguinte **hardcoded** para `PENDING_COMITE_CIENTIFICO` | `EvaluationService.php:213-214` | `$newStatus` fixo, sem lógica de órgão actual |
| 3 | Version bump só para `nucleo→cc` | `EvaluationService.php:219-225` | Falta `elseif` para `scientific_committee→bioethics` e `bioethics→final` |
| 4 | Nenhum `EvaluationForm` criado para o próximo órgão | `EvaluationService.php` | `createForProtocol()` só chamado no Núcleo |
| 5 | Listagens/rotas só para Núcleo | `ProtocolService.php:212-233` + `routes/api.php` | Secretário só vê `PENDING_NUCLEO`/`IN_REVIEW_NUCLEO` |
| 6 | Faltam status `IN_REVIEW` para CC e CB | `Protocol.php` | Existe `IN_REVIEW_NUCLEO` mas não `IN_REVIEW_COMITE_CIENTIFICO` nem `IN_REVIEW_COMITE_BIOETICA` |

---

## Fluxo Correcto (Após Correção)

```
Student submite protocolo (.docx)
  → protocol_pending_supervisor  (document.active = v1)
  → Supervisor aprova
  → protocol_pending_nucleo  (+ current_organ_id = núcleo, version = NC_V1)
  → Secretário NC atribui revisores
  → protocol_in_review_nucleo
  → Revisores NC avaliam + decide()
      ├── Rejeitado → protocol_rejected_final  (FIM)
      └── Aprovado → protocol_pending_comite_cientifico
                      (+ current_organ_id = CC, cc_version+1, version = CC_V01)
                      (+ novo EvaluationForm para CC)
  → Secretário CC atribui revisores
  → protocol_in_review_comite_cientifico  ← NOVO STATUS
  → Revisores CC avaliam + decide()
      ├── Rejeitado → protocol_rejected_final
      └── Aprovado → protocol_pending_comite_bioetica
                      (+ current_organ_id = CB, cb_version+1, version = CB_V01)
                      (+ novo EvaluationForm para CB)
  → Secretário CB atribui revisores
  → protocol_in_review_comite_bioetica  ← NOVO STATUS
  → Revisores CB avaliam + decide()
      ├── Rejeitado → protocol_rejected_final
      └── Aprovado → protocol_approved_final  (+ version = "APROVADO")
```

---

## Ficheiros a Alterar

### 1. `Modules/Protocol/app/Models/Protocol.php`

```php
<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\User\app\Models\TeacherProfile;
use Modules\User\app\Models\Organ;
use Modules\User\app\Models\User;

class Protocol extends Model
{
    use SoftDeletes;

    public const STATUS_PENDING_SUPERVISOR      = 'protocol_pending_supervisor';
    public const STATUS_REJECTED_SUPERVISOR     = 'protocol_rejected_supervisor';
    public const STATUS_PENDING_NUCLEO          = 'protocol_pending_nucleo';
    public const STATUS_IN_REVIEW_NUCLEO        = 'protocol_in_review_nucleo';
    public const STATUS_PENDING_COMITE_CIENTIFICO   = 'protocol_pending_comite_cientifico';
    public const STATUS_IN_REVIEW_COMITE_CIENTIFICO = 'protocol_in_review_comite_cientifico';  // NOVO
    public const STATUS_PENDING_COMITE_BIOETICA     = 'protocol_pending_comite_bioetica';
    public const STATUS_IN_REVIEW_COMITE_BIOETICA   = 'protocol_in_review_comite_bioetica';  // NOVO
    public const STATUS_APPROVED_FINAL          = 'protocol_approved_final';
    public const STATUS_REJECTED_FINAL          = 'protocol_rejected_final';

    // Mapa de fluxo entre órgãos
    const ORGAN_FLOW = [
        'nucleus' => [
            'next_status'      => self::STATUS_PENDING_COMITE_CIENTIFICO,
            'in_review_status' => self::STATUS_IN_REVIEW_NUCLEO,
            'next_organ_type'  => 'scientific_committee',
            'version_prefix'   => 'CC_V',
            'version_field'    => 'cc_version',
        ],
        'scientific_committee' => [
            'next_status'      => self::STATUS_PENDING_COMITE_BIOETICA,
            'in_review_status' => self::STATUS_IN_REVIEW_COMITE_CIENTIFICO,
            'next_organ_type'  => 'bioethics_committee',
            'version_prefix'   => 'CB_V',
            'version_field'    => 'cb_version',
        ],
        'bioethics_committee' => [
            'next_status'      => self::STATUS_APPROVED_FINAL,
            'in_review_status' => self::STATUS_IN_REVIEW_COMITE_BIOETICA,
            'next_organ_type'  => null,
            'version_prefix'   => null,
            'version_field'    => null,
        ],
    ];

    protected $fillable = [
        'student',
        'supervisor_id',
        'current_organ_id',
        'code',
        'topic_id',
        'approved_by_supervisor',
        'protocol_type',
        'submission_number',
        'status',
        'version',
        'submitted_at',
        'supervisor_decision_at',
        'justification',
        'nc_version',
        'cc_version',
        'cb_version',
    ];

    protected $casts = [
        'approved_by_supervisor' => 'boolean',
        'submitted_at' => 'datetime',
        'supervisor_decision_at' => 'datetime',
        'submission_number' => 'integer',
        'nc_version' => 'integer',
        'cc_version' => 'integer',
        'cb_version' => 'integer',
    ];

    protected $appends = [
        'status_label',
    ];

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING_SUPERVISOR      => 'Aguardando aprovacao do supervisor',
            self::STATUS_REJECTED_SUPERVISOR     => 'Rejeitado pelo supervisor',
            self::STATUS_PENDING_NUCLEO          => 'Encaminhado ao Nucleo Cientifico',
            self::STATUS_IN_REVIEW_NUCLEO        => 'Em avaliacao pelo Nucleo Cientifico',
            self::STATUS_PENDING_COMITE_CIENTIFICO   => 'Encaminhado ao Comite Cientifico',
            self::STATUS_IN_REVIEW_COMITE_CIENTIFICO => 'Em avaliacao pelo Comite Cientifico',
            self::STATUS_PENDING_COMITE_BIOETICA     => 'Encaminhado ao Comite de Bioetica',
            self::STATUS_IN_REVIEW_COMITE_BIOETICA   => 'Em avaliacao pelo Comite de Bioetica',
            self::STATUS_APPROVED_FINAL          => 'Aprovado',
            self::STATUS_REJECTED_FINAL          => 'Rejeitado',
            default => $this->status,
        };
    }

    public function topic()
    {
        return $this->belongsTo(Topic::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student');
    }

    public function currentOrgan()
    {
        return $this->belongsTo(Organ::class, 'current_organ_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function latestDocument()
    {
        return $this->hasOne(Document::class)->latest('version');
    }

    public function reviewAssignments()
    {
        return $this->hasMany(ProtocolReviewAssignment::class);
    }

    public function supervisor()
    {
        return $this->belongsTo(TeacherProfile::class, 'supervisor_id');
    }
}
```

**O que muda:** Adicionar as constantes `STATUS_IN_REVIEW_COMITE_CIENTIFICO`, `STATUS_IN_REVIEW_COMITE_BIOETICA`, o array `ORGAN_FLOW`, e os labels correspondentes.

---

### 2. `Modules/Protocol/app/Services/EvaluationService.php`

```php
<?php

namespace Modules\Protocol\app\Services;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Organization\app\Models\Organ;
use Modules\Protocol\app\Models\EvaluationCriterion;
use Modules\Protocol\app\Models\EvaluationCriterionReview;
use Modules\Protocol\app\Models\EvaluationForm;
use Modules\Protocol\app\Models\EvaluationFormCriterion;
use Modules\Protocol\app\Models\Opinion;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\ProtocolReviewAssignment;
use Modules\Protocol\app\Models\ReviewerEvaluation;
use Modules\User\app\Models\User;

class EvaluationService
{
    public function createForProtocol(Protocol $protocol, array $reviewerIds, User $secretary, string $organ = 'nucleo'): EvaluationForm
    {
        return DB::transaction(function () use ($protocol, $reviewerIds, $secretary, $organ) {
            $protocol = Protocol::lockForUpdate()->findOrFail($protocol->id);
            $version = $protocol->version ?: '1';

            $form = EvaluationForm::create([
                'protocol_id' => $protocol->id,
                'version' => $version,
                'organ' => $organ,
                'status' => EvaluationForm::STATUS_PENDING_REVIEW,
            ]);

            $criteria = EvaluationCriterion::query()
                ->where('is_active', true)
                ->orderBy('order_column')
                ->get();

            if ($criteria->isEmpty()) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => 'Nenhum critério de avaliação activo encontrado.',
                    ], 500)
                );
            }

            foreach ($criteria as $criterion) {
                EvaluationFormCriterion::create([
                    'evaluation_form_id' => $form->id,
                    'criterion_id' => $criterion->id,
                    'group_name' => $criterion->group_name,
                    'criterion_name' => $criterion->name,
                    'order_column' => $criterion->order_column,
                ]);
            }

            $assignment = ProtocolReviewAssignment::query()
                ->where('protocol_id', $protocol->id)
                ->latest('assigned_at')
                ->first();

            foreach ($reviewerIds as $reviewerId) {
                if (! $reviewerId) continue;

                ReviewerEvaluation::create([
                    'evaluation_form_id' => $form->id,
                    'protocol_review_assignment_id' => $assignment->id,
                    'reviewer_id' => $reviewerId,
                    'status' => ReviewerEvaluation::STATUS_PENDING,
                ]);
            }

            return $form->load(['formCriteria', 'reviewerEvaluations']);
        });
    }

    public function getFormWithReviews(EvaluationForm $form, User $user): EvaluationForm
    {
        $teacherProfile = $user->teacherProfile;

        $form->load([
            'protocol.topic:id,title,status',
            'protocol.topic.scientificArea:id,name',
            'protocol.topic.course:id,name,code',
            'formCriteria' => fn($q) => $q->orderBy('order_column'),
            'reviewerEvaluations' => fn($q) => $q->with([
                'criterionReviews',
                'reviewer.user:id,name',
            ]),
        ]);

        return $form;
    }

    public function saveCriterionReview(EvaluationForm $form, EvaluationFormCriterion $formCriterion, User $user, ?string $comment): EvaluationCriterionReview
    {
        return DB::transaction(function () use ($form, $formCriterion, $user, $comment) {
            $teacherProfile = $user->teacherProfile;

            $reviewerEvaluation = $form->reviewerEvaluations()
                ->where('reviewer_id', $teacherProfile->id)
                ->first();

            if (! $reviewerEvaluation) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Não está atribuído como revisor desta ficha.'], 403)
                );
            }

            if ($reviewerEvaluation->status === ReviewerEvaluation::STATUS_SUBMITTED) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Avaliação já foi submetida. Não é possível alterar.'], 422)
                );
            }

            $criterionReview = EvaluationCriterionReview::query()->updateOrCreate(
                [
                    'reviewer_evaluation_id' => $reviewerEvaluation->id,
                    'evaluation_form_criterion_id' => $formCriterion->id,
                ],
                ['comment' => $comment]
            );

            if ($reviewerEvaluation->status === ReviewerEvaluation::STATUS_PENDING) {
                $reviewerEvaluation->update(['status' => ReviewerEvaluation::STATUS_IN_PROGRESS]);
            }

            return $criterionReview->load('formCriterion');
        });
    }

    public function submitEvaluation(EvaluationForm $form, User $reviewer, string $recommendation, ?string $overallComment): ReviewerEvaluation
    {
        return DB::transaction(function () use ($form, $reviewer, $recommendation, $overallComment) {
            $teacherProfile = $reviewer->teacherProfile;

            $reviewerEvaluation = $form->reviewerEvaluations()
                ->where('reviewer_id', $teacherProfile->id)
                ->first();

            if (! $reviewerEvaluation) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Não está atribuído como revisor desta ficha.'], 403)
                );
            }

            if ($reviewerEvaluation->status === ReviewerEvaluation::STATUS_SUBMITTED) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Avaliação já foi submetida anteriormente.'], 422)
                );
            }

            $totalCriteria = $form->formCriteria()->count();
            $reviewedCount = $reviewerEvaluation->criterionReviews()->count();

            if ($totalCriteria > 0 && $reviewedCount === 0) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Deve preencher pelo menos um comentário antes de submeter.'], 422)
                );
            }

            $reviewerEvaluation->update([
                'recommendation' => $recommendation,
                'overall_comment' => $overallComment,
                'status' => ReviewerEvaluation::STATUS_SUBMITTED,
                'submitted_at' => now(),
            ]);

            $form->update(['status' => EvaluationForm::STATUS_IN_REVIEW]);

            return $reviewerEvaluation->load(['criterionReviews.formCriterion']);
        });
    }

    // ════════════════════════════════════════════════════════════
    //  decide() — CORRIGIDO: dinâmico por órgão
    // ════════════════════════════════════════════════════════════
    public function decide(EvaluationForm $form, User $decider, string $decision, ?string $conclusionSummary): array
    {
        return DB::transaction(function () use ($form, $decider, $decision, $conclusionSummary) {
            $form = EvaluationForm::lockForUpdate()->findOrFail($form->id);
            $teacherProfile = $decider->teacherProfile;
            $protocol = $form->protocol()->first();

            if (! $teacherProfile) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Apenas docentes podem decidir.'], 403)
                );
            }

            $isReviewer = $form->reviewerEvaluations()
                ->where('reviewer_id', $teacherProfile->id)
                ->exists();

            if (! $isReviewer) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Apenas um revisor atribuído pode decidir.'], 403)
                );
            }

            if ($form->status === EvaluationForm::STATUS_CONCLUDED) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Esta ficha já foi concluída.'], 422)
                );
            }

            // Concluir ficha actual
            $form->update([
                'final_decision' => $decision,
                'decided_by' => $decider->id,
                'decided_at' => now(),
                'status' => EvaluationForm::STATUS_CONCLUDED,
                'conclusion_summary' => $conclusionSummary,
            ]);

            $protocolUpdates = [];

            if ($decision === 'rejected') {
                $protocolUpdates['status'] = Protocol::STATUS_REJECTED_FINAL;
            } else {
                // Buscar fluxo do órgão actual
                $flow = Protocol::ORGAN_FLOW[$form->organ] ?? null;

                if (! $flow) {
                    throw new HttpResponseException(
                        response()->json(['message' => "Órgão desconhecido: {$form->organ}"], 500)
                    );
                }

                $protocolUpdates['status'] = $flow['next_status'];

                // Actualizar current_organ_id para o próximo órgão
                if ($flow['next_organ_type']) {
                    $nextOrgan = Organ::where('type', $flow['next_organ_type'])->first();
                    if ($nextOrgan) {
                        $protocolUpdates['current_organ_id'] = $nextOrgan->id;
                    }
                }

                // Version bump por órgão
                if ($flow['version_field'] && $flow['version_prefix']) {
                    $field = $flow['version_field'];
                    $current = (int) $protocol->$field;
                    $newVersion = max(1, $current + 1);
                    $protocolUpdates[$field] = $newVersion;
                    $protocolUpdates['version'] = $flow['version_prefix'] . sprintf('%02d', $newVersion);
                } else {
                    // Órgão final (bioethics → approved)
                    $protocolUpdates['version'] = 'APROVADO';
                }
            }

            $protocol->update($protocolUpdates);

            // ── CRIAR NOVO EvaluationForm para o próximo órgão ──
            if ($decision === 'approved' && $flow['next_organ_type']) {
                $nextOrganType = $flow['next_organ_type'];

                $nextSecretary = User::whereHas('secretaryProfile.organ', fn($q) =>
                    $q->where('type', $nextOrganType)
                )->first();

                if ($nextSecretary) {
                    $this->createForProtocol(
                        $protocol->fresh(),
                        [],
                        $nextSecretary,
                        $nextOrganType
                    );
                }
            }

            // Gerar parecer
            $opinionVersion = $protocolUpdates['version'] ?? $form->version;

            $opinion = Opinion::create([
                'protocol_id' => $protocol->id,
                'evaluation_form_id' => $form->id,
                'version' => $opinionVersion,
                'organ' => $form->organ,
                'decision' => $decision,
                'observations' => $conclusionSummary,
                'issued_by' => $decider->id,
                'issued_at' => now(),
            ]);

            $opinion->fresh();

            $form->load([
                'protocol',
                'reviewerEvaluations.criterionReviews.formCriterion',
                'formCriteria',
            ]);

            return [
                'evaluation_form' => $form,
                'opinion' => $opinion,
            ];
        });
    }

    public function listForReviewer(User $reviewer): Collection
    {
        $teacherProfile = $reviewer->teacherProfile;

        if (! $teacherProfile) {
            return collect();
        }

        return EvaluationForm::query()
            ->whereHas('reviewerEvaluations', fn($q) => $q->where('reviewer_id', $teacherProfile->id))
            ->with([
                'protocol.topic:id,title,status',
                'protocol.topic.scientificArea:id,name',
                'protocol.topic.course:id,name,code',
                'reviewerEvaluations' => fn($q) => $q
                    ->where('reviewer_id', $teacherProfile->id)
                    ->with('criterionReviews.formCriterion'),
            ])
            ->latest('created_at')
            ->get();
    }

    // listForSecretary — CORRIGIDO: dinâmico por órgão
    public function listForSecretary(User $secretary): Collection
    {
        $secretaryProfile = $secretary->secretaryProfile;

        if (! $secretaryProfile) {
            return collect();
        }

        $organ = $secretaryProfile->organ;

        // Status relevantes por tipo de órgão
        $statusMap = [
            'nucleus' => [
                Protocol::STATUS_PENDING_NUCLEO,
                Protocol::STATUS_IN_REVIEW_NUCLEO,
            ],
            'scientific_committee' => [
                Protocol::STATUS_PENDING_COMITE_CIENTIFICO,
                Protocol::STATUS_IN_REVIEW_COMITE_CIENTIFICO,
            ],
            'bioethics_committee' => [
                Protocol::STATUS_PENDING_COMITE_BIOETICA,
                Protocol::STATUS_IN_REVIEW_COMITE_BIOETICA,
            ],
        ];

        $statuses = $statusMap[$organ->type] ?? [];

        if (empty($statuses)) {
            return collect();
        }

        return EvaluationForm::query()
            ->whereHas('protocol', fn($q) => $q
                ->whereIn('status', $statuses)
                ->where('current_organ_id', $organ->id)
            )
            ->where('organ', $organ->type)
            ->with([
                'protocol.topic:id,title,status,scientific_area_id,supervisor_id',
                'protocol.topic.scientificArea:id,name,organ_id',
                'protocol.student:id,name,email',
                'reviewerEvaluations.reviewer.user:id,name,email',
                'formCriteria',
            ])
            ->latest('created_at')
            ->get();
    }
}
```

**O que muda no `decide()`:**
- Substitui o status hardcoded `STATUS_PENDING_COMITE_CIENTIFICO` por `$flow['next_status']` dinâmico
- Actualiza `current_organ_id` com o ID do próximo órgão via `Organ::where('type', ...)`
- Version bump completo: `nucleus → cc_version`, `scientific_committee → cb_version`, `bioethics_committee → final`
- Cria novo `EvaluationForm` para o próximo órgão após aprovação
- Para rejeição → `STATUS_REJECTED_FINAL` independente do órgão

**O que muda no `listForSecretary()`:**
- Filtro por `current_organ_id` + status específicos do órgão do secretário
- Usa `$statusMap` para mapear tipo de órgão → status relevantes

---

### 3. `Modules/Protocol/app/Services/ProtocolService.php`

```php
<?php

namespace Modules\Protocol\app\Services;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Protocol\app\Models\Document;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\ProtocolReviewAssignment;
use Modules\Protocol\app\Services\EvaluationService;
use Modules\Protocol\app\Models\Topic;
use Modules\User\app\Models\User;

class ProtocolService
{
    public function submit(User $user, Topic $topic, UploadedFile $document, string $protocolType): Protocol
    {
        $topic->loadMissing('student', 'supervisor.user', 'scientificArea.organ');

        if ((int) $topic->student_id !== (int) $user->id) {
            throw new HttpResponseException(response()->json([
                'message' => 'Apenas o estudante dono do tema pode submeter o protocolo.',
            ], 403));
        }

        $existing = Protocol::query()
            ->where('topic_id', $topic->id)
            ->latest('submitted_at')
            ->first();

        if ($existing && ! in_array($existing->status, [Protocol::STATUS_REJECTED_SUPERVISOR], true)) {
            throw new HttpResponseException(response()->json([
                'message' => 'Ja existe um protocolo ativo para este tema.',
                'existing_protocol' => $existing,
            ], 409));
        }

        return DB::transaction(function () use ($user, $topic, $document, $protocolType, $existing) {
            $currentOrganId = $topic->scientificArea?->organ_id;

            if ($existing) {
                $protocol = Protocol::lockForUpdate()->findOrFail($existing->id);
                $nextSubmission = ((int) ($protocol->submission_number ?: 1)) + 1;

                Document::query()
                    ->where('protocol_id', $protocol->id)
                    ->update(['status' => Document::STATUS_INACTIVE]);

                $protocol->update([
                    'approved_by_supervisor' => false,
                    'supervisor_id' => $topic->supervisor_id,
                    'protocol_type' => $protocolType,
                    'submission_number' => $nextSubmission,
                    'status' => Protocol::STATUS_PENDING_SUPERVISOR,
                    'version' => (string) $nextSubmission,
                    'submitted_at' => now(),
                    'supervisor_decision_at' => null,
                    'justification' => null,
                    'current_organ_id' => $currentOrganId,
                    'nc_version' => 0,
                    'cc_version' => 0,
                    'cb_version' => 0,
                ]);
            } else {
                $temporaryCode = 'TMP-' . strtoupper(uniqid());

                $protocol = Protocol::create([
                    'student' => $user->id,
                    'supervisor_id' => $topic->supervisor_id,
                    'current_organ_id' => $currentOrganId,
                    'code' => $temporaryCode,
                    'topic_id' => $topic->id,
                    'approved_by_supervisor' => false,
                    'protocol_type' => $protocolType,
                    'submission_number' => 1,
                    'status' => Protocol::STATUS_PENDING_SUPERVISOR,
                    'version' => '1',
                    'submitted_at' => now(),
                    'nc_version' => 0,
                    'cc_version' => 0,
                    'cb_version' => 0,
                ]);

                $code = $this->generateCode($protocol->id);
                $protocol->update(['code' => $code]);
            }

            $submissionNumber = (int) $protocol->submission_number;
            $path = $document->storeAs(
                'protocols/' . $protocol->id,
                'protocol-' . $protocol->id . '-S' . $submissionNumber . '.docx',
                'public'
            );

            Document::create([
                'submited_by' => $user->id,
                'protocol_id' => $protocol->id,
                'document_type' => $protocolType,
                'file_name' => 'protocol-' . $protocol->id . '-S' . $submissionNumber . '.docx',
                'file_path' => $path,
                'pages' => null,
                'version' => $submissionNumber,
                'status' => Document::STATUS_ACTIVE,
            ]);

            return $protocol->load(['topic:id,title,status', 'documents']);
        });
    }

    public function getForSupervisor(User $supervisor)
    {
        return Protocol::query()
            ->where('supervisor_id', $supervisor->teacherProfile?->id)
            ->with([
                'topic:id,title,status',
                'student:id,name,email',
                'supervisor.user:id,name,email',
                'documents',
            ])
            ->latest('submitted_at')
            ->get();
    }

    public function listForStudent(User $user)
    {
        return Protocol::query()
            ->where('student', $user->id)
            ->with([
                'topic:id,title,status',
                'supervisor.user:id,name,email',
                'documents',
            ])
            ->latest('submitted_at')
            ->get();
    }

    public function listForSupervisor(User $supervisor)
    {
        return Protocol::query()
            ->where('supervisor_id', $supervisor->teacherProfile?->id)
            ->with([
                'topic:id,title,status',
                'student.user:id,name,email',
                'documents',
            ])
            ->latest('submitted_at')
            ->get();
    }

    public function approveBySupervisor(Protocol $protocol, User $supervisor): Protocol
    {
        return $this->decideBySupervisor($protocol, $supervisor, 'approved', null);
    }

    public function rejectBySupervisor(Protocol $protocol, User $supervisor, ?string $justification): Protocol
    {
        return $this->decideBySupervisor($protocol, $supervisor, 'rejected', $justification);
    }

    private function decideBySupervisor(Protocol $protocol, User $supervisor, string $decision, ?string $justification): Protocol
    {
        return DB::transaction(function () use ($protocol, $supervisor, $decision, $justification) {
            $protocol = Protocol::lockForUpdate()->findOrFail($protocol->id);
            $teacherProfile = $supervisor->teacherProfile;
            $topic = $protocol->topic()->first();

            if (! $teacherProfile || ! $topic || $topic->supervisor_id !== $teacherProfile->id) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Apenas o supervisor atribuido pode avaliar este protocolo.',
                ], 403));
            }

            if ($protocol->status !== Protocol::STATUS_PENDING_SUPERVISOR) {
                throw new HttpResponseException(response()->json([
                    'message' => 'O protocolo nao esta em estado de aprovacao do supervisor.',
                ], 422));
            }

            if ($decision === 'approved') {
                $topic->loadMissing('scientificArea:id,organ_id');
                $submissionNumber = (int) ($protocol->submission_number ?: 1);

                $protocol->update([
                    'status' => Protocol::STATUS_PENDING_NUCLEO,
                    'approved_by_supervisor' => true,
                    'supervisor_decision_at' => now(),
                    'justification' => null,
                    'current_organ_id' => $topic->scientificArea?->organ_id ?: $protocol->current_organ_id,
                    'nc_version' => $submissionNumber,
                    'cc_version' => 0,
                    'cb_version' => 0,
                    'version' => 'NC_V' . $submissionNumber,
                ]);
            } else {
                $protocol->update([
                    'status' => Protocol::STATUS_REJECTED_SUPERVISOR,
                    'approved_by_supervisor' => false,
                    'supervisor_decision_at' => now(),
                    'justification' => $justification,
                    'nc_version' => 0,
                    'cc_version' => 0,
                    'cb_version' => 0,
                ]);
            }

            return $protocol->load(['topic:id,title,status', 'documents']);
        });
    }

    // ════════════════════════════════════════════════════════════
    //  listForSecretary — CORRIGIDO: dinâmico por órgão
    // ════════════════════════════════════════════════════════════
    public function listForSecretary(User $secretary): Collection
    {
        $secretaryProfile = $secretary->secretaryProfile;

        if (! $secretaryProfile) {
            return collect();
        }

        $organ = $secretaryProfile->organ;

        $statusMap = [
            'nucleus' => [
                Protocol::STATUS_PENDING_NUCLEO,
                Protocol::STATUS_IN_REVIEW_NUCLEO,
            ],
            'scientific_committee' => [
                Protocol::STATUS_PENDING_COMITE_CIENTIFICO,
                Protocol::STATUS_IN_REVIEW_COMITE_CIENTIFICO,
            ],
            'bioethics_committee' => [
                Protocol::STATUS_PENDING_COMITE_BIOETICA,
                Protocol::STATUS_IN_REVIEW_COMITE_BIOETICA,
            ],
        ];

        $statuses = $statusMap[$organ->type] ?? [];

        if (empty($statuses)) {
            return collect();
        }

        return Protocol::query()
            ->whereIn('status', $statuses)
            ->where('current_organ_id', $organ->id)
            ->with([
                'topic:id,title,status,scientific_area_id,supervisor_id',
                'topic.scientificArea:id,name,organ_id',
                'topic.supervisor.user:id,name,email',
                'student:id,name,email',
                'reviewAssignments.reviewerOne.user:id,name,email',
                'reviewAssignments.reviewerTwo.user:id,name,email',
            ])
            ->latest('submitted_at')
            ->get();
    }

    public function listForReviewer(User $reviewer): Collection
    {
        $teacherProfile = $reviewer->teacherProfile;

        if (! $teacherProfile) {
            return collect();
        }

        return Protocol::query()
            ->whereHas('reviewAssignments', fn($q) => $q
                ->where(fn($q) => $q
                    ->where('reviewer_one', $teacherProfile->id)
                    ->orWhere('reviewer_two', $teacherProfile->id)
                )
            )
            ->with([
                'topic:id,title,status,scientific_area_id',
                'topic.scientificArea:id,name',
                'topic.course:id,name,code,scientific_area_id',
                'reviewAssignments' => fn($q) => $q
                    ->where(fn($q) => $q
                        ->where('reviewer_one', $teacherProfile->id)
                        ->orWhere('reviewer_two', $teacherProfile->id)
                    ),
            ])
            ->latest('submitted_at')
            ->get();
    }

    public function getEligibleReviewers(Protocol $protocol): Collection
    {
        $protocol->loadMissing('topic.scientificArea:id,organ_id');

        $topicOrganId = $protocol->topic?->scientificArea?->organ_id;
        $topicScientificAreaId = $protocol->topic?->scientific_area_id;
        $supervisorId = $protocol->topic?->supervisor_id;

        if (! $topicOrganId || ! $topicScientificAreaId) {
            return collect();
        }

        $assignedReviewerIds = $protocol->reviewAssignments()
            ->pluck('reviewer_one')
            ->merge($protocol->reviewAssignments()->pluck('reviewer_two'))
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        return DB::table('teacher_profiles')
            ->join('scientific_areas', 'teacher_profiles.scientific_area_id', '=', 'scientific_areas.id')
            ->join('users', 'teacher_profiles.user_id', '=', 'users.id')
            ->where('scientific_areas.organ_id', $topicOrganId)
            ->where('teacher_profiles.scientific_area_id', $topicScientificAreaId)
            ->whereNull('teacher_profiles.deleted_at')
            ->whereNull('users.deleted_at')
            ->when($supervisorId, fn($q) => $q->where('teacher_profiles.id', '!=', $supervisorId))
            ->when($assignedReviewerIds !== [], fn($q) => $q->whereNotIn('teacher_profiles.id', $assignedReviewerIds))
            ->select(
                'teacher_profiles.id',
                'users.name',
                'users.email',
                'scientific_areas.name as scientific_area_name'
            )
            ->orderBy('users.name')
            ->get();
    }

    // ════════════════════════════════════════════════════════════
    //  assignReviewers — CORRIGIDO: aceita todos os órgãos
    // ════════════════════════════════════════════════════════════
    public function assignReviewers(Protocol $protocol, array $reviewerIds, User $secretary): Protocol
    {
        return DB::transaction(function () use ($protocol, $reviewerIds, $secretary) {
            $protocol = Protocol::lockForUpdate()->findOrFail($protocol->id);
            $secretaryProfile = $secretary->secretaryProfile;

            if (! $secretaryProfile) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Utilizador nao e uma secretaria.'], 403)
                );
            }

            // Status aceites para atribuição de revisores
            $assignableStatuses = [
                Protocol::STATUS_PENDING_NUCLEO,
                Protocol::STATUS_PENDING_COMITE_CIENTIFICO,
                Protocol::STATUS_PENDING_COMITE_BIOETICA,
            ];

            if (! in_array($protocol->status, $assignableStatuses, true)) {
                throw new HttpResponseException(
                    response()->json(['message' => 'O protocolo nao esta em estado de atribuicao de revisores.'], 422)
                );
            }

            $protocol->loadMissing('topic.scientificArea:id,organ_id');

            $topicOrganId = $protocol->topic?->scientificArea?->organ_id;
            if ($topicOrganId !== $secretaryProfile->organ_id) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Secretaria nao tem permissao para atribuir revisores a este protocolo.'], 403)
                );
            }

            $supervisorId = $protocol->topic?->supervisor_id;

            foreach ($reviewerIds as $reviewerId) {
                if ((int) $reviewerId === (int) $supervisorId) {
                    throw new HttpResponseException(
                        response()->json(['message' => 'O supervisor do tema nao pode ser atribuido como revisor.'], 422)
                    );
                }

                $exists = DB::table('teacher_profiles')
                    ->where('id', $reviewerId)
                    ->whereNull('deleted_at')
                    ->exists();

                if (! $exists) {
                    throw new HttpResponseException(
                        response()->json(['message' => "Revisor {$reviewerId} nao encontrado."], 422)
                    );
                }
            }

            if (count($reviewerIds) !== count(array_unique($reviewerIds))) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Os revisores devem ser diferentes.'], 422)
                );
            }

            $assignedExisting = $protocol->reviewAssignments()
                ->whereIn('reviewer_one', $reviewerIds)
                ->orWhereIn('reviewer_two', $reviewerIds)
                ->exists();

            if ($assignedExisting) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Um dos revisores ja foi atribuido a este protocolo.'], 409)
                );
            }

            $assignment = ProtocolReviewAssignment::create([
                'protocol_id' => $protocol->id,
                'organ_id' => $secretaryProfile->organ_id,
                'reviewer_one' => $reviewerIds[0] ?? null,
                'reviewer_two' => $reviewerIds[1] ?? null,
                'review_order' => false,
                'status' => 'pending',
                'assigned_at' => now(),
            ]);

            // Mapear órgão → in_review status
            $inReviewStatusMap = [
                'nucleus'              => Protocol::STATUS_IN_REVIEW_NUCLEO,
                'scientific_committee' => Protocol::STATUS_IN_REVIEW_COMITE_CIENTIFICO,
                'bioethics_committee'  => Protocol::STATUS_IN_REVIEW_COMITE_BIOETICA,
            ];

            $secretaryOrganType = $secretaryProfile->organ()->first()->type;
            $newStatus = $inReviewStatusMap[$secretaryOrganType] ?? Protocol::STATUS_IN_REVIEW_NUCLEO;
            $organ = $secretaryOrganType;

            $protocol->update([
                'status' => $newStatus,
            ]);

            // Criar ficha de avaliação para este órgão
            app(EvaluationService::class)->createForProtocol(
                $protocol,
                $reviewerIds,
                $secretary,
                $organ
            );

            return $protocol->load([
                'topic:id,title,status,scientific_area_id,supervisor_id',
                'topic.scientificArea:id,name,organ_id',
                'topic.supervisor.user:id,name,email',
                'student:id,name,email',
                'reviewAssignments.reviewerOne.user:id,name,email',
                'reviewAssignments.reviewerTwo.user:id,name,email',
            ]);
        });
    }

    private function generateCode(int $id): string
    {
        return 'PTM' . str_pad((string) $id, 4, '0', STR_PAD_LEFT) . 'E';
    }
}
```

**O que muda:**
- `listForSecretary()` — filtro dinâmico por `$organ->type` + `current_organ_id`
- `assignReviewers()` — aceita `STATUS_PENDING_COMITE_CIENTIFICO` e `STATUS_PENDING_COMITE_BIOETICA`; define o `in_review` status correcto baseado no tipo de órgão do secretário

---

### 4. `Modules/Protocol/app/Http/Controllers/EvaluationFormController.php`

```php
<?php

namespace Modules\Protocol\app\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Protocol\app\Http\Requests\DecideEvaluationRequest;
use Modules\Protocol\app\Http\Requests\SubmitCriterionReviewRequest;
use Modules\Protocol\app\Http\Requests\SubmitEvaluationRequest;
use Modules\Protocol\app\Http\Resources\EvaluationFormResource;
use Modules\Protocol\app\Models\EvaluationForm;
use Modules\Protocol\app\Models\EvaluationFormCriterion;
use Modules\Protocol\app\Models\Opinion;
use Modules\Protocol\app\Services\DocumentGenerationService;
use Modules\Protocol\app\Services\EvaluationService;

class EvaluationFormController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private EvaluationService $evaluationService) {}

    public function show(EvaluationForm $form)
    {
        $this->authorize('view', $form);

        $user = request()->user();

        return response()->json([
            'evaluation_form' => EvaluationFormResource::make(
                $this->evaluationService->getFormWithReviews($form, $user)
            ),
        ]);
    }

    public function saveCriterionReview(
        SubmitCriterionReviewRequest $request,
        EvaluationForm $form,
        EvaluationFormCriterion $formCriterion
    ) {
        $this->authorize('submitEvaluation', $form);

        if ((int) $formCriterion->evaluation_form_id !== (int) $form->id) {
            abort(404);
        }

        $result = $this->evaluationService->saveCriterionReview(
            $form,
            $formCriterion,
            $request->user(),
            $request->input('comment')
        );

        return response()->json([
            'message' => 'Comentário registado com sucesso.',
            'criterion_review' => $result,
        ]);
    }

    public function submit(SubmitEvaluationRequest $request, EvaluationForm $form)
    {
        $this->authorize('submitEvaluation', $form);

        $result = $this->evaluationService->submitEvaluation(
            $form,
            $request->user(),
            $request->input('recommendation'),
            $request->input('overall_comment')
        );

        return response()->json([
            'message' => 'Avaliação submetida com sucesso.',
            'reviewer_evaluation' => $result,
        ]);
    }

    public function decide(
        DecideEvaluationRequest $request,
        EvaluationForm $form,
        DocumentGenerationService $documentService
    ) {
        $this->authorize('decide', $form);

        $result = $this->evaluationService->decide(
            $form,
            $request->user(),
            $request->input('decision'),
            $request->input('conclusion_summary')
        );

        $opinion = $result['opinion'];
        $path = $documentService->generateOpinionPdf($opinion);
        $opinion->update(['document_path' => $path]);

        // Mensagem dinâmica baseada no próximo status
        $nextOrganLabels = [
            'protocol_pending_comite_cientifico' => 'Protocolo aprovado e encaminhado ao Comité Científico.',
            'protocol_pending_comite_bioetica'   => 'Protocolo aprovado e encaminhado ao Comité de Bioética.',
            'protocol_approved_final'            => 'Protocolo aprovado definitivamente.',
            'protocol_rejected_final'            => 'Protocolo reprovado.',
        ];

        $protocol = $result['evaluation_form']->protocol;
        $message = $nextOrganLabels[$protocol->status] ?? 'Protocolo actualizado.';

        return response()->json([
            'message' => $message,
            'evaluation_form' => EvaluationFormResource::make($result['evaluation_form']),
            'opinion' => [
                'id' => $opinion->id,
                'decision' => $opinion->decision,
                'issued_at' => $opinion->issued_at,
                'document_url' => url('storage/' . $path),
            ],
        ]);
    }

    public function downloadOpinion(Opinion $opinion)
    {
        $user = request()->user();

        $canView = $user->hasPermission('protocol.assign')
            || $user->hasPermission('protocol.evaluate')
            || (int) $opinion->protocol?->student === (int) $user->id;

        if (! $canView) {
            abort(403);
        }

        if (! $opinion->document_path || ! \Illuminate\Support\Facades\Storage::disk('public')->exists($opinion->document_path)) {
            abort(404, 'Parecer não encontrado.');
        }

        return \Illuminate\Support\Facades\Storage::disk('public')->download($opinion->document_path);
    }

    public function getForReviewer(Request $request)
    {
        $user = $request->user()->load('teacherProfile');

        if (! $user->hasPermission('protocol.evaluate')) {
            return response()->json([
                'message' => 'Utilizador não tem permissão para ver avaliações atribuídas.',
            ], 403);
        }

        return response()->json([
            'evaluation_forms' => EvaluationFormResource::collection(
                $this->evaluationService->listForReviewer($user)
            ),
        ]);
    }

    public function getForSecretary(Request $request)
    {
        $user = $request->user();

        if (! $user->hasPermission('protocol.assign')) {
            abort(403);
        }

        return response()->json([
            'evaluation_forms' => EvaluationFormResource::collection(
                $this->evaluationService->listForSecretary($user)
            ),
        ]);
    }

    public function listOpinionsForProtocol(Request $request, string $protocol)
    {
        $user = $request->user();

        $protocol = \Modules\Protocol\app\Models\Protocol::query()->findOrFail($protocol);

        $opinions = Opinion::query()
            ->where('protocol_id', $protocol->id)
            ->with('issuedBy:id,name,email')
            ->latest('issued_at')
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'version' => $o->version,
                'organ' => $o->organ,
                'decision' => $o->decision,
                'observations' => $o->observations,
                'issued_at' => $o->issued_at,
                'issued_by' => $o->issuedBy ? [
                    'id' => $o->issuedBy->id,
                    'name' => $o->issuedBy->name,
                ] : null,
                'document_url' => $o->document_path ? url('storage/' . $o->document_path) : null,
            ]);

        return response()->json([
            'opinions' => $opinions,
        ]);
    }
}
```

**O que muda:**
- Mensagem de resposta do `decide()` dinâmica baseada no próximo status do protocolo

---

## Resumo de Alterações

| # | Ficheiro | O que muda |
|---|----------|-----------|
| 1 | `Protocol.php` | +2 constantes `IN_REVIEW_CC`/`IN_REVIEW_CB`, +array `ORGAN_FLOW`, +labels |
| 2 | `EvaluationService.php` | `decide()` dinâmico: status, `current_organ_id`, version bump, nova ficha; `listForSecretary()` dinâmico |
| 3 | `ProtocolService.php` | `listForSecretary()` por `current_organ_id`; `assignReviewers()` multi-órgão com `in_review` correcto |
| 4 | `EvaluationFormController.php` | Mensagem de decisão dinâmica |

---

## Verificação Pós-Correção

1. **Núcleo → CC**: `decide('approved')` → status `pending_comite_cientifico`, `current_organ_id` = CC, `cc_version` +1, ficha CC criada
2. **Secretário CC**: `listForSecretary()` → vê protocolos com `current_organ_id` = CC e status `pending_comite_cientifico`
3. **Secretário CC atribui**: → status `in_review_comite_cientifico`, ficha CC tem `reviewerEvaluations`
4. **CC → CB**: `decide('approved')` → status `pending_comite_bioetica`, `current_organ_id` = CB, `cb_version` +1
5. **CB → Final**: `decide('approved')` → status `approved_final`, version = "APROVADO"
6. **Rejeição**: qualquer órgão → `rejected_final`

O `.docx` nunca se perde — permanece ligado pelo `protocol_id` na tabela `documents` durante todo o fluxo.
