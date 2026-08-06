<?php

namespace Modules\Organization\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\app\Models\User;

class OrganMember extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'organ_id',
        'user_id',
        'role',
    ];

    // Cargos dentro do órgão — diferente das roles de acesso (user_roles)
    const ROLES = [
        'president',
        'coordinator',
        'reviewer',
        'member',
    ];

    public function organ(): BelongsTo
    {
        return $this->belongsTo(Organ::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}