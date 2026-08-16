<?php

namespace Modules\Organization\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScientificArea extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'organ_id',
        'name'
    ];

    /**
     * Órgão (núcleo) ao qual esta área científica pertence
     */
    public function organ(): BelongsTo
    {
        return $this->belongsTo(Organ::class, 'organ_id');
    }

    /**
     * Cursos desta área científica
     */
    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    /**
     * Perfis de professores desta área
     */
    public function teacherProfiles(): HasMany
    {
        return $this->hasMany(TeacherProfile::class);
    }

    /**
     * Perfis de coordenadores desta área
     */
    public function coordinatorProfiles(): HasMany
    {
        return $this->hasMany(CoordinatorProfile::class);
    }
}