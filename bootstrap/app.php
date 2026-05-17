<?php

use App\Exceptions\BusinessException;
use App\Exceptions\ResourceNotFoundException;
use App\Exceptions\UnauthorizedException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Handle custom exceptions
        $exceptions->render(function (UnauthorizedException $e, Request $request) {
            return $e->render();
        });

        $exceptions->render(function (ResourceNotFoundException $e, Request $request) {
            return $e->render();
        });

        $exceptions->render(function (BusinessException $e, Request $request) {
            return $e->render();
        });

        // Handle generic exceptions in production
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*') && app()->environment('production')) {
                return response()->json([
                    'status' => 0,
                    'message' => 'Une erreur s\'est produite. Veuillez réessayer ultérieurement.',
                    'error' => []
                ], 500);
            }
        });
    })->create();
