<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Gestion\CotisationController;
use App\Http\Controllers\Gestion\DepenseController;
use App\Http\Controllers\Gestion\DonController;
use App\Http\Controllers\Gestion\InitCotisationController;
use App\Http\Controllers\Gestion\ParticipantController;
use App\Http\Controllers\Gestion\ReunionController;
use App\Http\Controllers\Gestion\SanctionController;
use App\Http\Controllers\Settings\AssignStatutController;
use App\Http\Controllers\Settings\AssignStructureController;
use App\Http\Controllers\Settings\StatutController;
use App\Http\Controllers\Settings\StructureController;
use App\Http\Controllers\Settings\TypeCotisationController;
use App\Http\Controllers\Settings\TypeDepenseController;
use App\Http\Controllers\Settings\TypeDonController;
use App\Http\Controllers\Settings\TypeSanctionController;
use App\Http\Controllers\UserController;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public authentication routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/resend-otp', [AuthController::class, 'resendOtp']);
});

Route::prefix('public')->group(function () {
    Route::get('/users/{code}', [UserController::class, 'publicShowByCode']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return new UserResource($request->user()->load([
            'assignStructures.structure:id,libelle',
            'assignStatuts.statut:id,libelle',
        ]));
    });

    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Profile management routes (authenticated user)
    Route::prefix('profile')->group(function () {
        Route::put('/', [UserController::class, 'updateProfile']);
        Route::post('/change-password', [UserController::class, 'changePassword']);
    });

    // User management routes
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);

        // Create/approve: admin/super_admin, and also membre with active statut (enforced in controller)
        Route::middleware('role:super_admin,admin,membre')->group(function () {
            Route::get('/badges/printable', [UserController::class, 'badgeUsers']);
            Route::post('/', [UserController::class, 'store']);
            Route::post('/{user}/approve', [UserController::class, 'approve']);
        });

        // Toggle active remains admin/super_admin only
        Route::middleware('role:super_admin,admin')->group(function () {
            Route::post('/{user}/toggle-active', [UserController::class, 'toggleActive']);
        });
    });

    // Settings routes - read access for authenticated roles, write access for admin/super_admin
    Route::prefix('settings')->group(function () {
        Route::middleware('role:super_admin,admin,membre,tresorier,secretaire')->group(function () {
            Route::get('type-cotisations', [TypeCotisationController::class, 'index']);
            Route::get('type-cotisations/{typeCotisation}', [TypeCotisationController::class, 'show']);

            Route::get('type-dons', [TypeDonController::class, 'index']);
            Route::get('type-dons/{typeDon}', [TypeDonController::class, 'show']);

            Route::get('type-depenses', [TypeDepenseController::class, 'index']);
            Route::get('type-depenses/{typeDepense}', [TypeDepenseController::class, 'show']);

            Route::get('type-sanctions', [TypeSanctionController::class, 'index']);
            Route::get('type-sanctions/{typeSanction}', [TypeSanctionController::class, 'show']);
        });

        Route::middleware('role:super_admin,admin')->group(function () {
            // Structures
            Route::apiResource('structures', StructureController::class);

            // Statuts
            Route::apiResource('statuts', StatutController::class);

            // Type Cotisations
            Route::apiResource('type-cotisations', TypeCotisationController::class)->except(['index', 'show']);

            // Type Dons
            Route::apiResource('type-dons', TypeDonController::class)->except(['index', 'show']);

            // Type Depenses
            Route::apiResource('type-depenses', TypeDepenseController::class)->except(['index', 'show']);

            // Type Sanctions
            Route::apiResource('type-sanctions', TypeSanctionController::class)->except(['index', 'show']);

            // Assign Structures
            Route::apiResource('assign-structures', AssignStructureController::class);

            // Assign Statuts
            Route::apiResource('assign-statuts', AssignStatutController::class);
        });
    });

    // Gestion routes
    Route::prefix('gestion')->group(function () {
        // Init Cotisations
        Route::apiResource('init-cotisations', InitCotisationController::class);
        Route::post('/init-cotisations/{initCotisation}/toggle-completed', [InitCotisationController::class, 'toggleCompleted']);

        // Cotisations
        Route::get('cotisations/stats', [CotisationController::class, 'stats']);
        Route::apiResource('cotisations', CotisationController::class);

        // Reunions
        Route::apiResource('reunions', ReunionController::class);
        Route::get('reunions/{reunion}/proces-verbal/pdf', [ReunionController::class, 'downloadProcesVerbalPdf']);

        // Participants
        Route::apiResource('participants', ParticipantController::class)->except(['store']);

        // Dons
        Route::get('dons/stats', [DonController::class, 'stats']);
        Route::apiResource('dons', DonController::class);

        // Sanctions
        Route::get('sanctions/stats', [SanctionController::class, 'stats']);
        Route::apiResource('sanctions', SanctionController::class);

        // Depenses
        Route::get('depenses/stats', [DepenseController::class, 'stats']);
        Route::apiResource('depenses', DepenseController::class);
    });
});
