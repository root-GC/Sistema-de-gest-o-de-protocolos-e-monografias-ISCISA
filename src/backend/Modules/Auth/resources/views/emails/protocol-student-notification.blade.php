<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="utf-8">
    <title>Actualizacao do protocolo</title>
</head>
<body style="font-family: Arial, sans-serif; background:#f4f5f7; padding:24px;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;">
        <tr>
            <td>
                <h2 style="margin:0 0 16px;color:#1a1a1a;">SGPMC — ISCISA</h2>
                <p style="color:#333;font-size:15px;">Olá, {{ $name }}.</p>
                <p style="color:#333;font-size:15px;">{{ $message }}</p>
                <div style="background:#f0f2f5;border-radius:6px;padding:16px;margin:16px 0;">
                    <p style="margin:0 0 4px;font-size:13px;color:#666;">Codigo do protocolo</p>
                    <p style="margin:0 0 8px;font-size:16px;color:#1a1a1a;font-weight:bold;">{{ $protocolCode }}</p>
                    @if ($topicTitle)
                        <p style="margin:0 0 4px;font-size:13px;color:#666;">Titulo do tema</p>
                        <p style="margin:0;font-size:14px;color:#333;">{{ $topicTitle }}</p>
                    @endif
                </div>
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
