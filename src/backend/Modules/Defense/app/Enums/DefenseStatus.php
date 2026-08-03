<?php
// Modules/Defense/app/Enums/DefenseStatus.php

namespace Modules\Defense\app\Enums;

enum DefenseStatus: string
{
    case AguardaJuri = 'aguarda_juri';
    case JuriDefinido = 'juri_definido';
    case DataProposta = 'data_proposta';
    case DefesaAgendada = 'defesa_agendada';
    case Defendida = 'defendida';
    case AguardaCorrecoesFinais = 'aguarda_correcoes_finais';
    case CorrecoesSubmetidas = 'correcoes_submetidas';
    case Encerrada = 'encerrada';

    public function label(): string
    {
        return match($this) {
            self::AguardaJuri => 'Aguarda definição do júri',
            self::JuriDefinido => 'Júri definido',
            self::DataProposta => 'Data proposta — aguarda confirmação do arguente',
            self::DefesaAgendada => 'Defesa agendada',
            self::Defendida => 'Defendida',
            self::AguardaCorrecoesFinais => 'Aguarda versão final corrigida',
            self::CorrecoesSubmetidas => 'Correcções submetidas — aguarda validação',
            self::Encerrada => 'Encerrada',
        };
    }
}