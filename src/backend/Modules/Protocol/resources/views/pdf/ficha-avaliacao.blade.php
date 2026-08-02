@php
    $organ = $form->organ;
    $area = data_get($protocol, 'topic.scientificArea.name', '________________');
    $student = data_get($protocol, 'topic.student.name', '________________');
    $supervisor = data_get($protocol, 'topic.supervisor.user.name', '________________');
    $course = data_get($protocol, 'topic.course.name', '________________');
    $title = data_get($protocol, 'topic.title', '________________');
    $version = $form->version ?? $protocol->version ?? '____';
    $criteriaList = collect($criteria ?? $form->formCriteria)->sortBy('order_column')->values();
    $reviewList = collect($reviews ?? $form->reviewerEvaluations);
    $isBioethics = $organ === \Modules\Protocol\app\Models\Protocol::ORGAN_COMITE_BIOETICA;

    $formatDate = function ($date): string {
        if (! $date) {
            return '____/____/______';
        }

        if ($date instanceof \Carbon\CarbonInterface) {
            return $date->format('d/m/Y');
        }

        return \Illuminate\Support\Carbon::parse($date)->format('d/m/Y');
    };

    $cleanComment = function ($comment): string {
        $text = trim((string) $comment);
        $text = preg_replace('/^Nota\s+\d\/5\s*-\s*/u', '', $text);
        $text = preg_replace('/^Ficha\s+[uú]nica\s+do\s+[^:]+:\s*/iu', '', $text);

        return trim($text);
    };

    $commentsForCriterion = function ($criterionId) use ($reviewList, $cleanComment) {
        return $reviewList
            ->flatMap(fn ($review) => $review->criterionReviews
                ->where('evaluation_form_criterion_id', $criterionId)
                ->pluck('comment'))
            ->map($cleanComment)
            ->filter()
            ->unique()
            ->values();
    };

    $generalComments = $reviewList
        ->pluck('overall_comment')
        ->map($cleanComment)
        ->filter()
        ->unique()
        ->values();

    $organHeader = match ($organ) {
        \Modules\Protocol\app\Models\Protocol::ORGAN_NUCLEO => "NÚCLEO CIENTÍFICO DA ÁREA DE {$area}",
        \Modules\Protocol\app\Models\Protocol::ORGAN_COMITE_CIENTIFICO => 'COMITÉ CIENTÍFICO DO ISCISA (CC - ISCISA)',
        \Modules\Protocol\app\Models\Protocol::ORGAN_COMITE_BIOETICA => 'COMITÉ INSTITUCIONAL DE BIOÉTICA PARA A SAÚDE, DO ISCISA (CIBS - ISCISA)',
        default => 'COMITÉ CIENTÍFICO DO ISCISA',
    };

    $decisionLabel = match ($form->final_decision) {
        'approved' => 'Aprovado',
        'not_approved', 'rejected' => 'Não Aprovado',
        default => 'Pendente',
    };

    $purposeLabel = trim((string) ($protocol->protocol_type ?? ''));
    $purposeLabel = $purposeLabel !== ''
        ? \Illuminate\Support\Str::of($purposeLabel)->replace(['_', '-'], ' ')->title()
        : '________________';

    $deliberationDate = $form->deliberation_date ?? $form->decided_at ?? null;
@endphp

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 34px 46px 38px; }
        body {
            font-family: "DejaVu Serif", serif;
            font-size: 10.5px;
            color: #000;
            line-height: 1.36;
        }
        .header {
            text-align: center;
            margin-bottom: 18px;
        }
        .logo {
            width: 70px;
            margin-bottom: 6px;
        }
        .institution {
            font-weight: bold;
            text-transform: uppercase;
            line-height: 1.25;
        }
        .organ {
            margin-top: 10px;
            font-weight: bold;
            text-transform: uppercase;
            line-height: 1.25;
        }
        .document-title {
            margin-top: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            line-height: 1.3;
        }
        .meta-table {
            width: 100%;
            margin: 12px 0 18px;
            border-collapse: collapse;
        }
        .meta-table td {
            padding: 4px 3px;
            vertical-align: top;
        }
        .meta-label {
            width: 210px;
            font-weight: bold;
        }
        .section-title {
            margin: 14px 0 8px;
            text-align: center;
            font-weight: bold;
        }
        .criteria-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .criteria-table thead {
            display: table-header-group;
        }
        .criteria-table th,
        .criteria-table td {
            border: 1px solid #000;
            padding: 6px;
            vertical-align: top;
        }
        .criteria-table th {
            background: #e5e5e5;
            text-align: center;
            font-weight: bold;
        }
        .group-row td {
            background: #d9d9d9;
            text-align: left;
            font-weight: bold;
        }
        .item-cell {
            width: 38%;
            font-weight: bold;
        }
        .comment-cell {
            width: 62%;
            min-height: 26px;
            white-space: pre-line;
            word-wrap: break-word;
        }
        .general-comments {
            margin-top: 12px;
            border: 1px solid #000;
            padding: 8px;
            text-align: justify;
        }
        .note-block {
            margin-top: 16px;
            text-align: justify;
            page-break-inside: avoid;
        }
        .note-block strong {
            display: block;
            margin-bottom: 6px;
        }
        .note-block ol {
            margin: 0 0 0 18px;
            padding: 0;
        }
        .note-block li {
            margin-bottom: 6px;
        }
        .footer {
            margin-top: 22px;
            text-align: center;
            font-size: 8px;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="header">
        @if(!empty($logoDataUri))
            <img src="{{ $logoDataUri }}" class="logo" alt="ISCISA">
        @endif

        <div class="institution">ISCISA - INSTITUTO SUPERIOR DE CIÊNCIAS DE SAÚDE</div>
        <div class="organ">{{ $organHeader }}</div>
        <div class="document-title">Parecer de Avaliação do Protocolo de Investigação Científica</div>
    </div>

    <table class="meta-table">
        <tr>
            <td class="meta-label">Fim a que se destina o protocolo:</td>
            <td>{{ $purposeLabel }}</td>
        </tr>
        <tr>
            <td class="meta-label">Designação do curso:</td>
            <td>{{ $course }}</td>
        </tr>
        <tr>
            <td class="meta-label">Título do protocolo:</td>
            <td>{{ $title }}</td>
        </tr>
        <tr>
            <td class="meta-label">Versão:</td>
            <td>{{ $version }}</td>
        </tr>
        <tr>
            <td class="meta-label">Nome do estudante/pesquisador:</td>
            <td>{{ $student }}</td>
        </tr>
        <tr>
            <td class="meta-label">Nome do supervisor:</td>
            <td>{{ $supervisor }}</td>
        </tr>
        <tr>
            <td class="meta-label">Nome do co-supervisor (caso aplicável):</td>
            <td>________________</td>
        </tr>
        <tr>
            <td class="meta-label">Deliberação:</td>
            <td>{{ $decisionLabel }}</td>
        </tr>
        <tr>
            <td class="meta-label">Data de deliberação do protocolo:</td>
            <td>{{ $formatDate($deliberationDate) }}</td>
        </tr>
    </table>

    <div class="section-title">
        Resultado da Avaliação e Deliberação do Protocolo, em cada um dos seus Elementos Pré-Textuais, Textuais e Pós-Textuais
    </div>

    <table class="criteria-table">
        <thead>
            <tr>
                <th style="width: 38%;">Itens avaliados</th>
                <th style="width: 62%;">Comentários</th>
            </tr>
        </thead>
        <tbody>
            @php $currentGroup = null; @endphp
            @foreach($criteriaList as $criterion)
                @if($criterion->group_name !== $currentGroup)
                    @php $currentGroup = $criterion->group_name; @endphp
                    <tr class="group-row">
                        <td colspan="2">{{ $currentGroup }}</td>
                    </tr>
                @endif

                @php $criterionComments = $commentsForCriterion($criterion->id); @endphp
                <tr>
                    <td class="item-cell">{{ $criterion->criterion_name }}</td>
                    <td class="comment-cell">
                        @if($criterionComments->isNotEmpty())
                            {!! nl2br(e($criterionComments->implode("\n\n"))) !!}
                        @else
                            &nbsp;
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @if($generalComments->isNotEmpty() || $form->conclusion_summary)
        <div class="general-comments">
            <strong>Comentários gerais / síntese da deliberação:</strong><br>
            @if($generalComments->isNotEmpty())
                {!! nl2br(e($generalComments->implode("\n\n"))) !!}
            @endif
            @if($form->conclusion_summary)
                @if($generalComments->isNotEmpty())<br><br>@endif
                {!! nl2br(e($form->conclusion_summary)) !!}
            @endif
        </div>
    @endif

    @if($isBioethics)
        <div class="note-block">
            <strong>Nota:</strong>
            <ol>
                <li>Este instrumento-síntese de avaliação é aplicável apenas aos protocolos.</li>
                <li>O mesmo deve ser preenchido no final da harmonização da avaliação e deliberação de cada protocolo pelo membro responsável pela harmonização, e depois enviado ao Secretariado do CIBS-ISCISA junto com o protocolo avaliado, harmonizado e deliberado pelo colégio dos membros do CIBS.</li>
                <li>O preenchimento deste instrumento não substitui os comentários a serem feitos dentro do protocolo.</li>
                <li>O Secretariado do CIBS-ISCISA, depois de receber o protocolo não aprovado e este instrumento, se encarregará pelo seu envio ao estudante titular do protocolo.</li>
                <li>O Secretariado do CIBS-ISCISA deverá possuir um directório electrónico seguro e organizado por ano, curso e estudante, onde arquivará cada instrumento correspondente a cada protocolo avaliado e deliberado, incluindo a versão aprovada.</li>
            </ol>
        </div>
    @endif

    <div class="footer">
        Documento gerado automaticamente pelo SGPC-ISCISA
    </div>
</body>
</html>
