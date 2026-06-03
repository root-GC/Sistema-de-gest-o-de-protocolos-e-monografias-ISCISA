<?php

namespace Modules\User\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\User\app\Models\Course;
use Modules\User\app\Models\ScientificArea;
use Modules\User\app\Models\User;

class CoordinatorProfile extends Model
{
    use SoftDeletes;
    protected $fillable = ['user_id', 'scientific_area', 'course_id', 'office'];

    public function user()           { return $this->belongsTo(User::class); }
    public function course()         { return $this->belongsTo(Course::class); }
    public function scientificArea() { return $this->belongsTo(ScientificArea::class, 'scientific_area'); }
}