<?php

namespace Modules\User\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\User\app\Models\Course;
use Modules\User\app\Models\Organ;
use Modules\User\app\Models\ScientificArea;
use Modules\User\app\Models\User;




/**
 * Partilhado pelas roles: teacher, supervisor, reviewer.
 * A distinção entre estas roles é feita pela tabela user_roles,
 * não por tabelas de perfil separadas.
 *
 * academic_degree: licenciatura | mestrado | doutoramento
 * (usado em RF-061 para filtrar revisores por grau mínimo)
 */
class TeacherProfile extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'scientific_area_id',
        'department', 'academic_degree', 'is_Internal',
    ];

    protected $casts = ['is_Internal' => 'boolean'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scientificArea()
    {
        return $this->belongsTo(ScientificArea::class);
    }
}