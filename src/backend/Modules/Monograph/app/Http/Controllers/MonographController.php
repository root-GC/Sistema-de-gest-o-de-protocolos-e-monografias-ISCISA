<?php

namespace Modules\Monograph\app\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Monograph\app\Models\Monograph;
use Modules\Monograph\app\Services\MonographService;
use Modules\Monograph\app\Http\Requests\{
    SubmitMonographRequest,
    EndorseMonographRequest,
    VerifyMonographRequest
};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\MonographDocument;
use Modules\Monograph\app\Transformers\MonographResource;

class MonographController extends Controller
{
    public function __construct(private MonographService $service) {}

    public function index(Request $request)
    {
        $user = $request->user()->loadMissing(['teacherProfile', 'secretaryProfile.organ']);

        $query = Monograph::query()->with([
            'student:id,name,email',
            'supervisor.user:id,name,email',
            'submissions:id,monograph_id,version',
            'documents:id,monograph_id,file_name,file_path,version,status,created_at',
        ])->latest('submitted_at');

        if ($user->hasPermission('monograph.view.all')) {
            // Global administration may inspect every record.
        } elseif ($user->teacherProfile) {
            $query->where('supervisor_id', $user->teacherProfile->id);
        } elseif ($user->studentProfile) {
            $query->where('student_id', $user->id);
        } elseif ($user->secretaryProfile?->organ?->type === 'nucleus') {
            $organId = $user->secretaryProfile->organ_id;
            $query->whereHas('protocol.topic.scientificArea', fn ($area) => $area->where('organ_id', $organId));
        } else {
            abort(403);
        }

        return response()->json([
            'monographs' => MonographResource::collection($query->get()),
        ]);
    }

    public function show(Monograph $monograph)
    {
        $this->authorize('view', $monograph);

        return new MonographResource(
            $monograph->load('student', 'supervisor.user', 'submissions:id,monograph_id,version', 'documents')
        );
    }

public function history(Monograph $monograph)
{
    $this->authorize('view', $monograph);

    return $monograph->submissions()
        ->with(['document', 'reviews.decidedBy', 'comments.author'])
        ->get()
        ->map(fn ($s) => [
            'version'      => $s->version,
            'submitted_at' => $s->submitted_at,
                'file'         => $s->document?->file_name,
            'reviews'      => $s->reviews->map(fn ($r) => [
                'stage'      => $r->stage,
                'role'       => $r->decided_by_role,
                'decision'   => $r->decision,
                'reason'     => $r->reason,
                'decided_at' => $r->decided_at,
                'decided_by' => $r->decidedBy?->name,
            ]),
            'comments' => $s->comments->map(fn ($c) => [
                'role'       => $c->commented_by_role,
                'comment'    => $c->comment,
                'author'     => $c->author?->name,
                'created_at' => $c->created_at,
            ]),
        ]);
}

    public function opinions(Monograph $monograph)
    {
        $this->authorize('view', $monograph);

        return response()->json([
            'opinions' => $monograph->submissions()
                ->with('reviews')
                ->get()
                ->flatMap(fn ($submission) => $submission->reviews->map(fn ($review) => [
                    'id' => $review->id,
                    'organ' => $review->stage,
                    'decision' => $review->decision,
                    'version' => $submission->version,
                    'download_url' => null,
                    'evaluation_form_download_url' => null,
                    'created_at' => $review->decided_at,
                ]))->values(),
        ]);
    }

    public function downloadDocument(Monograph $monograph, MonographDocument $document)
    {
        $this->authorize('view', $monograph);
        abort_unless((int) $document->monograph_id === (int) $monograph->id, 404);

        if (! Storage::exists($document->file_path)) {
            return response()->json(['message' => 'O ficheiro histórico não está disponível no armazenamento.'], 410);
        }

        return Storage::download($document->file_path, $document->file_name);
    }
    public function submit(SubmitMonographRequest $request, Monograph $monograph)
    {
        $m = $this->service->submit(
            $monograph,
            $request->user(),
            $request->file('file')
        );

        return new MonographResource($m);
    }

    public function endorse(EndorseMonographRequest $request, Monograph $monograph)
    {
        $m = $this->service->endorse(
            $monograph,
            $request->user(),
            $request->boolean('approved'),
            $request->input('reason')
        );

        return new MonographResource($m);
    }

    public function verify(VerifyMonographRequest $request, Monograph $monograph)
    {
        $this->authorize('verifyDocuments', $monograph);

        $m = $this->service->verifyDocuments(
            $monograph,
            $request->user(),
            $request->input('role'),
            $request->boolean('approved'),
            $request->input('reason')
        );

        return new MonographResource($m);
    }

public function addComment(Request $request, Monograph $monograph)
{
    $this->authorize('view', $monograph);
    abort_unless($request->user()->hasPermission('monograph.comment'), 403);

    $request->validate([
        'role'    => ['required', 'in:supervisor,secretary,coordinator'],
        'comment' => ['required', 'string', 'max:2000'],
    ]);

    $c = $this->service->addComment(
        $monograph,
        $request->user(),
        $request->input('role'),
        $request->input('comment')
    );

    return response()->json($c, 201);
}
}
