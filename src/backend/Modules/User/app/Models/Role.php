<?php
// Role.php
namespace Modules\User\app\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\User\app\Models\Permission;
use Modules\User\app\Models\User;


class Role extends Model
{
    use SoftDeletes;
    protected $fillable = ['name', 'description'];

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permissions')->withTimestamps();
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_roles')->withTimestamps();
    }
}