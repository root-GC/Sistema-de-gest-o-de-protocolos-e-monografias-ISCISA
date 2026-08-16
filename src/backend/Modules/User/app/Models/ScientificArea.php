<?php
namespace Modules\User\app\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Modules\User\app\Models\Organ;
use Modules\User\app\Models\Course;

class ScientificArea extends Model
{
    use SoftDeletes;
    protected $fillable = ['organ_id', 'name'];
    public function organ(): HasOne
    {
        return $this->hasOne(Organ::class)
            ->where('type', 'nucleus');
    }
    public function courses() { return $this->hasMany(Course::class); }
}