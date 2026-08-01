{{-- Modules/Auth/resources/views/emails/otp.blade.php --}}
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="utf-8">
    <title>Código de Verificação — SGPMC</title>
</head>
<body style="font-family: Arial, sans-serif; background:#f4f5f7; padding:24px;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;">
        <tr>
            <td style="text-align:center;padding-bottom:16px;">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKW98T0QI3yiR-05Z-BoA6n6AKFK_0ZdAqs1kfapv1inuADxNU7iCp-dKMIMkUti0n9BuBbzOugqpZmuRFq8g0e6hIiwvgFJ3EMlGTBhVTYkjNfkmlUWZEDkXFSNZ59ZVenTCv8hw2KrROVZkKZort3wvb3rQ862iCLbpMPGaiHh1LsvhPKbtxDNFe4jRGObM0eeFiO0gYIZ0z1ac0X6dncZ6JWoUI0NGRm5BtnK_SSPldMEHABk8gTnp6gZnGB41fWkONkURhR3I"
                     alt="ISCISA"
                     width="56"
                     height="56"
                     style="display:block;margin:0 auto;">
            </td>
        </tr>
        <tr>
            <td>
                <h2 style="margin:0 0 16px;color:#1a1a1a;text-align:center;">SGPMC — ISCISA</h2>
                <p style="color:#333;font-size:15px;">
                    Use o código abaixo para confirmar o seu email. Este código expira em {{ $ttlMinutes }} minutos.
                </p>
                <p style="font-size:32px;letter-spacing:8px;font-weight:bold;text-align:center;background:#f0f2f5;border-radius:6px;padding:16px;margin:24px 0;">
                    {{ $code }}
                </p>
                <p style="color:#777;font-size:13px;">
                    Se não solicitou este código, pode ignorar este email com segurança.
                </p>
                <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;">
                <p style="color:#999;font-size:11px;text-align:center;">
                    Instituto Superior de Ciências de Saúde (ISCISA)<br>
                    Gestão Científica
                </p>
            </td>
        </tr>
    </table>
</body>
</html>