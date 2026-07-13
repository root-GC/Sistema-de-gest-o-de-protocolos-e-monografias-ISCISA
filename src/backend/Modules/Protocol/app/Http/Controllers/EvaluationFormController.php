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

        return response()->json([
            'message' => $request->input('decision') === 'approved'
                ? 'Protocolo aprovado e encaminhado ao Comité Científico.'
                : 'Protocolo reprovado.',
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
