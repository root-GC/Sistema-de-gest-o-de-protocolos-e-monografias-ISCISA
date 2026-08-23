<p>Você foi designado para a banca da monografia <strong>{{ $assignment->jury->defense->monograph->code }}</strong>.</p>
<p>Aceda ao ficheiro através deste link: <a href="{{ $downloadLink }}">{{ $downloadLink }}</a></p>
<p>Prazo para avaliação: {{ $assignment->due_at }}</p>
