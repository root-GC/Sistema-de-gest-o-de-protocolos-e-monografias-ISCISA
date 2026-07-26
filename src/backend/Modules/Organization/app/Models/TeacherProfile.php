<?php

namespace Modules\Organization\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Auth\Models\User;

class TeacherProfile extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'scientific_area_id',
        'department',
        'academic_degree',
        'is_internal',
    ];

    protected $casts = [
        'is_internal' => 'boolean',
    ];

    // Graus académicos — usado para validar elegibilidade de revisores (RF-061)
    const DEGREES = [
        'licenciatura',
        'mestrado',
        'doutoramento',
    ];

    // Grau mínimo para ser revisor de mestrado/doutoramento
    const REVIEWER_MIN_DEGREE = 'mestrado';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scientificArea(): BelongsTo
    {
        return $this->belongsTo(ScientificArea::class);
    }

    // Estudantes que este docente supervisiona
    public function supervisedStudents(): HasMany
    {
        return $this->hasMany(StudentProfile::class, 'supervisor_id');
    }

    // Verifica se o docente tem grau suficiente para ser revisor (RF-061)
    public function canReviewDegree(string $protocolType): bool
    {
        $degreeOrder = ['licenciatura' => 1, 'mestrado' => 2, 'doutoramento' => 3];

        $reviewerLevel = $degreeOrder[$this->academic_degree] ?? 0;
        $requiredLevel = $degreeOrder[$protocolType]          ?? 0;

        return $reviewerLevel >= $requiredLevel;
    }
}