@php
    $student = data_get($protocol, 'topic.student.name', '________________');
    $title = data_get($protocol, 'topic.title', '________________');
    $version = $opinionVersion ?? $opinion->evaluationForm?->version ?? $opinion->version ?? $protocol->version ?? '____';
    $issuedAt = $opinion->issued_at ?? now();
    $deliberationAt = $opinion->evaluationForm?->deliberation_date ?? $issuedAt;

    $months = [
        1 => 'Janeiro',
        2 => 'Fevereiro',
        3 => 'Março',
        4 => 'Abril',
        5 => 'Maio',
        6 => 'Junho',
        7 => 'Julho',
        8 => 'Agosto',
        9 => 'Setembro',
        10 => 'Outubro',
        11 => 'Novembro',
        12 => 'Dezembro',
    ];
@endphp

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 36px 54px 42px; }
        body {
            font-family: "DejaVu Serif", serif;
            font-size: 11.5px;
            color: #000;
            line-height: 1.42;
        }
        .header {
            text-align: center;
            margin-bottom: 28px;
        }
        .logo {
            width: 74px;
            margin-bottom: 8px;
        }
        .institution {
            font-weight: bold;
            text-transform: uppercase;
            line-height: 1.25;
        }
        .committee {
            margin-top: 14px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .recipient {
            margin-top: 42px;
            margin-bottom: 28px;
        }
        .ref-row {
            width: 100%;
            margin: 10px 0 28px;
        }
        .ref-left {
            float: left;
            width: 48%;
        }
        .ref-right {
            float: right;
            width: 48%;
            text-align: right;
        }
        .clear {
            clear: both;
        }
        .subject {
            margin: 28px 0 26px;
            text-align: justify;
        }
        .body-text {
            text-align: justify;
            margin-bottom: 14px;
        }
        .documents {
            margin: 14px 0 18px 18px;
            padding-left: 16px;
        }
        .documents li {
            margin-bottom: 9px;
        }
        .note-title {
            margin-top: 18px;
            font-weight: bold;
        }
        .notes {
            margin: 8px 0 22px 18px;
            padding-left: 16px;
        }
        .notes li {
            margin-bottom: 8px;
            text-align: justify;
        }
        .observations {
            margin: 18px 0 22px;
            text-align: justify;
        }
        .closing {
            margin-top: 24px;
        }
        .date {
            margin-top: 46px;
            text-align: right;
        }
        .signature {
            margin-top: 58px;
            text-align: center;
        }
        .signature-title {
            margin-bottom: 42px;
            font-weight: bold;
        }
        .signature-line {
            display: inline-block;
            min-width: 270px;
            border-top: 1px solid #000;
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        @if(!empty($logoDataUri))
            <img src="{{ $logoDataUri }}" class="logo" alt="ISCISA">
        @endif

        <div class="institution">ISCISA - INSTITUTO SUPERIOR DE CIÊNCIAS DE SAÚDE</div>
        <div class="committee">COMITÉ DE BIOÉTICA DO ISCISA</div>
    </div>

    <div class="recipient">
        <div>Exmo(a) Senhor(a)</div>
        <div>{{ $student }}</div>
        <div style="margin-top: 14px;">Maputo</div>
    </div>

    <div class="ref-row">
        <div class="ref-left">Nossa Refª N° {{ $protocol->code ?? $protocol->id }}/COMITÉ-DE-BIOÉTICA/{{ $issuedAt->format('Y') }}</div>
        <div class="ref-right">
            Maputo, {{ $issuedAt->format('d') }} de {{ $months[(int) $issuedAt->format('n')] }} de {{ $issuedAt->format('Y') }}
        </div>
        <div class="clear"></div>
    </div>

    <div class="subject">
        <strong>Assunto:</strong>
        Aprovação do Protocolo n° {{ $protocol->code ?? $protocol->id }} e intitulado:
        “{{ $title }}” - Versão {{ $version }}.
    </div>

    <p class="body-text">
        O Comité de Bioética do ISCISA,
        reunido em sessão ordinária, no dia {{ $deliberationAt->format('d') }}
        de {{ $months[(int) $deliberationAt->format('n')] }} de {{ $deliberationAt->format('Y') }},
        analisou o protocolo em referência, não havendo nenhum inconveniente de natureza ética
        que inviabilize a realização do estudo, deliberou pela aprovação dos seguintes documentos
        relacionados ao protocolo em alusão:
    </p>

    <ol class="documents">
        <li>Protocolo do estudo versão {{ $version }}, de {{ $issuedAt->format('d') }} de {{ $months[(int) $issuedAt->format('n')] }} de {{ $issuedAt->format('Y') }}.</li>
        <li>Instrumento(s) de recolha de dado(s), versão {{ $version }}.</li>
        <li>Folha de informação ao participante e termo de consentimento livre e informado (caso aplicável), versão {{ $version }}.</li>
        <li>Folha de informação ao participante pai/mãe ou cuidador e termo de consentimento livre e informado (caso aplicável), versão {{ $version }}.</li>
        <li>Folha de informação ao participante e termo de assentimento ao participante menor de 18 anos a 12 anos de idade (caso aplicável), versão {{ $version }}.</li>
    </ol>

    <div class="note-title">Nota:</div>
    <ol class="notes">
        <li>Pode recolher os dados.</li>
        <li>Qualquer alteração a ser introduzida no protocolo, incluindo o período de recolha de dados e os seus anexos, deve ser submetida ao Comité de Bioética para sua aprovação.</li>
        <li>A aprovação deste protocolo terá a validade de um ano, contado a partir da data desta nota. Em caso de renovação de prazo de validade deste protocolo, o estudante ou pesquisador deverá submeter o pedido de renovação ao Comité de Bioética, um mês antes do término do prazo de validade da aprovação do protocolo.</li>
    </ol>

    @if($opinion->observations)
        <div class="observations">
            <strong>Observações:</strong><br>
            {{ $opinion->observations }}
        </div>
    @endif

    <p class="closing">Queira receber os nossos melhores cumprimentos.</p>

    <div class="date">
        Maputo, aos {{ $issuedAt->format('d') }} de {{ $months[(int) $issuedAt->format('n')] }}
        de {{ $issuedAt->format('Y') }}
    </div>

    <div class="signature">
        <div class="signature-title">O Presidente do Comité de Bioética</div>
        <div class="signature-line">{{ $presidente->name ?? 'Eng. Pereira A. F. Raposo' }}</div>
    </div>
</body>
</html>
