<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="utf-8">
    <title>Convite de Administrador</title>
</head>
<body style="font-family: Arial, sans-serif; background:#f4f5f7; padding:24px;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;">
        <tr>
            <td>
                <h2 style="margin:0 0 16px;color:#1a1a1a;">SGPMC — ISCISA</h2>
                <p style="color:#333;font-size:15px;">Olá, {{ $name }}.</p>
                <p style="color:#333;font-size:15px;">
                    Foi convidado(a) para administrar o Sistema de Gestão de Protocolos de Monografias e Comitês (SGPMC).
                    Para activar a sua conta, defina a sua palavra-passe clicando no botão abaixo.
                </p>
                <p style="text-align:center;margin:32px 0;">
                    <a href="{{ $link }}"
                       style="display:inline-block;background:#006933;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:6px;">
                        Definir Palavra-passe
                    </a>
                </p>
                <p style="color:#777;font-size:13px;">
                    Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                    <a href="{{ $link }}" style="color:#006933;word-break:break-all;">{{ $link }}</a>
                </p>
                <p style="color:#777;font-size:13px;">Este link expira em {{ $ttlMinutes ?? 60 }} minutos. Se não esperava este convite, pode ignorar este email com segurança.</p>
            </td>
        </tr>
    </table>
</body>
</html>