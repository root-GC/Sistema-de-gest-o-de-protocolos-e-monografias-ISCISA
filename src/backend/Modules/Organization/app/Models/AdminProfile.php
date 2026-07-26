<?php

namespace Modules\Organization\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Auth\Models\User;

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
}