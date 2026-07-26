<?php

namespace Modules\User\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Permission extends Model
{
    use SoftDeletes;
    protected $fillable = ['code', 'description'];

     public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_permissions')->withTimestamps();
    }
}