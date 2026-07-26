<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
Route::fallback(function () {

    Log::info('FALLBACK EXECUTADO', [
        'url' => request()->fullUrl(),
        'referer' => request()->header('referer'),
    ]);

    abort(404);
});

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok'
    ]);
});