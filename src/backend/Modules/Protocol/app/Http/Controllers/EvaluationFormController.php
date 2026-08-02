<?php

namespace Modules\Protocol\app\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Modules\Protocol\app\Http\Requests\DecideEvaluationRequest;
use Modules\Protocol\app\Http\Requests\SubmitCriterionReviewRequest;
use Modules\Protocol\app\Http\Requests\SubmitEvaluationRequest;
use Modules\Protocol\app\Http\Resources\EvaluationFormResource;
use Modules\Protocol\app\Models\EvaluationForm;
use Modules\Protocol\app\Models\EvaluationFormCriterion;
use Modules\Protocol\app\Models\Opinion;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Services\DocumentGenerationService;
use Modules\Protocol\app\Services\EvaluationService;
use Modules\User\app\Models\User;

class EvaluationFormController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private EvaluationService $evaluationService) {}

    private function canAccessProtocolDocument(User $user, Protocol $protocol): bool
    {
        $user->loadMissing(['teacherProfile', 'secretaryProfile']);

        if ($user->hasPermission('protocol.view.all') || (int) $protocol->student === (int) $user->id) {
            return true;
        }

        $teacherProfile = $user->teacherProfile;

        if ($teacherProfile && (int) $protocol->supervisor_id === (int) $teacherProfile->id) {
            return true;
        }

        if ($teacherProfile && $user->hasPermission('protocol.evaluate')) {
            return $protocol->reviewAssignments()
                ->where(fn($query) => $query
                    ->where('reviewer_one', $teacherProfile->id)
                    ->orWhere('reviewer_two', $teacherProfile->id)
                )
                ->exists();
        }

        if ($user->hasPermission('protocol.assign')) {
            $secretaryProfile = $user->secretaryProfile;

            return ! $secretaryProfile
                || ! $secretaryProfile->organ_id
                || (int) $protocol->current_organ_id === (int) $secretaryProfile->organ_id;
        }

        return false;
    }

    private function routeFormOrgan(Request $request): string
    {
        if ($request->routeIs('cc.*')) {
            return Protocol::ORGAN_COMITE_CIENTIFICO;
        }

        if ($request->routeIs('bioetica.*')) {
            return Protocol::ORGAN_COMITE_BIOETICA;
        }

        return Protocol::ORGAN_NUCLEO;
    }

    private function isBioeticaPrimaryReviewer(User $user, EvaluationForm $form): bool
    {
        $teacherProfile = $user->teacherProfile;

        if (! $teacherProfile) {
            return false;
        }

        return $form->reviewerEvaluations()
            ->where('reviewer_id', $teacherProfile->id)
            ->whereHas('protocolReviewAssignment', fn($query) => $query->where('is_primary', true))
            ->exists();
    }

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
            $request->input('decision'),
            $request->input('overall_comment')
        );

        $response = [
            'message' => 'Avaliação submetida com sucesso.',
            'reviewer_evaluation' => $result['reviewer_evaluation'],
            'auto_approved' => $result['auto_approved'],
            'deliberation_pending' => $result['deliberation_pending'] ?? false,
            'evaluation_form' => EvaluationFormResource::make($result['form']),
        ];

        if ($result['deliberation_pending'] ?? false) {
            $response['message'] = 'Avaliação submetida. Aguardando reunião de deliberação.';
        }

        if ($result['opinion']) {
            $opinion = $result['opinion'];
            $protocol = $opinion->protocol;

            $path = app(DocumentGenerationService::class)->generateOpinionPdf($opinion);
            $opinion->update(['document_path' => $path]);

            $messages = [
                Protocol::STATUS_PENDING_COMITE_CIENTIFICO => 'Protocolo aprovado e encaminhado ao Comité Científico.',
                Protocol::STATUS_PENDING_COMITE_BIOETICA => 'Protocolo aprovado e encaminhado ao Comité de Bioética.',
                Protocol::STATUS_APPROVED_FINAL => 'Protocolo aprovado definitivamente.',
                Protocol::STATUS_REJECTED_NUCLEO => 'Protocolo não aprovado pelo Núcleo Científico.',
                Protocol::STATUS_REJECTED_CC => 'Protocolo não aprovado pelo Comité Científico.',
                Protocol::STATUS_REJECTED_BIOETICA => 'Protocolo não aprovado pelo Comité de Bioética.',
                Protocol::STATUS_REJECTED_FINAL => 'Protocolo não aprovado.',
            ];

            $response['message'] = $messages[$protocol->status] ?? 'Protocolo actualizado.';
            $response['opinion'] = [
                'id' => $opinion->id,
                'version' => $opinion->effectiveVersion(),
                'decision' => $opinion->decision,
                'issued_at' => $opinion->issued_at,
                'document_url' => Storage::disk('public')->url($path),
                'download_url' => url("api/v1/opinions/{$opinion->id}/download"),
                'evaluation_form_download_url' => url("api/v1/evaluation-forms/{$form->id}/download"),
            ];
        }

        return response()->json($response);
    }

    public function markEvaluated(SubmitEvaluationRequest $request, EvaluationForm $form)
    {
        $this->authorize('submitEvaluation', $form);

        if (! in_array($form->organ, [Protocol::ORGAN_COMITE_CIENTIFICO, Protocol::ORGAN_COMITE_BIOETICA], true)) {
            return response()->json([
                'message' => 'Esta acção está disponível apenas para fichas do Comité Científico e Comité de Bioética.',
            ], 422);
        }

        $result = $this->evaluationService->markAsReviewed(
            $form,
            $request->user(),
            $request->input('decision'),
            $request->input('overall_comment')
        );

        $message = ($result['deliberation_pending'] ?? false)
            ? 'Avaliação registada. Aguardando marcação da deliberação.'
            : 'Marcado como avaliado. Aguardando o outro revisor.';

        return response()->json([
            'message' => $message,
            'reviewer_evaluation' => $result['reviewer_evaluation'],
            'deliberation_pending' => $result['deliberation_pending'] ?? false,
            'evaluation_form' => EvaluationFormResource::make($result['form']),
        ]);
    }

    public function scheduleDeliberation(Request $request, EvaluationForm $form)
    {
        $user = $request->user();

        if (! $user->hasPermission('protocol.assign')) {
            return response()->json(['message' => 'Apenas a secretaria pode marcar a deliberação.'], 403);
        }

        if (! in_array($form->status, [
            EvaluationForm::STATUS_DELIBERATION_PENDING,
            EvaluationForm::STATUS_NOT_DELIBERATED,
        ], true)) {
            return response()->json(['message' => 'A ficha não está em estado de deliberação pendente.'], 422);
        }

        $validated = $request->validate([
            'deliberation_date' => 'required|date',
            'deliberation_location' => 'required|string|max:500',
        ]);

        $form = $this->evaluationService->scheduleDeliberation(
            $form,
            $user,
            $validated['deliberation_date'],
            $validated['deliberation_location']
        );

        return response()->json([
            'message' => 'Deliberação marcada com sucesso.',
            'evaluation_form' => EvaluationFormResource::make($form),
        ]);
    }

    public function startDeliberation(EvaluationForm $form)
    {
        $user = request()->user();

        $teacherProfile = $user->teacherProfile;
        if (! $teacherProfile || ! $user->hasPermission('protocol.evaluate')) {
            return response()->json(['message' => 'Apenas revisores podem iniciar a deliberação.'], 403);
        }

        $form = $this->evaluationService->startDeliberation($form, $user);

        return response()->json([
            'message' => 'Reunião de deliberação iniciada.',
            'evaluation_form' => EvaluationFormResource::make($form),
        ]);
    }

    public function submitDeliberation(Request $request, EvaluationForm $form)
    {
        $this->authorize('submitEvaluation', $form);

        $validated = $request->validate([
            'decision' => 'required|string|in:approved,not_approved',
            'conclusion_summary' => 'nullable|string|max:5000',
        ]);

        $result = $this->evaluationService->submitDeliberation(
            $form,
            $request->user(),
            $validated['decision'],
            $validated['conclusion_summary'] ?? null
        );

        $protocol = $result['evaluation_form']->protocol;

        if (! $result['opinion']) {
            return response()->json([
                'message' => 'Ficha de deliberação submetida. Aguardando decisão final.',
                'evaluation_form' => EvaluationFormResource::make($result['evaluation_form']),
            ]);
        }

        $opinion = $result['opinion'];
        $path = app(DocumentGenerationService::class)->generateOpinionPdf($opinion);
        $opinion->update(['document_path' => $path]);

        $messages = [
            Protocol::STATUS_PENDING_COMITE_CIENTIFICO => 'Protocolo aprovado e encaminhado ao Comité Científico.',
            Protocol::STATUS_PENDING_COMITE_BIOETICA => 'Protocolo aprovado e encaminhado ao Comité de Bioética.',
            Protocol::STATUS_APPROVED_FINAL => 'Protocolo aprovado definitivamente.',
            Protocol::STATUS_REJECTED_NUCLEO => 'Protocolo não aprovado pelo Núcleo Científico.',
            Protocol::STATUS_REJECTED_CC => 'Protocolo não aprovado pelo Comité Científico.',
            Protocol::STATUS_REJECTED_BIOETICA => 'Protocolo não aprovado pelo Comité de Bioética.',
            Protocol::STATUS_REJECTED_FINAL => 'Protocolo não aprovado.',
        ];

        return response()->json([
            'message' => $messages[$protocol->status] ?? 'Deliberação concluída.',
            'evaluation_form' => EvaluationFormResource::make($result['evaluation_form']),
            'opinion' => [
                'id' => $opinion->id,
                'version' => $opinion->effectiveVersion(),
                'decision' => $opinion->decision,
                'issued_at' => $opinion->issued_at,
                'document_url' => Storage::disk('public')->url($path),
                'download_url' => url("api/v1/opinions/{$opinion->id}/download"),
                'evaluation_form_download_url' => url("api/v1/evaluation-forms/{$form->id}/download"),
            ],
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

        $protocol = $result['evaluation_form']->protocol;
        $messages = [
            Protocol::STATUS_PENDING_COMITE_CIENTIFICO => 'Protocolo aprovado e encaminhado ao Comité Científico.',
            Protocol::STATUS_PENDING_COMITE_BIOETICA => 'Protocolo aprovado e encaminhado ao Comité de Bioética.',
            Protocol::STATUS_APPROVED_FINAL => 'Protocolo aprovado definitivamente.',
            Protocol::STATUS_REJECTED_NUCLEO => 'Protocolo não aprovado.',
            Protocol::STATUS_REJECTED_CC => 'Protocolo não aprovado.',
            Protocol::STATUS_REJECTED_BIOETICA => 'Protocolo não aprovado.',
            Protocol::STATUS_REJECTED_FINAL => 'Protocolo não aprovado.',
        ];

        return response()->json([
            'message' => $messages[$protocol->status] ?? 'Protocolo actualizado.',
            'evaluation_form' => EvaluationFormResource::make($result['evaluation_form']),
            'opinion' => [
                'id' => $opinion->id,
                'decision' => $opinion->decision,
                'issued_at' => $opinion->issued_at,
                'document_url' => Storage::disk('public')->url($path),
                'download_url' => url("api/v1/opinions/{$opinion->id}/download"),
                'evaluation_form_download_url' => url("api/v1/evaluation-forms/{$form->id}/download"),
            ],
        ]);
    }

    public function downloadOpinion(Request $request, Opinion $opinion, DocumentGenerationService $documentService)
    {
        $user = $request->user();
        $opinion->loadMissing('protocol', 'evaluationForm');
        $protocol = $opinion->protocol;

        if (! $protocol || ! $this->canAccessProtocolDocument($user, $protocol)) {
            abort(403);
        }

        $expectedFileName = 'parecer-' . $documentService->opinionVersion($opinion) . '.pdf';

        if (
            ! $opinion->document_path
            || ! Storage::disk('public')->exists($opinion->document_path)
            || basename($opinion->document_path) !== $expectedFileName
        ) {
            $path = $documentService->generateOpinionPdf($opinion);
            $opinion->update(['document_path' => $path]);
        }

        $fileName = basename($opinion->document_path);
        $inline = $request->query('inline') === '1';
        $headers = [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => ($inline ? 'inline' : 'attachment') . '; filename="' . $fileName . '"',
        ];

        if ($inline) {
            return Storage::disk('public')->response($opinion->document_path, $fileName, $headers);
        }

        return Storage::disk('public')->download($opinion->document_path, $fileName, $headers);
    }

    public function downloadEvaluationForm(
        Request $request,
        EvaluationForm $form,
        DocumentGenerationService $documentService
    ) {
        $user = $request->user();
        $form->loadMissing('protocol');
        $protocol = $form->protocol;

        if (! $protocol || ! $this->canAccessProtocolDocument($user, $protocol)) {
            abort(403);
        }

        if ($form->organ === Protocol::ORGAN_COMITE_BIOETICA && ! $this->isBioeticaPrimaryReviewer($user, $form)) {
            abort(403, 'Apenas o revisor principal do Comité de Bioética pode baixar esta ficha.');
        }

        $path = $documentService->generateEvaluationFormPdf($form);
        $protocolCode = $protocol->code ?: $protocol->id;
        $fileName = "ficha-avaliacao-{$protocolCode}-{$form->version}.pdf";
        $inline = $request->query('inline') === '1';
        $headers = [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => ($inline ? 'inline' : 'attachment') . '; filename="' . $fileName . '"',
        ];

        if ($inline) {
            return Storage::disk('public')->response($path, $fileName, $headers);
        }

        return Storage::disk('public')->download($path, $fileName, $headers);
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

        $protocol = Protocol::query()->findOrFail($protocol);

        if (! $this->canAccessProtocolDocument($user, $protocol)) {
            abort(403);
        }

        $opinions = Opinion::query()
            ->where('protocol_id', $protocol->id)
            ->with(['issuedBy:id,name,email', 'evaluationForm:id,version'])
            ->latest('issued_at')
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'version' => $o->effectiveVersion(),
                'organ' => $o->organ,
                'decision' => $o->decision,
                'observations' => $o->observations,
                'issued_at' => $o->issued_at,
                'issued_by' => $o->issuedBy ? [
                    'id' => $o->issuedBy->id,
                    'name' => $o->issuedBy->name,
                ] : null,
                'document_url' => $o->document_path ? Storage::disk('public')->url($o->document_path) : null,
                'download_url' => url("api/v1/opinions/{$o->id}/download"),
                'evaluation_form_download_url' => $o->evaluation_form_id
                    ? url("api/v1/evaluation-forms/{$o->evaluation_form_id}/download")
                    : null,
            ]);

        return response()->json([
            'opinions' => $opinions,
        ]);
    }

// Function to close the deliberation meeting, setting the status to either deliberated or not deliberated based on the outcome
    public function closeMeeting(Request $request, EvaluationForm $form)
{
    $this->authorize('submitEvaluation', $form);

    $validated = $request->validate([
        'result' => 'nullable|string|in:deliberated,not_deliberated',
    ]);

    $form = $this->evaluationService->closeMeeting(
        $form,
        $request->user(),
        $validated['result'] ?? null
    );

    $message = $form->status === EvaluationForm::STATUS_DELIBERATED
        ? 'Reunião encerrada com deliberação. Aguardando decisão final.'
        : 'Reunião encerrada sem consenso. Aguardando agendamento de nova reunião pela secretaria.';

    return response()->json([
        'message' => $message,
        'evaluation_form' => EvaluationFormResource::make($form),
    ]);
}


public function getPendingFinalDecision(Request $request)
{
    $user = $request->user();

    if (! $user->hasPermission('protocol.evaluate')) {
        return response()->json(['message' => 'Sem permissão para ver decisões pendentes.'], 403);
    }

    $organ = $this->routeFormOrgan($request);

    return response()->json([
        'evaluation_forms' => EvaluationFormResource::collection(
            $this->evaluationService->listPendingFinalDecision($user, $organ)
        ),
    ]);
}

}
