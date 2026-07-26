<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="utf-8">
    <title>Código de verificação</title>
</head>
<body style="font-family: Arial, sans-serif; background:#f4f5f7; padding:24px;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;">
        <tr>
            <td>
                <h2 style="margin:0 0 16px;color:#1a1a1a;">SGPMC — ISCISA</h2>
                <p style="color:#333;font-size:15px;">Use o código abaixo para confirmar o seu email. Este código expira em {{ $ttlMinutes }} minutos.</p>
                <p style="font-size:32px;letter-spacing:8px;font-weight:bold;text-align:center;background:#f0f2f5;border-radius:6px;padding:16px;margin:24px 0;">
                    {{ $code }}
                </p>
                <p style="color:#777;font-size:13px;">Se não solicitou este código, pode ignorar este email com segurança.</p>
            </td>
        </tr>
    </table>
</body>
</html>

{{-- está em: resources/views/emails/otp.blade.php --}}