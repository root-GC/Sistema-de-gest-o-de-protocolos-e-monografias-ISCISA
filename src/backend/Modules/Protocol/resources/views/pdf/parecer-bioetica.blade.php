@php
    $title = data_get($protocol, 'topic.title', '---');
    $student = data_get($protocol, 'topic.student.name', '---');
    $supervisor = data_get($protocol, 'topic.supervisor.user.name', '---');
    $course = data_get($protocol, 'topic.course.name', '---');
    $issuedAt = $opinion->issued_at ?? now();
@endphp

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 12px; line-height: 1.5; }
        .header { text-align: center; margin-bottom: 25px; }
        .header h3 { margin: 5px 0; }
        .info-table { width: 100%; margin-bottom: 20px; }
        .info-table td { padding: 3px 0; vertical-align: top; }
        .info-table td:first-child { width: 180px; font-weight: bold; }
        .decision-text { margin: 25px 0; text-align: justify; font-size: 13px; }
        .decision-box { border: 1px solid #000; padding: 15px; margin: 20px 0; text-align: center; }
        .decision-box .approved { color: #006600; font-weight: bold; font-size: 16px; }
        .decision-box .rejected { color: #cc0000; font-weight: bold; font-size: 16px; }
        .observations { margin: 20px 0; }
        .signature-table { width: 100%; border-collapse: collapse; margin-top: 35px; }
        .signature-table th, .signature-table td { border: 1px solid #000; padding: 8px; text-align: center; }
        .signature-table th { background-color: #f0f0f0; }
        .footer { margin-top: 40px; text-align: right; font-style: italic; }
    </style>
</head>
<body>
    <div class="header">
        <strong>INSTITUTO SUPERIOR DE CIÊNCIAS DE SAÚDE (ISCISA)</strong><br>
        Comité de Bioética
        <br>
        <h3>PARECER FINAL</h3>
        <hr>
    </div>

    <table class="info-table">
        <tr><td>N.º do Protocolo:</td><td>{{ $protocol->code ?? $protocol->id }}</td></tr>
        <tr><td>Título:</td><td>{{ $title }}</td></tr>
        <tr><td>Estudante(s):</td><td>{{ $student }}</td></tr>
        <tr><td>Orientador(a):</td><td>{{ $supervisor }}</td></tr>
        <tr><td>Curso:</td><td>{{ $course }}</td></tr>
        <tr><td>Versão do Protocolo:</td><td>{{ $opinionVersion ?? $opinion->evaluationForm?->version ?? $opinion->version ?? $protocol->version }}</td></tr>
        <tr><td>Data de Emissão:</td><td>{{ $issuedAt->format('d/m/Y') }}</td></tr>
    </table>

    <div class="decision-text">
        <p>
            Após a revisão e deliberação do Comité de Bioética, tendo em conta os critérios
            éticos, científicos e regulamentares estabelecidos, o protocolo em referência foi
            <strong>{{ strtoupper($opinion->decision === 'approved' ? 'APROVADO' : 'REPROVADO') }}</strong>.
        </p>

        @if($opinion->decision === 'approved')
            <p>
                O proponente fica autorizado a prosseguir nos termos regulamentares aplicáveis.
            </p>
        @else
            <p>
                O protocolo não reúne, no seu estado actual, os requisitos exigidos, devendo o
                proponente proceder à sua revisão, caso pretenda ressubmetê-lo.
            </p>
        @endif
    </div>

    @if($opinion->observations)
        <div class="observations">
            <strong>Observações:</strong>
            <p>{{ $opinion->observations }}</p>
        </div>
    @endif

    <table class="signature-table">
        <thead>
            <tr>
                <th style="width:40%">Nome</th>
                <th style="width:30%">Função</th>
                <th style="width:30%">Assinatura</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $presidente->name ?? '____________________' }}</td>
                <td>Presidente do Comité de Bioética</td>
                <td></td>
            </tr>
            <tr>
                <td>____________________</td>
                <td>Membro</td>
                <td></td>
            </tr>
            <tr>
                <td>____________________</td>
                <td>Membro</td>
                <td></td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        Maputo, {{ $issuedAt->format('d/m/Y') }}
    </div>
</body>
</html>
