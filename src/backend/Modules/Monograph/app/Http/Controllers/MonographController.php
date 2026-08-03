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
use Modules\Monograph\app\Transformers\MonographResource;

class MonographController extends Controller
{
    public function __construct(private MonographService $service) {}

  public function show(Monograph $monograph)
  {
    $this->authorize('view', $monograph);

    return new MonographResource(
        $monograph->load('student', 'supervisor.user')
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
            'file'         => $s->document->file_name,
            'reviews'      => $s->reviews->map(fn ($r) => [
                'stage'      => $r->stage,
                'role'       => $r->decided_by_role,
                'decision'   => $r->decision,
                'reason'     => $r->reason,
                'decided_at' => $r->decided_at,
                'decided_by' => $r->decidedBy->name,
            ]),
            'comments' => $s->comments->map(fn ($c) => [
                'role'       => $c->commented_by_role,
                'comment'    => $c->comment,
                'author'     => $c->author->name,
                'created_at' => $c->created_at,
            ]),
        ]);
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