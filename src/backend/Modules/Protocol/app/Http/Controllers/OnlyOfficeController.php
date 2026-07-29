<?php

namespace Modules\Protocol\app\Http\Controllers;

use Firebase\JWT\JWT;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Modules\Protocol\app\Models\Document;
use Modules\Protocol\app\Models\Protocol;
use Modules\User\app\Models\User;

class OnlyOfficeController extends Controller
{
    public function config()
    {
        $config = [
            "documentType" => "word",
            "document" => [
                "title" => "teste.docx",
                "fileType" => "docx",
                "key" => "teste_001",
                "url" => env('ONLYOFFICE_DOCUMENT_URL') . "/storage/documents/teste.docx"
            ],
            "editorConfig" => [
                "callbackUrl" => env('ONLYOFFICE_DOCUMENT_URL') . "/api/protocolo/onlyoffice/callback"
            ]
        ];

        $token = JWT::encode($config, env('ONLYOFFICE_JWT_SECRET'), 'HS256');

        return response()->json(['config' => $config, 'token' => $token]);
    }

    public function configForProtocol(int $protocolId)
    {
        $protocol = Protocol::with('latestDocument')->findOrFail($protocolId);

        $document = $protocol->latestDocument;

        if (! $document) {
            return response()->json(['error' => 'Nenhum documento encontrado para este protocolo.'], 404);
        }

        $version = $document->version;
        $key = "protocol_{$protocolId}_v{$version}";
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
                "url" => env('ONLYOFFICE_DOCUMENT_URL') . "/storage/{$document->file_path}"
            ],
            "editorConfig" => [
                "callbackUrl" => env('ONLYOFFICE_DOCUMENT_URL') . "/api/protocolo/onlyoffice/callback",
                "mode" => $mode,
                "customization" => [
                    "review" => [
                        "reviewMode" => ($mode === 'edit'),
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
            ],
        ];

        $token = JWT::encode($config, env('ONLYOFFICE_JWT_SECRET'), 'HS256');

        return response()->json([
            'config' => $config,
            'token' => $token,
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

            return ! $secretaryProfile
                || ! $secretaryProfile->organ_id
                || (int) $protocol->current_organ_id === (int) $secretaryProfile->organ_id;
        }

        return false;
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
                return 'comment';
            }
        }

        return 'view';
    }

    public function callback(Request $request)
    {
        $data = $request->all();

        Log::info('ONLYOFFICE callback:', [
            'status' => $data['status'] ?? 'unknown',
            'key' => $data['key'] ?? 'unknown',
        ]);

        $status = (int) ($data['status'] ?? 0);

        if (! in_array($status, [1, 6], true)) {
            return response()->json(['error' => 0]);
        }

        $key = $data['key'] ?? '';

        preg_match('/protocol_(\d+)_v(\d+)/', $key, $matches);

        if (empty($matches)) {
            Log::warning('ONLYOFFICE callback: key invalida', ['key' => $key]);

            return response()->json(['error' => 1]);
        }

        $protocolId = (int) $matches[1];
        $downloadUrl = $data['url'] ?? null;

        if (! $downloadUrl) {
            Log::warning('ONLYOFFICE callback: URL do documento nao fornecida');

            return response()->json(['error' => 1]);
        }

        try {
            $docContent = file_get_contents($downloadUrl);

            if ($docContent === false) {
                throw new \Exception("Falha ao baixar documento de: {$downloadUrl}");
            }

            $document = Document::where('protocol_id', $protocolId)
                ->where('status', Document::STATUS_ACTIVE)
                ->first();

            if (! $document) {
                Log::warning('ONLYOFFICE callback: nenhum documento activo encontrado', [
                    'protocol_id' => $protocolId,
                ]);

                return response()->json(['error' => 1]);
            }

            Storage::disk('public')->put($document->file_path, $docContent);

            $document->touch();

            Log::info('ONLYOFFICE callback: documento actualizado com sucesso', [
                'protocol_id' => $protocolId,
                'path' => $document->file_path,
            ]);

            return response()->json(['error' => 0]);
        } catch (\Exception $e) {
            Log::error('ONLYOFFICE callback: erro ao salvar documento', [
                'error' => $e->getMessage(),
                'protocol_id' => $protocolId,
            ]);

            return response()->json(['error' => 1]);
        }
    }
}
