<?php

use Illuminate\Support\Facades\Route;
use Modules\Protocol\Http\Controllers\ProtocolController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('protocols', ProtocolController::class)->names('protocol');
});
