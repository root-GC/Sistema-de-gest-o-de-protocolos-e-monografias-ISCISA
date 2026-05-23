<?php

namespace Modules\Auth\App\Models;

use Laravel\Sanctum\HasApiTokens;

use Illuminate\Notifications\Notifiable;

use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes, HasRoles;

    protected $fillable = [

        'name',

        'email',

        'password',

        'status'
    ];

    protected $hidden = [

        'password',

        'remember_token'
    ];

    protected $casts = [

        'email_verified_at' => 'datetime'
    ];
}