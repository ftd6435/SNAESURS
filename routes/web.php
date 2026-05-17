<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $frontendUrl = trim((string) env('FRONTEND_URL', ''));

    if ($frontendUrl !== '') {
        return redirect()->away(rtrim($frontendUrl, '/'));
    }

    if (app()->environment('local')) {
        return redirect()->away('http://localhost:5173');
    }

    return view('welcome');
});
