<?php

namespace Modules\User\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use SoftDeletes;
    protected $fillable = ['scientific_area_id', 'name', 'code'];
    public function scientificArea() { return $this->belongsTo(ScientificArea::class); }
}