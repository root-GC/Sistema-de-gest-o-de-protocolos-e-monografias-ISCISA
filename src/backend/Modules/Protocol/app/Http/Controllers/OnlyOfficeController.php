<?php

namespace Modules\Protocol\app\Http\Controllers;

use App\Models\DocumentRevision;
use App\Services\DocumentTraceService;
use App\Services\WorkflowTransitionService;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Modules\Protocol\app\Models\Document;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\Topic;
use Modules\User\app\Models\User;

class OnlyOfficeController extends Controller
{
    public function configForProtocol(Request $request, int $protocolId)
    {
        $protocol = Protocol::with('latestDocument')->findOrFail($protocolId);

        $document = $protocol->latestDocument;

        if (! $document) {
            return response()->json(['error' => 'Nenhum documento encontrado para este protocolo.'], 404);
        }

        if (! Storage::disk('public')->exists($document->file_path)) {
            return response()->json(['error' => 'O documento desta versão não está disponível no armazenamento.'], 410);
        }

        $version = $document->version;
        $key = "protocol_{$protocolId}_document_{$document->id}_v{$version}_" . time();
        $user = auth()->user();

        if (! $this->canAccess($user, $protocol)) {
            abort(403);
        }

        $mode = $this->resolveMode($user, $protocol);

        $config = [
            "documentType" => "word",
            "document" => [
                "title" => $document->file_name,
                "fileType" => "docx",
                "key" => $key,
                "url" => $this->documentServerDownloadUrl($request, 'document', $document->id)
            ],
            "editorConfig" => [
                "callbackUrl" => $this->publicBackendUrl($request) . '/api/protocolo/onlyoffice/callback',
                "mode" => $mode,
                "customization" => [
                    "review" => [
                        "reviewMode" => in_array($mode, ['edit', 'review']),
                        "showReviewChanges" => ($mode === 'review' || $mode === 'edit'),
                        "trackChanges" => true,
                    ],
                    "commentAuthorOnly" => false,
                    "forcesave" => true,
                ],
                "user" => [
                    "id" => (string) $user->id,
                    "name" => $user->name,
                ],
                "forcesave" => true,
            ],
        ];

        $token = JWT::encode($config, env('ONLYOFFICE_JWT_SECRET'), 'HS256');

        return response()->json([
            'config' => $config,
            'token' => $token,
        ]);
    }

    public function configForTopic(Topic $topic, Request $request)
    {
        $user = $request->user();

        if (! $this->canAccessTopic($user, $topic)) {
            abort(403);
        }
        if (! $topic->document_path) {
            return response()->json(['error' => 'Documento do tema não encontrado.'], 404);
        }
        if (! Storage::disk('public')->exists($topic->document_path)) {
            return response()->json(['error' => 'O documento desta versão não está disponível no armazenamento.'], 410);
        }

        $mode = $this->resolveTopicMode($user, $topic);
        $key = "topic_{$topic->id}_" . md5($topic->updated_at?->timestamp . '|' . $topic->document_path) . '_' . time();

        $config = [
            'documentType' => 'word',
            'document' => [
                'title' => $topic->document_name ?: "tema-{$topic->id}.docx",
                'fileType' => 'docx',
                'key' => $key,
                'url' => $this->documentServerDownloadUrl($request, 'topic', $topic->id),
            ],
            'editorConfig' => [
                'callbackUrl' => $this->publicBackendUrl($request) . '/api/protocolo/onlyoffice/callback',
                'mode' => $mode,
                'user' => ['id' => (string) $user->id, 'name' => $user->name],
                'customization' => [
                    'review' => [
                        'reviewMode' => in_array($mode, ['edit', 'review'], true),
                        'showReviewChanges' => in_array($mode, ['edit', 'review'], true),
                        'trackChanges' => true,
                    ],
                    'forcesave' => true,
                ],
                'forcesave' => true,
            ],
        ];

        return response()->json([
            'config' => $config,
            'token' => JWT::encode($config, env('ONLYOFFICE_JWT_SECRET'), 'HS256'),
        ]);
    }

    private function canAccess(User $user, Protocol $protocol): bool
    {
        if ($user->hasPermission('protocol.view.all')) {
            return true;
        }

        if ((int) $protocol->student === (int) $user->id) {
            return true;
        }

        $teacherProfile = $user->teacherProfile;

        if ($teacherProfile && (int) $protocol->supervisor_id === (int) $teacherProfile->id) {
            return true;
        }

        if ($teacherProfile && $user->hasPermission('protocol.evaluate')) {
            return $protocol->reviewAssignments()
                ->where(fn($q) => $q
                    ->where('reviewer_one', $teacherProfile->id)
                    ->orWhere('reviewer_two', $teacherProfile->id)
                )
                ->exists();
        }

        if ($user->hasPermission('protocol.assign')) {
            $secretaryProfile = $user->secretaryProfile;

            if (! $secretaryProfile?->organ_id) {
                return false;
            }

            return (int) $protocol->current_organ_id === (int) $secretaryProfile->organ_id
                || $protocol->histories()->where('organ_id', $secretaryProfile->organ_id)->exists();
        }

        return false;
    }

    private function canAccessTopic(User $user, Topic $topic): bool
    {
        $user->loadMissing(['teacherProfile', 'secretaryProfile']);

        if ((int) $topic->student_id === (int) $user->id || $user->hasPermission('topic.view.all')) {
            return true;
        }

        if ($user->teacherProfile && (int) $topic->supervisor_id === (int) $user->teacherProfile->id) {
            return true;
        }

        if ($user->teacherProfile && $topic->reviewAssignments()
            ->where('reviewer_id', $user->teacherProfile->id)->exists()) {
            return true;
        }

        return $user->secretaryProfile?->organ_id
            && (int) $topic->scientificArea()->value('organ_id') === (int) $user->secretaryProfile->organ_id;
    }

    private function resolveTopicMode(User $user, Topic $topic): string
    {
        if ((int) $topic->student_id === (int) $user->id) {
            return 'view';
        }

        $teacherProfile = $user->teacherProfile;

        if ($teacherProfile && (int) $topic->supervisor_id === (int) $teacherProfile->id) {
            return 'review';
        }

        if ($teacherProfile && $topic->reviewAssignments()
            ->where('reviewer_id', $teacherProfile->id)->exists()) {
            return 'review';
        }

        return 'view';
    }

    private function resolveMode(User $user, Protocol $protocol): string
    {
        if ((int) $user->id === (int) $protocol->student) {
            return 'edit';
        }

        $teacherProfile = $user->teacherProfile;

        if ($teacherProfile && (int) $protocol->supervisor_id === (int) $teacherProfile->id) {
            return 'review';
        }

        if ($teacherProfile && $user->hasPermission('protocol.evaluate')) {
            $isReviewer = $protocol->reviewAssignments()
                ->where(fn($q) => $q
                    ->where('reviewer_one', $teacherProfile->id)
                    ->orWhere('reviewer_two', $teacherProfile->id)
                )
                ->exists();

            if ($isReviewer) {
                return 'review';
            }
        }

        return 'view';
    }

    public function downloadDocumentForOnlyOffice(Request $request, Document $document)
    {
        $this->validateDocumentServerToken($request, 'document', $document->id);

        abort_unless(Storage::disk('public')->exists($document->file_path), 410, 'Documento indisponível.');

        return Storage::disk('public')->response($document->file_path, $document->file_name, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]);
    }

    public function downloadTopicForOnlyOffice(Request $request, Topic $topic)
    {
        $this->validateDocumentServerToken($request, 'topic', $topic->id);

        abort_unless($topic->document_path && Storage::disk('public')->exists($topic->document_path), 410, 'Documento indisponível.');

        return Storage::disk('public')->response($topic->document_path, $topic->document_name ?: "tema-{$topic->id}.docx", [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]);
    }

    private function documentServerDownloadUrl(Request $request, string $type, int $id): string
    {
        $expires = now()->addMinutes(30)->timestamp;
        $payload = "{$type}:{$id}:{$expires}";
        $signature = hash_hmac('sha256', $payload, (string) env('ONLYOFFICE_JWT_SECRET'));

        return $this->publicBackendUrl($request)
            . "/api/onlyoffice/{$type}s/{$id}?expires={$expires}&signature={$signature}";
    }

    private function publicBackendUrl(Request $request): string
    {
        $forwardedHost = trim(explode(',', (string) $request->header('X-Forwarded-Host', ''))[0]);
        $candidate = $forwardedHost !== '' ? $forwardedHost : $request->getHost();
        $host = parse_url('http://' . $candidate, PHP_URL_HOST);

        if (! is_string($host) || $host === '') {
            return rtrim((string) env('ONLYOFFICE_DOCUMENT_URL'), '/');
        }

        $forwardedScheme = trim(explode(',', (string) $request->header('X-Forwarded-Proto', ''))[0]);
        $scheme = in_array($forwardedScheme, ['http', 'https'], true)
            ? $forwardedScheme
            : $request->getScheme();
        $port = (int) env('ONLYOFFICE_BACKEND_PORT', 8000);

        return "{$scheme}://{$host}:{$port}";
    }

    private function validateDocumentServerToken(Request $request, string $type, int $id): void
    {
        $expires = (int) $request->query('expires', 0);
        $signature = (string) $request->query('signature', '');
        $expected = hash_hmac('sha256', "{$type}:{$id}:{$expires}", (string) env('ONLYOFFICE_JWT_SECRET'));

        abort_if($expires < now()->timestamp || ! hash_equals($expected, $signature), 403, 'Acesso temporário ao documento inválido.');
    }

    public function callback(Request $request)
{
    $this->validateCallbackToken($request);
    $data = $request->all();

    $status = (int) ($data['status'] ?? 0);

    if (! in_array($status, [2, 6], true)) {
        return response()->json(['error' => 0]);
    }

    $key = $data['key'] ?? '';

    preg_match('/protocol_(\d+)_document_(\d+)_v(\d+)/', $key, $documentMatches);
    preg_match('/protocol_(\d+)_v(\d+)/', $key, $legacyProtocolMatches);
    preg_match('/topic_(\d+)_/', $key, $topicMatches);

    if (empty($documentMatches) && empty($legacyProtocolMatches) && empty($topicMatches)) {
        Log::warning('ONLYOFFICE callback: key inválida', [
            'key' => $key,
        ]);

        return response()->json(['error' => 1]);
    }

    $downloadUrl = $data['url'] ?? null;
    $actor = $this->callbackActor($data);
    $protocolId = null;

    if (! $downloadUrl) {
        Log::warning('ONLYOFFICE callback: URL do documento não fornecida');

        return response()->json(['error' => 1]);
    }

    try {
        $this->assertDocumentServerUrl($downloadUrl);
        $docContent = \Illuminate\Support\Facades\Http::timeout(20)->get($downloadUrl)->throw()->body();

        if (! empty($topicMatches)) {
            $topic = Topic::find($topicMatches[1]);

            if (! $topic || ! $topic->document_path) {
                return response()->json(['error' => 1]);
            }

            Storage::disk('public')->put($topic->document_path, $docContent);
            $topic->touch();

            $revision = DocumentRevision::query()
                ->where('source_table', 'topics')
                ->where('source_id', $topic->id)
                ->latest('revision_number')
                ->first();

            app(WorkflowTransitionService::class)->record(
                $topic,
                'topic',
                'onlyoffice_saved',
                $actor,
                $topic->scientificArea()->value('organ_id'),
                $topic->status,
                $topic->status,
                'Documento de tema actualizado no OnlyOffice.',
                array_merge(['source' => 'onlyoffice'], app(DocumentTraceService::class)->fingerprint('public', $topic->document_path)),
                $revision,
            );

            return response()->json(['error' => 0]);
        }

        $protocolId = (int) ($documentMatches[1] ?? $legacyProtocolMatches[1]);
        $document = ! empty($documentMatches)
            ? Document::query()
                ->whereKey((int) $documentMatches[2])
                ->where('protocol_id', $protocolId)
                ->where('version', (int) $documentMatches[3])
                ->where('status', Document::STATUS_ACTIVE)
                ->first()
            : Document::query()
                ->where('protocol_id', $protocolId)
                ->where('version', (int) $legacyProtocolMatches[2])
                ->where('status', Document::STATUS_ACTIVE)
                ->first();

        if (! $document) {
            Log::warning('ONLYOFFICE callback: documento activo não encontrado', ['protocol_id' => $protocolId]);

            return response()->json(['error' => 1]);
        }

        Storage::disk('public')->put($document->file_path, $docContent);

        $document->touch();

        $protocol = Protocol::find($protocolId);
        if ($protocol) {
            $revision = DocumentRevision::query()
                ->where('source_table', 'documents')
                ->where('source_id', $document->id)
                ->latest('revision_number')
                ->first();

            app(WorkflowTransitionService::class)->record(
                $protocol,
                'protocol',
                'onlyoffice_saved',
                $actor,
                $protocol->current_organ_id,
                $protocol->status,
                $protocol->status,
                'Documento do protocolo actualizado no OnlyOffice.',
                array_merge(['source' => 'onlyoffice'], app(DocumentTraceService::class)->fingerprint('public', $document->file_path)),
                $revision,
            );
        }

        return response()->json(['error' => 0]);
    } catch (\Throwable $e) {
        Log::error('ONLYOFFICE callback: erro ao salvar documento', [
            'error' => $e->getMessage(),
            'protocol_id' => $protocolId,
        ]);

        return response()->json(['error' => 1]);
    }
}

    private function callbackActor(array $data): ?User
    {
        $userId = collect($data['users'] ?? [])
            ->filter(fn ($id) => filter_var($id, FILTER_VALIDATE_INT) !== false)
            ->first();

        return $userId ? User::query()->find((int) $userId) : null;
    }

    private function validateCallbackToken(Request $request): void
    {
        $secret = (string) env('ONLYOFFICE_JWT_SECRET');
        abort_if($secret === '', 503, 'OnlyOffice JWT nao esta configurado.');

        $token = $request->input('token');
        if (! $token && str_starts_with((string) $request->header('Authorization'), 'Bearer ')) {
            $token = substr((string) $request->header('Authorization'), 7);
        }

        abort_unless(is_string($token) && $token !== '', 403, 'Callback OnlyOffice sem assinatura.');

        try {
            JWT::decode($token, new Key($secret, 'HS256'));
        } catch (\Throwable $exception) {
            Log::warning('OnlyOffice callback rejeitado: JWT invalido.', ['message' => $exception->getMessage()]);
            abort(403, 'Callback OnlyOffice com assinatura invalida.');
        }
    }

    private function assertDocumentServerUrl(string $url): void
    {
        $expected = parse_url((string) env('ONLYOFFICE_URL'));
        $actual = parse_url($url);

        $expectedPort = (int) ($expected['port'] ?? (($expected['scheme'] ?? 'http') === 'https' ? 443 : 80));
        $actualPort = (int) ($actual['port'] ?? (($actual['scheme'] ?? 'http') === 'https' ? 443 : 80));

        if (! is_array($actual) || ! isset($actual['host']) || $actualPort !== $expectedPort || ! in_array($actual['scheme'] ?? null, ['http', 'https'], true)) {
            abort(403, 'URL de documento OnlyOffice nao autorizada.');
        }
    }
}
