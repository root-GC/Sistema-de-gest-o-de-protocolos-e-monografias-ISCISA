<?php

use Illuminate\Support\Facades\Route;
use Modules\Defense\Http\Controllers\DefenseController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('defenses', DefenseController::class)->names('defense');
});
