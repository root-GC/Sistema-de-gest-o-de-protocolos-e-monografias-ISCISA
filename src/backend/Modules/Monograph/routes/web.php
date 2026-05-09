<?php

use Illuminate\Support\Facades\Route;
use Modules\Monograph\Http\Controllers\MonographController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('monographs', MonographController::class)->names('monograph');
});
