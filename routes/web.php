<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');

    return redirect()->away($frontendUrl);
});
