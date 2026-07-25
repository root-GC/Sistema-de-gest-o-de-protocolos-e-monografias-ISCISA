<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; line-height: 1.4; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h3 { margin: 3px 0; }
        .protocol-info { width: 100%; margin-bottom: 15px; }
        .protocol-info td { padding: 2px 0; vertical-align: top; }
        .protocol-info td:first-child { width: 200px; font-weight: bold; }
        .criteria-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .criteria-table th { background-color: #e0e0e0; border: 1px solid #000; padding: 5px; text-align: center; font-size: 10px; }
        .criteria-table td { border: 1px solid #000; padding: 4px; vertical-align: top; font-size: 9px; }
        .group-header td { background-color: #d0d0d0; font-weight: bold; text-align: center; }
        .reviewer-section { margin-top: 10px; page-break-inside: avoid; }
        .reviewer-section h4 { margin: 10px 0 5px; padding-bottom: 3px; border-bottom: 1px solid #999; }
        .comment-cell { max-width: 300px; word-wrap: break-word; }
        .summary { margin: 15px 0; padding: 10px; border: 1px solid #ccc; }
        .signature-line { margin-top: 30px; }
        .signature-line td { height: 40px; vertical-align: bottom; border-bottom: 1px solid #000; width: 200px; text-align: center; }
        .page-break { page-break-after: always; }
    </style>
</head>
<body>
    <div class="header">
        <strong>ISCISA – INSTITUTO SUPERIOR DE CIÊNCIAS DE SAÚDE</strong><br>
        @if($form->organ === 'nucleo')
            NÚCLEO CIENTÍFICO
        @elseif($form->organ === 'comite_cientifico')
            COMITÉ CIENTÍFICO DO ISCISA (CC-ISCISA)
        @elseif($form->organ === 'comite_bioetica')
            COMITÉ DE BIOÉTICA DO ISCISA (CB-ISCISA)
        @endif
        <br>
        <h3>AVALIAÇÃO DO PROTOCOLO DE INVESTIGAÇÃO CIENTÍFICA</h3>
        <hr>
    </div>

    <table class="protocol-info">
        <tr><td>Código do Protocolo:</td><td>{{ $protocol->code ?? $protocol->id }}</td></tr>
        <tr><td>Curso:</td><td>{{ $protocol->topic->course->name ?? '---' }}</td></tr>
        <tr><td>Título:</td><td>{{ $protocol->topic->title ?? '---' }}</td></tr>
        <tr><td>Versão:</td><td>{{ $form->version }}</td></tr>
        <tr><td>Estudante:</td><td>{{ $protocol->topic->student->name ?? '---' }}</td></tr>
        <tr><td>Supervisor(a):</td><td>{{ $protocol->topic->supervisor->user->name ?? '---' }}</td></tr>
        <tr><td>Data da Avaliação:</td><td>{{ $form->created_at->format('d/m/Y') }}</td></tr>
        <tr><td>Resultado Final:</td><td><strong>{{ $form->final_decision ? ($form->final_decision === 'approved' ? 'APROVADO' : 'REPROVADO') : 'Pendente' }}</strong></td></tr>
    </table>

    @if($form->final_decision && $form->decided_at)
        <p><strong>Data de Deliberação:</strong> {{ $form->decided_at->format('d/m/Y') }}</p>
        <hr>
    @endif

    <h4>Avaliação dos Elementos do Protocolo</h4>

    @php $currentGroup = ''; @endphp

    @foreach($form->formCriteria->sortBy('order_column') as $fc)
        @if($fc->group_name !== $currentGroup)
            @php $currentGroup = $fc->group_name; @endphp
            <table class="criteria-table">
                <tr class="group-header"><td colspan="{{ 1 + $reviews->count() }}"><strong>{{ $currentGroup }}</strong></td></tr>
                <tr>
                    <th style="width:{{ $reviews->count() > 0 ? '40%' : '60%' }}">Critério</th>
                    @foreach($reviews as $review)
                        <th>Revisor {{ $loop->iteration }} ({{ $review->reviewer->user->name ?? '---' }})</th>
                    @endforeach
                </tr>
        @endif
        <tr>
            <td><strong>{{ $fc->criterion_name }}</strong></td>
            @foreach($reviews as $review)
                @php
                    $cr = $review->criterionReviews->firstWhere('evaluation_form_criterion_id', $fc->id);
                @endphp
                <td class="comment-cell">{{ $cr->comment ?? '—' }}</td>
            @endforeach
        </tr>
        @if($loop->last || ($loop->iteration < $form->formCriteria->count() && $form->formCriteria[$loop->iteration]->group_name !== $currentGroup))
            </table>
        @endif
    @endforeach

    @foreach($reviews as $review)
        <div class="reviewer-section">
            <h4>Avaliação do Revisor {{ $loop->iteration }}</h4>
            <table class="criteria-table">
                <tr><th style="width:40%">Recomendação</th><td><strong>{{ $review->recommendation === 'approved' ? 'APROVADO' : ($review->recommendation === 'rejected' ? 'REPROVADO' : 'Pendente') }}</strong></td></tr>
                <tr><th>Comentário Geral</th><td>{{ $review->overall_comment ?? '—' }}</td></tr>
                <tr><th>Estado</th><td>{{ $review->status }}</td></tr>
                @if($review->submitted_at)
                    <tr><th>Submetido em</th><td>{{ $review->submitted_at->format('d/m/Y H:i') }}</td></tr>
                @endif
            </table>
        </div>
    @endforeach

    @if($form->final_decision)
        <div class="summary">
            <strong>Decisão Final:</strong>
            <span style="color: {{ $form->final_decision === 'approved' ? '#006600' : '#cc0000' }}; font-weight: bold; font-size: 14px;">
                {{ $form->final_decision === 'approved' ? 'APROVADO' : 'REPROVADO' }}
            </span>
            @if($form->conclusion_summary)
                <p><strong>Resumo da Conclusão:</strong> {{ $form->conclusion_summary }}</p>
            @endif
        </div>
    @endif

    <div class="footer">
        <p style="text-align: center; font-size: 8px; color: #666; margin-top: 40px;">
            Documento gerado automaticamente pelo SGPC-ISCISA
        </p>
    </div>
</body>
</html>
