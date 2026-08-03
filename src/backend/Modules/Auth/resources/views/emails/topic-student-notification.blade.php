{{-- Modules/Topics/resources/views/emails/topic-update.blade.php --}}
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="utf-8">
    <title>Actualizacao do tema</title>
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