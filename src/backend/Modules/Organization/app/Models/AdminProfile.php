<?php

namespace Modules\Organization\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Auth\app\Models\User;

class AdminProfile extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'organ_id',
        'access_scope',
    ];

    const SCOPES = ['global', 'organ'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Null quando access_scope = 'global'
    public function organ(): BelongsTo
    {
        return $this->belongsTo(Organ::class);
    }

    public function isGlobal(): bool
    {
        return $this->access_scope === 'global';
    }

     /**
     * Executivo da Direção Científica = "admin geral" funcional.
     * Não é role/permissão separada — é este helper que decide se
     * pode criar os outros 3 executivos + coordenadores.
     */
    public function isDirecaoCientifica(): bool
    {
        return $this->access_scope === 'organ'
            && $this->organ
            && $this->organ->isScientificDirection();
    }
}