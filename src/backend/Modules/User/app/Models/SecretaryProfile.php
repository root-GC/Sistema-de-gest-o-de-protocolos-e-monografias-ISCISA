<?php
namespace Modules\User\app\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\User\app\Models\Organ;
use Modules\User\app\Models\User;


class SecretaryProfile extends Model
{
    use SoftDeletes;
    protected $fillable = ['user_id', 'organ_id', 'office'];
    public function user()  { return $this->belongsTo(User::class); }
    public function organ() { return $this->belongsTo(Organ::class); }
}