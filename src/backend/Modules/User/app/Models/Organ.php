<?php
namespace Modules\User\app\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\User\app\Models\ScientificArea;



class Organ extends Model
{
    use SoftDeletes;
    protected $fillable = ['name', 'type', 'description'];
    // type: nucleus | scientific_committee | bioethics_committee | scientific_direction
    public function scientificAreas() { return $this->hasMany(ScientificArea::class); }
}