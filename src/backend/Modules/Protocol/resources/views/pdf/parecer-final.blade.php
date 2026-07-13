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
        .page-break { page-break-after: always; }
    </style>
</head>
<body>
    <div class="header">
        <strong>INSTITUTO SUPERIOR DE CIÊNCIAS DE SAÚDE (ISCISA)</strong><br>
        @if(($opinion->organ ?? '') === 'nucleo')
            Núcleo Científico
        @elseif(($opinion->organ ?? '') === 'comite_cientifico')
            Comissão Científica
        @elseif(($opinion->organ ?? '') === 'comite_bioetica')
            Comité de Bioética
        @else
            Comissão Científica
        @endif
        <br>
        <h3>PARECER FINAL</h3>
        <hr>
    </div>

    <table class="info-table">
        <tr><td>N.º do Protocolo:</td><td>{{ $protocol->code ?? $protocol->id }}</td></tr>
        <tr><td>Título:</td><td>{{ $protocol->topic->title ?? '---' }}</td></tr>
        <tr><td>Proponente(s):</td><td>{{ $protocol->topic->student->name ?? '---' }}</td></tr>
        <tr><td>Orientador(a):</td><td>{{ $protocol->topic->supervisor->user->name ?? '---' }}</td></tr>
        <tr><td>Curso:</td><td>{{ $protocol->topic->course->name ?? '---' }}</td></tr>
        <tr><td>Versão do Protocolo:</td><td>{{ $opinion->version ?? $protocol->version }}</td></tr>
        <tr><td>Data de Emissão:</td><td>{{ $opinion->issued_at->format('d/m/Y') }}</td></tr>
    </table>

    <div class="decision-text">
        <p>
            Após a revisão e deliberação
            @if(($opinion->organ ?? '') === 'nucleo')
                do Núcleo Científico,
            @else
                da Comissão Científica,
            @endif
            tendo em conta os critérios científicos, metodológicos e éticos estabelecidos,
            o protocolo em referência foi
            <strong>{{ strtoupper($opinion->decision === 'approved' ? 'APROVADO' : 'REPROVADO') }}</strong>,
            @if($opinion->decision === 'approved')
                encontrando-se o proponente autorizado a prosseguir para a fase seguinte,
                nos termos regulamentares em vigor.
            @else
                não reunindo, no seu estado actual, os requisitos exigidos, devendo o
                proponente proceder à sua revisão, caso pretenda ressubmetê-lo.
            @endif
        </p>
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
                <td>Presidente</td>
                <td></td>
            </tr>
            <tr>
                <td>{{ isset($membro1) ? $membro1->name : '____________________' }}</td>
                <td>Membro</td>
                <td></td>
            </tr>
            <tr>
                <td>{{ isset($membro2) ? $membro2->name : '____________________' }}</td>
                <td>Membro</td>
                <td></td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        Maputo, {{ $opinion->issued_at->format('d \\d\\e F \\d\\e Y') }}
    </div>
</body>
</html>
