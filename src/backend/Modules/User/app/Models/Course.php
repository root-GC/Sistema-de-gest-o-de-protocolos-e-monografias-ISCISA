<?php

namespace Modules\User\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\User\app\Models\ScientificArea;
use Modules\User\app\Models\CoordinatorProfile;

class Course extends Model
{
    use SoftDeletes;
    protected $fillable = ['scientific_area_id', 'name', 'code'];
    public function scientificArea() { return $this->belongsTo(ScientificArea::class); }
    public function coordinator() { return $this->belongsTo(CoordinatorProfile::class); }
}