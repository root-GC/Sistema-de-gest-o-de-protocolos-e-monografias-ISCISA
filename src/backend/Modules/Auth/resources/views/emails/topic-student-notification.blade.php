<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="utf-8">
    <title>Actualizacao do tema</title>
</head>
<body style="font-family: Arial, sans-serif; background:#f4f5f7; padding:24px;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;">
        <tr>
            <td>
                <h2 style="margin:0 0 16px;color:#1a1a1a;">SGPMC — ISCISA</h2>
                <p style="color:#333;font-size:15px;">Olá, {{ $name }}.</p>
                @if ($supervisorName)
                    <p style="color:#333;font-size:15px;">
                        O supervisor <strong>{{ $supervisorName }}</strong> <span style="color:{{ $decision === 'aprovado' ? '#006933' : '#cc0000' }};">{{ $decision }}</span> o seu tema:
                    </p>
                @else
                    <p style="color:#333;font-size:15px;">
                        O seu tema foi <span style="color:{{ $decision === 'aprovado' ? '#006933' : '#cc0000' }};">{{ $decision }}</span>:
                    </p>
                @endif
                <div style="background:#f0f2f5;border-radius:6px;padding:16px;margin:16px 0;">
                    <p style="margin:0;font-size:16px;color:#1a1a1a;font-weight:bold;">{{ $topicTitle }}</p>
                </div>
                <p style="color:#333;font-size:15px;">{{ $nextStep }}</p>
                <p style="text-align:center;margin:32px 0;">
                    <a href="{{ $link }}"
                       style="display:inline-block;background:#006933;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:6px;">
                        Ver detalhes
                    </a>
                </p>
                <p style="color:#777;font-size:13px;">
                    <a href="{{ $link }}" style="color:#006933;word-break:break-all;">{{ $link }}</a>
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
