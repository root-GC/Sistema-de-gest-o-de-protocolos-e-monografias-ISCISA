@php
$organ = $opinion->organ ?? 'nucleo';
$area = data_get($protocol, 'topic.scientificArea.name', '________________');
$student = data_get($protocol, 'topic.student.name', '________________');
$supervisor = data_get($protocol, 'topic.supervisor.user.name', '________________');
$title = data_get($protocol, 'topic.title', '________________');
$version = $opinionVersion ?? $opinion->evaluationForm?->version ?? $opinion->version ?? $protocol->version ?? '____';
$issuedAt = $opinion->issued_at ?? now();
$deliberationAt = $opinion->evaluationForm?->deliberation_date ?? $issuedAt;
$decisionLabel = $opinion->decision === 'approved' ? 'APROVAÇÃO' : 'NÃO APROVAÇÃO';

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

$organHeader = match ($organ) {
'nucleo' => "NÚCLEO CIENTÍFICO DA ÁREA DE {$area}",
'comite_cientifico' => 'COMITÉ CIENTÍFICO',
default => 'COMITÉ CIENTÍFICO',
};

$organSentence = match ($organ) {
'nucleo' => "O Núcleo Científico da área de {$area}",
'comite_cientifico' => 'O Comité Científico',
default => 'O Comité Científico',
};

$presidentTitle = match ($organ) {
'nucleo' => "O Presidente do Núcleo de {$area}",
'comite_cientifico' => 'O Presidente do Comité Científico',
default => 'O Presidente do Comité',
};
@endphp

<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <style>
        @page {
            margin: 40px 58px 48px;
        }

        body {
            font-family: "DejaVu Serif", serif;
            font-size: 12px;
            color: #000;
            line-height: 1.45;
        }

        .header {
            text-align: center;
            margin-bottom: 26px;
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

        .organ {
            margin-top: 18px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .address-block {
            margin-top: 54px;
            margin-bottom: 42px;
        }

        .address-line {
            margin: 5px 0;
        }

        .city {
            margin-top: 46px;
        }

        .subject {
            margin: 28px 0 32px;
            text-align: justify;
        }

        .body-text {
            text-align: justify;
            margin: 0 0 30px;
        }

        .decision {
            font-weight: bold;
        }

        .observations {
            margin: 24px 0 32px;
            text-align: justify;
        }

        .closing {
            margin-top: 28px;
        }

        .date {
            margin-top: 72px;
            text-align: right;
        }

        .signature {
            margin-top: 68px;
            text-align: center;
        }

        .signature-title {
            margin-bottom: 46px;
        }

        .signature-line {
            display: inline-block;
            min-width: 260px;
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

        <div class="institution">
            INSTITUTO SUPERIOR DE CIÊNCIAS DE SAÚDE<br>
            (ISCISA)
        </div>

        <div class="organ">{{ $organHeader }}</div>
    </div>

    <div class="address-block">
        <div class="address-line"><strong>ATT:</strong> {{ $student }}</div>
        <div class="address-line"><strong>CC:</strong> {{ $supervisor }}</div>
        <div class="city">Maputo</div>
    </div>

    <div class="subject">
        <strong>Assunto:</strong>
        Deliberação do Protocolo intitulado:
        <strong>“{{ $title }}”</strong> - Versão {{ $version }}.
    </div>

    <p class="body-text">
        {{ $organSentence }}, reunido em sessão ordinária, no dia
        {{ $deliberationAt->format('d') }} de {{ $months[(int) $deliberationAt->format('n')] }}
        de {{ $deliberationAt->format('Y') }}, analisou o protocolo em referência,
        tendo deliberado a sua <span class="decision">“{{ $decisionLabel }}”</span>,
        e arrolado as recomendações que seguem em anexo.
    </p>

    @if($opinion->observations)
    <div class="observations">
        <strong>Recomendações/Observações:</strong><br>
        {{ $opinion->observations }}
    </div>
    @endif

    <p class="closing">Queira receber os nossos melhores cumprimentos.</p>

    <div class="date">
        Maputo, aos {{ $issuedAt->format('d') }} de {{ $months[(int) $issuedAt->format('n')] }}
        de {{ $issuedAt->format('Y') }}
    </div>

    <div class="signature">
        <div class="signature-title">{{ $presidentTitle }}</div>
        <div class="signature-line">{{ $presidente->name ?? '' }}</div>
    </div>
</body>

</html>