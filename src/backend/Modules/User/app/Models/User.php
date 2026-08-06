<?php

namespace Modules\User\app\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Modules\User\app\Models\Organ;
use Modules\User\app\Models\ScientificArea;
use Modules\User\app\Models\Permission;
use Modules\User\app\Models\Role;
use Modules\User\app\Models\TeacherProfile;
use Modules\User\app\Models\StudentProfile;
use Modules\Organization\app\Models\AdminProfile;
use Modules\Organization\app\Models\CoordinatorProfile;
use Modules\Organization\app\Models\SecretaryProfile;

class User extends Authenticatable
{
    use HasApiTokens, SoftDeletes, HasFactory;

    protected static function newFactory()
    {
        return new UserFactory();
    }

    protected $fillable = ['name', 'email', 'password', 'status', 'must_reset_password'];
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

    /**
     * Permissão via role OU atribuída directamente (caso das secretárias
     * cujo presidente atribui/retira permissões individualmente).
     */
    public function hasPermission(string $code): bool
    {
        $viaRole   = $this->roles->flatMap(fn ($r) => $r->permissions)->contains('code', $code);
        $viaDirect = $this->directPermissions->contains('code', $code);

        return $viaRole || $viaDirect;
    }

    public function hasAnyPermission(array $codes): bool
    {
        $userCodes = $this->allPermissionCodes();
        return collect($codes)->contains(fn ($code) => $userCodes->contains($code));
    }

    public function hasAllPermissions(array $codes): bool
    {
        $userCodes = $this->allPermissionCodes();
        return collect($codes)->every(fn ($code) => $userCodes->contains($code));
    }

    private function allPermissionCodes()
    {
        return $this->roles
            ->flatMap(fn ($r) => $r->permissions->pluck('code'))
            ->merge($this->directPermissions->pluck('code'))
            ->unique();
    }

    public function directPermissions()
    {
        return $this->belongsToMany(Permission::class, 'user_permissions')->withTimestamps();
    }

    // ── Perfis ───────────────────────────────────────────────────────
    public function teacherProfile()     { return $this->hasOne(TeacherProfile::class); }
    public function studentProfile()     { return $this->hasOne(StudentProfile::class); }
    public function coordinatorProfile() { return $this->hasOne(CoordinatorProfile::class); }
    public function secretaryProfile()   { return $this->hasOne(SecretaryProfile::class); }
    public function adminProfile()       { return $this->hasOne(AdminProfile::class); }
}