<?php

namespace Modules\Monograph\app\Enums;

enum MonographStatus: string
{
    case AguardaSubmissao = 'aguarda_submissao';
    case Submetida = 'submetida';
    case Devolvida = 'devolvida';
    case VerificacaoDocumental = 'verificacao_documental';
    case Verificada = 'verificada';

    public function label(): string
    {
        return match($this) {
            self::AguardaSubmissao => 'Aguarda submissão',
            self::Submetida => 'Submetida',
            self::Devolvida => 'Devolvida',
            self::VerificacaoDocumental => 'Em verificação documental',
            self::Verificada => 'Verificada',
        };
    }
}