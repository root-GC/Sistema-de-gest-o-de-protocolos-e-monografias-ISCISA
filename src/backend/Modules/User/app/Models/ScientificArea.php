<?php
namespace Modules\User\app\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\User\app\Models\Organ;
use Modules\User\app\Models\Course;

class ScientificArea extends Model
{
    use SoftDeletes;
    protected $fillable = ['organ_id', 'name'];
    public function organ()   { return $this->belongsTo(Organ::class); }
    public function courses() { return $this->hasMany(Course::class); }
}