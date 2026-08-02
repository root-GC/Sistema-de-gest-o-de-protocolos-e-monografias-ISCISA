<?php

namespace Modules\Protocol\app\Services;

use Modules\Protocol\app\Models\EvaluationForm;
use Modules\Protocol\app\Models\Opinion;
use Modules\Protocol\app\Models\Protocol;

class DocumentGenerationService
{
    public function opinionVersion(Opinion $opinion): string
    {
        $opinion->loadMissing('evaluationForm');

        return $opinion->effectiveVersion();
    }

    public function generateOpinionPdf(Opinion $opinion): string
    {
        $opinion->loadMissing('issuedBy', 'evaluationForm');
        $version = $opinion->effectiveVersion();

        $protocol = $opinion->protocol()->with([
            'topic:id,title,status,student_id,supervisor_id,course_id,scientific_area_id',
            'topic.student:id,name,email',
            'topic.supervisor.user:id,name,email',
            'topic.scientificArea:id,name',
            'topic.course:id,name,code',
        ])->first();

        if (! $protocol) {
            throw new \RuntimeException('Protocolo não encontrado para gerar parecer.');
        }

        $logoPath = base_path('Modules/Protocol/resources/images/iscisa-logo.jpeg');
        $logoDataUri = file_exists($logoPath)
            ? 'data:image/jpeg;base64,' . base64_encode(file_get_contents($logoPath))
            : null;

        $viewData = [
            'protocol' => $protocol,
            'opinion' => $opinion,
            'opinionVersion' => $version,
            'presidente' => $opinion->issuedBy,
            'logoDataUri' => $logoDataUri,
        ];

        $view = match (true) {
            $opinion->organ === Protocol::ORGAN_COMITE_BIOETICA && $opinion->decision === 'approved' => 'protocol::pdf.parecer-bioetica-aprovacao',
            $opinion->organ === Protocol::ORGAN_COMITE_BIOETICA => 'protocol::pdf.parecer-bioetica',
            default => 'protocol::pdf.parecer-final',
        };

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($view, $viewData);

        $storageDir = "opinions/{$protocol->id}";
        \Illuminate\Support\Facades\Storage::disk('public')->makeDirectory($storageDir);

        $path = "{$storageDir}/parecer-{$version}.pdf";
        \Illuminate\Support\Facades\Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    public function generateEvaluationFormPdf(EvaluationForm $form): string
    {
        $form->load([
            'protocol.topic:id,title,status,student_id,supervisor_id,course_id,scientific_area_id',
            'protocol.topic.student:id,name,email',
            'protocol.topic.supervisor.user:id,name,email',
            'protocol.topic.course:id,name,code',
            'protocol.topic.scientificArea:id,name',
            'formCriteria' => fn($q) => $q->orderBy('order_column'),
            'reviewerEvaluations.reviewer.user:id,name',
            'reviewerEvaluations.criterionReviews.formCriterion',
        ]);

        $logoPath = base_path('Modules/Protocol/resources/images/iscisa-logo.jpeg');
        $logoDataUri = file_exists($logoPath)
            ? 'data:image/jpeg;base64,' . base64_encode(file_get_contents($logoPath))
            : null;

        $viewData = [
            'form' => $form,
            'protocol' => $form->protocol,
            'criteria' => $form->formCriteria,
            'reviews' => $form->reviewerEvaluations,
            'logoDataUri' => $logoDataUri,
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('protocol::pdf.ficha-avaliacao', $viewData);

        $storageDir = "evaluations/{$form->protocol_id}";
        \Illuminate\Support\Facades\Storage::disk('public')->makeDirectory($storageDir);

        $path = "{$storageDir}/ficha-{$form->version}.pdf";
        \Illuminate\Support\Facades\Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }
}
