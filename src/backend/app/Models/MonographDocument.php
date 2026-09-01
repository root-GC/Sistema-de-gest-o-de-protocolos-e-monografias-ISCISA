<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonographDocument extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'monograph_id', 'submitted_by', 'document_type',
        'file_name', 'file_path', 'pages', 'version', 'status',
    ];

    public function monograph(): BelongsTo
    {
        return $this->belongsTo(\Modules\Monograph\app\Models\Monograph::class);
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(\Modules\User\app\Models\User::class, 'submitted_by');
    }
}
