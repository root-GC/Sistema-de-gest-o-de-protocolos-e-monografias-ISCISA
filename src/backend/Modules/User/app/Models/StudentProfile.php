<?php
namespace Modules\User\app\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\User\app\Models\Course;
use Modules\User\app\Models\User;
use Modules\User\Models\app\TeacherProfile;


class StudentProfile extends Model
{
    use SoftDeletes;
    protected $fillable = ['user_id', 'course_id', 'supervisorID', 'student_number'];

    public function user()         { return $this->belongsTo(User::class); }
    public function course()       { return $this->belongsTo(Course::class); }
    public function supervisor()   { return $this->belongsTo(TeacherProfile::class, 'supervisorID'); }
}