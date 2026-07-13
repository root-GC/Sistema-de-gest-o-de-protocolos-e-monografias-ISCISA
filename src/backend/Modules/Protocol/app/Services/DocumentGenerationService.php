<?php

namespace Modules\Protocol\app\Services;

use Modules\Protocol\app\Models\EvaluationForm;
use Modules\Protocol\app\Models\Opinion;
use Modules\Protocol\app\Models\Protocol;

class DocumentGenerationService
{
    public function generateOpinionPdf(Opinion $opinion): string
    {
        $opinion->loadMissing('issuedBy');

        $protocol = $opinion->protocol()->with([
            'topic:id,title,status',
            'topic.student:id,name,email',
            'topic.supervisor.user:id,name,email',
            'topic.course:id,name,code',
        ])->first();

        if (! $protocol) {
            throw new \RuntimeException('Protocolo não encontrado para gerar parecer.');
        }

        $viewData = [
            'protocol' => $protocol,
            'opinion' => $opinion,
            'presidente' => $opinion->issuedBy,
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('protocol::pdf.parecer-final', $viewData);

        $storageDir = "opinions/{$protocol->id}";
        \Illuminate\Support\Facades\Storage::disk('public')->makeDirectory($storageDir);

        $path = "{$storageDir}/parecer-{$opinion->version}.pdf";
        \Illuminate\Support\Facades\Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    public function generateEvaluationFormPdf(EvaluationForm $form): string
    {
        $form->load([
            'protocol.topic:id,title,status',
            'protocol.topic.student:id,name,email',
            'protocol.topic.supervisor.user:id,name,email',
            'protocol.topic.course:id,name,code',
            'formCriteria' => fn($q) => $q->orderBy('order_column'),
            'reviewerEvaluations.reviewer.user:id,name',
            'reviewerEvaluations.criterionReviews.formCriterion',
        ]);

        $viewData = [
            'form' => $form,
            'protocol' => $form->protocol,
            'criteria' => $form->formCriteria,
            'reviews' => $form->reviewerEvaluations,
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('protocol::pdf.ficha-avaliacao', $viewData);

        $path = "evaluations/{$form->protocol_id}/ficha-{$form->version}.pdf";
        \Illuminate\Support\Facades\Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }
}
