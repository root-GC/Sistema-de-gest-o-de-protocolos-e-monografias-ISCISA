<?php

namespace Modules\Protocol\app\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use App\Models\DocumentRevision;
use Modules\Organization\app\Models\Organ;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\Topic;
use Modules\Protocol\app\Services\ScientificDirectionActivityService;

class ScientificDirectionActivityController extends Controller
{
    public function __construct(private readonly ScientificDirectionActivityService $activity) {}

    public function dashboard(Request $request) { return response()->json($this->activity->dashboard($request->user())); }
    public function processes(Request $request, Organ $organ) { return response()->json($this->activity->processes($request->user(), $organ, $request->string('status')->toString() ?: null, $request->string('q')->toString() ?: null, min(50, max(5, $request->integer('per_page', 20))))); }
    public function protocol(Request $request, Organ $organ, Protocol $protocol) { return response()->json($this->activity->protocol($request->user(), $organ, $protocol)); }
    public function topic(Request $request, Organ $organ, Topic $topic) { return response()->json($this->activity->topic($request->user(), $organ, $topic)); }

    public function downloadRevision(Request $request, DocumentRevision $revision)
    {
        $this->activity->assertDirection($request->user());
        abort_unless($revision->availability === DocumentRevision::AVAILABILITY_AVAILABLE && Storage::disk($revision->storage_disk ?: 'public')->exists($revision->file_path), 410, 'Documento desta versão indisponível.');

        return Storage::disk($revision->storage_disk ?: 'public')->download($revision->file_path, $revision->file_name);
    }
}
