<?php

namespace Modules\Monograph\app\Models;

use App\Models\MonographDocument;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};

class MonographSubmission extends Model
{
    protected $fillable = ['monograph_document_id', 'version', 'submitted_at'];

    protected $casts = ['submitted_at' => 'datetime'];

    public function monograph(): BelongsTo
    {
        return $this->belongsTo(Monograph::class);
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(MonographDocument::class, 'monograph_document_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(MonographReview::class)->orderBy('decided_at');
    }

    public function comments(): HasMany
{
    return $this->hasMany(MonographComment::class)->orderBy('created_at');
}
}