<?php

namespace Modules\User\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Organ\app\Models\Organ;
use Modules\User\app\Models\User;

class AdminProfile extends Model
{
    use SoftDeletes;
    protected $fillable = ['user_id', 'organ_id', 'access_scope']; // global | organ
    public function user()  { return $this->belongsTo(User::class); }
    public function organ() { return $this->belongsTo(Organ::class); }
}