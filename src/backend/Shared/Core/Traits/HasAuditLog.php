<?php

namespace Shared\Core\Traits;

use Illuminate\Support\Facades\Auth;

/**
 * HasAuditLog
 *
 * Adicionar a qualquer Model para registar automaticamente
 * quem criou / actualizou o registo.
 *
 * Requer colunas: created_by (nullable), updated_by (nullable).
 */
trait HasAuditLog
{
    public static function bootHasAuditLog(): void
    {
        static::creating(function ($model) {
            if (Auth::check()) {
                $model->created_by = Auth::id();
                $model->updated_by = Auth::id();
            }
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });
    }
}