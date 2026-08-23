<p>Olá,</p>

<p>A defesa da monografia <strong>{{ $monograph->code }}</strong> ("{{ $monograph->title }}") foi agendada para <strong>{{ $defense->scheduled_at->format('d/m/Y H:i') }}</strong> na <strong>{{ $defense->location }}</strong>.</p>

@if($role === 'student')
<p>Como estudante, por favor compareça na data indicada e contacte a secretaria em caso de dúvida.</p>
@elseif($role === 'supervisor')
<p>Como orientador, esteja presente na sessão e prepare o parecer final.</p>
@else
<p>Por favor consulte o sistema para mais detalhes.</p>
@endif

<p>Obrigado.</p>
