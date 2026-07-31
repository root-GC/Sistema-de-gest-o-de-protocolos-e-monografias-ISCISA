<?php

namespace Modules\User\app\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Modules\User\database\factories\UserFactory;
use Modules\User\app\Models\Organ;
use Modules\User\app\Models\ScientificArea;
use Modules\User\app\Models\Permission;
use Modules\User\app\Models\Role;
use Modules\User\app\Models\TeacherProfile;
use Modules\User\app\Models\StudentProfile;
use Modules\User\app\Models\CoordinatorProfile;
use Modules\User\app\Models\SecretaryProfile;
use Modules\User\app\Models\AdminProfile;




class User extends Authenticatable
{
    use HasApiTokens, SoftDeletes, HasFactory;

    protected static function newFactory()
    {
        return new UserFactory();
    }

    protected $fillable = ['name', 'email', 'password', 'status'];
    protected $hidden   = ['password', 'remember_token'];
    protected $casts    = ['email_verified_at' => 'datetime'];

    // ── RBAC ─────────────────────────────────────────────────────────
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles')->withTimestamps();
    }

    public function hasRole(string $role): bool
    {
        return $this->roles->contains('name', $role);
    }

    public function hasPermission(string $code): bool
    {
        return $this->roles
            ->flatMap(fn($r) => $r->permissions)
            ->contains('code', $code);
    }

    public function hasAnyPermission(array $codes): bool
    {
        $userCodes = $this->roles
            ->flatMap(fn($r) => $r->permissions->pluck('code'))
            ->unique();

        return collect($codes)->contains(fn($code) => $userCodes->contains($code));
    }

    public function hasAllPermissions(array $codes): bool
    {
        $userCodes = $this->roles
            ->flatMap(fn($r) => $r->permissions->pluck('code'))
            ->unique();

        return collect($codes)->every(fn($code) => $userCodes->contains($code));
    }

    // ── Perfis ───────────────────────────────────────────────────────
    public function teacherProfile()
    {
        return $this->hasOne(TeacherProfile::class);
    }

    public function studentProfile()
    {
        return $this->hasOne(StudentProfile::class);
    }

    public function coordinatorProfile()
    {
        return $this->hasOne(CoordinatorProfile::class);
    }

    public function secretaryProfile()
    {
        return $this->hasOne(SecretaryProfile::class);
    }

    public function adminProfile()
    {
        return $this->hasOne(AdminProfile::class);
    }
}