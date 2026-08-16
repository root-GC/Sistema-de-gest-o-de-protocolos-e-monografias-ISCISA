<?php
namespace Modules\User\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Organ extends Model
{
    use SoftDeletes;

    protected $fillable = ['name', 'type', 'description'];

    // type: nucleus | scientific_committee | bioethics_committee | scientific_direction
    public function scientificArea(): BelongsTo
    {
        return $this->belongsTo('Modules\\User\\app\\Models\\ScientificArea');
    }
}