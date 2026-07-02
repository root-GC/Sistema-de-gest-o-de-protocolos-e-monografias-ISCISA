<?php

namespace Modules\Protocol\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\User\app\Models\Course;
use Modules\User\app\Models\ScientificArea;
use Modules\User\app\Models\User;

class Topic extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'student_id',
        'scientific_area_id',
        'course_id',
        'title',
        'status',
        'justification',
        'submitted_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function scientificArea()
    {
        return $this->belongsTo(ScientificArea::class, 'scientific_area_id');
    }

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }
}
