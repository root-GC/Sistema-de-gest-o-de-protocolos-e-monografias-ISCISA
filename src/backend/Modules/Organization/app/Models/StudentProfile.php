<?php

namespace Modules\Organization\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Auth\app\Models\User;

class StudentProfile extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'course_id',
        'supervisor_id',
        'student_number',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    // supervisor_id → teacher_profiles.id (não users.id)
    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(TeacherProfile::class, 'supervisor_id');
    }
}