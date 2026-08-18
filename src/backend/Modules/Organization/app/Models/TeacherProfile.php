<?php

namespace Modules\Organization\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\User\app\Models\User;

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

    // Campos obrigatórios para perfil completo
    const REQUIRED_FIELDS = [
        'academic_degree',
        'department',
    ];

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

    /**
     * Verificar se o perfil do docente está completo
     * 
     * @return bool
     */
    public function isComplete(): bool
    {
        return !empty($this->academic_degree) && 
               !empty($this->department);
    }

    /**
     * Verificar se o perfil está incompleto
     * 
     * @return bool
     */
    public function isIncomplete(): bool
    {
        return !$this->isComplete();
    }

    /**
     * Obter campos em falta no perfil
     * 
     * @return array
     */
    public function getMissingFields(): array
    {
        $missing = [];

        if (empty($this->academic_degree)) {
            $missing[] = 'academic_degree';
        }

        if (empty($this->department)) {
            $missing[] = 'department';
        }

        return $missing;
    }

    /**
     * Verificar se o grau académico é válido
     * 
     * @param string|null $degree
     * @return bool
     */
    public static function isValidDegree(?string $degree): bool
    {
        return in_array($degree, self::DEGREES);
    }

    /**
     * Verificar se o docente tem grau suficiente para ser revisor (RF-061)
     * 
     * @param string $protocolType
     * @return bool
     */
    public function canReviewDegree(string $protocolType): bool
    {
        $degreeOrder = [
            'licenciatura' => 1, 
            'mestrado' => 2, 
            'doutoramento' => 3
        ];

        $reviewerLevel = $degreeOrder[$this->academic_degree] ?? 0;
        $requiredLevel = $degreeOrder[$protocolType] ?? 0;

        return $reviewerLevel >= $requiredLevel;
    }

    /**
     * Verificar se o docente pode ser revisor
     * Requer perfil completo e grau mínimo
     * 
     * @return bool
     */
    public function canBeReviewer(): bool
    {
        if (!$this->isComplete()) {
            return false;
        }

        $degreeOrder = [
            'licenciatura' => 1, 
            'mestrado' => 2, 
            'doutoramento' => 3
        ];

        $reviewerLevel = $degreeOrder[$this->academic_degree] ?? 0;
        $requiredLevel = $degreeOrder[self::REVIEWER_MIN_DEGREE] ?? 0;

        return $reviewerLevel >= $requiredLevel;
    }

    /**
     * Obter o nível do grau académico (para comparações)
     * 
     * @return int
     */
    public function getDegreeLevel(): int
    {
        $degreeOrder = [
            'licenciatura' => 1, 
            'mestrado' => 2, 
            'doutoramento' => 3
        ];

        return $degreeOrder[$this->academic_degree] ?? 0;
    }

    /**
     * Scope para perfis completos
     */
    public function scopeComplete($query)
    {
        return $query->whereNotNull('academic_degree')
                     ->where('academic_degree', '!=', '')
                     ->whereNotNull('department')
                     ->where('department', '!=', '');
    }

    /**
     * Scope para perfis incompletos
     */
    public function scopeIncomplete($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('academic_degree')
              ->orWhere('academic_degree', '')
              ->orWhereNull('department')
              ->orWhere('department', '');
        });
    }

    /**
     * Scope para docentes elegíveis como revisores
     */
    public function scopeEligibleReviewers($query)
    {
        return $query->complete()
                     ->whereIn('academic_degree', ['mestrado', 'doutoramento']);
    }
}