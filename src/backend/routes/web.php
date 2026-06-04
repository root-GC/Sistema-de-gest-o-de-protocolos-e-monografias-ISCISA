<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;

Route::get('/', function () {
    return view('welcome');
});

Route::fallback(function () {

    Log::info('FALLBACK EXECUTADO', [
        'url' => request()->fullUrl(),
        'referer' => request()->header('referer'),
    ]);

    abort(404);
});