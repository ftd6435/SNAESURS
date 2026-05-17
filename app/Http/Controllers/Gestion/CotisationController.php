<?php

namespace App\Http\Controllers\Gestion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Gestion\StoreCotisationRequest;
use App\Http\Requests\Gestion\UpdateCotisationRequest;
use App\Http\Resources\Gestion\CotisationResource;
use App\Models\Gestion\Cotisation;
use App\Models\Gestion\InitCotisation;
use App\Models\Settings\AssignStatut;
use App\Models\Settings\AssignStructure;
use App\Models\User;
use App\Traits\ApiResponses;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CotisationController extends Controller
{
    use ApiResponses;

    /**
     * Display a listing of cotisations.
     */
    public function index(Request $request)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            // Build query
            $query = Cotisation::with([
                'initCotisation.typeCotisation:id,libelle',
                'initCotisation.structure:id,libelle',
                'user:id,full_name,telephone,email',
                'createdBy:id,full_name',
                'updatedBy:id,full_name'
            ]);

            if ($authUser->role === 'membre') {
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if ($hasActiveStatut) {
                    $structureIds = AssignStructure::where('user_id', $authUser->id)
                        ->where('is_active', true)
                        ->pluck('structure_id')
                        ->toArray();

                    if (!empty($structureIds)) {
                        $memberIds = AssignStructure::query()
                            ->selectRaw('DISTINCT assign_structures.user_id')
                            ->join('users', 'users.id', '=', 'assign_structures.user_id')
                            ->whereIn('assign_structures.structure_id', $structureIds)
                            ->where('assign_structures.is_active', true)
                            ->where('users.role', 'membre')
                            ->where('users.is_active', true)
                            ->where('users.is_approved', true)
                            ->whereNull('users.deleted_at')
                            ->pluck('assign_structures.user_id')
                            ->toArray();

                        $memberIds[] = $authUser->id;
                        $memberIds = array_values(array_unique($memberIds));

                        $query->whereIn('user_id', $memberIds);
                    } else {
                        $query->where('user_id', $authUser->id);
                    }
                } else {
                    $query->where('user_id', $authUser->id);
                }
            }

            // Add filters
            if ($request->has('init_cotisation_id')) {
                $query->where('init_cotisation_id', $request->input('init_cotisation_id'));
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->input('user_id'));
            }

            if ($request->has('paid')) {
                if ($request->boolean('paid')) {
                    $query->whereNotNull('paid_at');
                } else {
                    $query->whereNull('paid_at');
                }
            }

            if ($request->filled('date_from') || $request->filled('date_to')) {
                $from = $request->filled('date_from')
                    ? Carbon::parse($request->input('date_from'))->startOfDay()
                    : Carbon::parse('1970-01-01')->startOfDay();
                $to = $request->filled('date_to')
                    ? Carbon::parse($request->input('date_to'))->endOfDay()
                    : Carbon::parse('2100-01-01')->endOfDay();

                $query->whereBetween('cotisations.created_at', [$from, $to]);
            }

            if ($request->has('search')) {
                $search = $request->input('search');
                $query->whereHas('user', function ($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                        ->orWhere('telephone', 'like', "%{$search}%");
                });
            }

            // Pagination
            $perPage = $request->input('per_page', 15);
            $cotisations = $query->latest()->paginate($perPage);

            return $this->successResponse(
                CotisationResource::collection($cotisations)->response()->getData(true),
                'Liste des cotisations récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération des cotisations.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function stats(Request $request)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            $apply = function ($query) use ($request, $authUser) {
                if ($authUser->role === 'membre') {
                    $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                        ->where('is_active', true)
                        ->exists();

                    if ($hasActiveStatut) {
                        $structureIds = AssignStructure::where('user_id', $authUser->id)
                            ->where('is_active', true)
                            ->pluck('structure_id')
                            ->toArray();

                        if (!empty($structureIds)) {
                            $memberIds = AssignStructure::query()
                                ->selectRaw('DISTINCT assign_structures.user_id')
                                ->join('users', 'users.id', '=', 'assign_structures.user_id')
                                ->whereIn('assign_structures.structure_id', $structureIds)
                                ->where('assign_structures.is_active', true)
                                ->where('users.role', 'membre')
                                ->where('users.is_active', true)
                                ->where('users.is_approved', true)
                                ->whereNull('users.deleted_at')
                                ->pluck('assign_structures.user_id')
                                ->toArray();

                            $memberIds[] = $authUser->id;
                            $memberIds = array_values(array_unique($memberIds));

                            $query->whereIn('user_id', $memberIds);
                        } else {
                            $query->where('user_id', $authUser->id);
                        }
                    } else {
                        $query->where('user_id', $authUser->id);
                    }
                }

                if ($request->filled('init_cotisation_id')) {
                    $query->where('init_cotisation_id', $request->input('init_cotisation_id'));
                }

                if ($request->filled('user_id')) {
                    $query->where('user_id', $request->input('user_id'));
                }

                if ($request->has('paid')) {
                    if ($request->boolean('paid')) {
                        $query->whereNotNull('paid_at');
                    } else {
                        $query->whereNull('paid_at');
                    }
                }

                if ($request->filled('date_from') || $request->filled('date_to')) {
                    $from = $request->filled('date_from')
                        ? Carbon::parse($request->input('date_from'))->startOfDay()
                        : Carbon::parse('1970-01-01')->startOfDay();
                    $to = $request->filled('date_to')
                        ? Carbon::parse($request->input('date_to'))->endOfDay()
                        : Carbon::parse('2100-01-01')->endOfDay();

                    $query->whereBetween('cotisations.created_at', [$from, $to]);
                }

                if ($request->filled('search')) {
                    $search = $request->input('search');
                    $query->whereHas('user', function ($q) use ($search) {
                        $q->where('full_name', 'like', "%{$search}%")
                            ->orWhere('telephone', 'like', "%{$search}%");
                    });
                }
            };

            $base = Cotisation::query();
            $apply($base);

            $paidQuery = (clone $base)->whereNotNull('paid_at');
            $unpaidQuery = (clone $base)->whereNull('paid_at');

            $paidTotals = $paidQuery
                ->selectRaw('COALESCE(SUM(amount), 0) as total_amount')
                ->selectRaw('COUNT(*) as total_count')
                ->selectRaw('COALESCE(AVG(amount), 0) as avg_amount')
                ->first();

            $unpaidTotals = $unpaidQuery
                ->selectRaw('COALESCE(SUM(amount), 0) as total_amount')
                ->selectRaw('COUNT(*) as total_count')
                ->first();

            $byType = (clone $paidQuery)
                ->join('init_cotisations', 'init_cotisations.id', '=', 'cotisations.init_cotisation_id')
                ->join('type_cotisations', 'type_cotisations.id', '=', 'init_cotisations.type_cotisation_id')
                ->selectRaw('type_cotisations.id as type_id, type_cotisations.libelle as libelle, COALESCE(SUM(cotisations.amount), 0) as total_amount, COUNT(*) as total_count')
                ->groupBy('type_cotisations.id', 'type_cotisations.libelle')
                ->orderByDesc('total_amount')
                ->get();

            $byStructure = (clone $paidQuery)
                ->join('init_cotisations', 'init_cotisations.id', '=', 'cotisations.init_cotisation_id')
                ->join('structures', 'structures.id', '=', 'init_cotisations.structure_id')
                ->selectRaw('structures.id as structure_id, structures.libelle as libelle, COALESCE(SUM(cotisations.amount), 0) as total_amount, COUNT(*) as total_count')
                ->groupBy('structures.id', 'structures.libelle')
                ->orderByDesc('total_amount')
                ->get();

            return $this->successResponse(
                [
                    'paid' => [
                        'total_amount' => (float) ($paidTotals->total_amount ?? 0),
                        'total_count' => (int) ($paidTotals->total_count ?? 0),
                        'avg_amount' => (float) ($paidTotals->avg_amount ?? 0),
                    ],
                    'unpaid' => [
                        'total_amount' => (float) ($unpaidTotals->total_amount ?? 0),
                        'total_count' => (int) ($unpaidTotals->total_count ?? 0),
                    ],
                    'by_type_cotisation' => $byType,
                    'by_structure' => $byStructure,
                ],
                'Statistiques récupérées avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération des statistiques.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Store a newly created cotisation.
     */
    public function store(StoreCotisationRequest $request)
    {
        try {
            DB::beginTransaction();

            /**
             * @var User $authUser
             */
            $authUser = Auth::user();
            $validated = $request->validated();

            // Get the init cotisation
            $initCotisation = InitCotisation::findOrFail($validated['init_cotisation_id']);

            $alreadyTotal = Cotisation::where('init_cotisation_id', $validated['init_cotisation_id'])
                ->where('user_id', $validated['user_id'])
                ->sum('amount');

            $maxAmount = (float) $initCotisation->montant;
            $requestedAmount = (float) $validated['amount'];
            $newTotal = (float) $alreadyTotal + $requestedAmount;

            if ($newTotal > $maxAmount) {
                $remaining = max(0, $maxAmount - (float) $alreadyTotal);
                return $this->errorResponse(
                    'Validation échouée.',
                    ['amount' => "Le montant dépasse le montant attendu. Reste à payer: {$remaining}."],
                    422
                );
            }

            $userBelongsToStructure = AssignStructure::where('user_id', $validated['user_id'])
                ->where('structure_id', $initCotisation->structure_id)
                ->where('is_active', true)
                ->exists();

            if (!$userBelongsToStructure) {
                return $this->errorResponse(
                    'Validation échouée.',
                    ['user_id' => 'L\'utilisateur sélectionné n\'appartient pas à cette structure.'],
                    422
                );
            }

            // Check permissions for 'membre' role
            if ($authUser->role === 'membre') {
                // Check if membre has an active statut
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour créer une cotisation.'],
                        403
                    );
                }

                // Ensure init cotisation belongs to auth user's active structures
                $userStructure = AssignStructure::where('user_id', $authUser->id)
                    ->where('structure_id', $initCotisation->structure_id)
                    ->where('is_active', true)
                    ->exists();

                if (!$userStructure) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez créer des cotisations que pour les initialisations de vos structures actives.'],
                        403
                    );
                }
            }

            // Create cotisation
            $cotisation = Cotisation::create([
                'init_cotisation_id' => $validated['init_cotisation_id'],
                'user_id' => $validated['user_id'],
                'amount' => $validated['amount'],
                'paid_at' => $validated['paid_at'] ?? null,
                'created_by' => Auth::id(),
            ]);

            DB::commit();

            // Load relationships for response
            $cotisation->load([
                'initCotisation.typeCotisation:id,libelle',
                'initCotisation.structure:id,libelle',
                'user:id,full_name,telephone,email',
                'createdBy:id,full_name'
            ]);

            return $this->successResponse(
                new CotisationResource($cotisation),
                'Cotisation créée avec succès.',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la création de la cotisation.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Display the specified cotisation.
     */
    public function show(Cotisation $cotisation)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            // Check permissions for 'membre' role - can only view own cotisations
            if ($authUser->role === 'membre' && $cotisation->user_id !== $authUser->id) {
                return $this->errorResponse(
                    'Accès refusé.',
                    ['error' => 'Vous ne pouvez consulter que vos propres cotisations.'],
                    403
                );
            }

            $cotisation->load([
                'initCotisation.typeCotisation:id,libelle',
                'initCotisation.structure:id,libelle',
                'user:id,full_name,telephone,email',
                'createdBy:id,full_name',
                'updatedBy:id,full_name'
            ]);

            return $this->successResponse(
                new CotisationResource($cotisation),
                'Cotisation récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération de la cotisation.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Update the specified cotisation.
     */
    public function update(UpdateCotisationRequest $request, Cotisation $cotisation)
    {
        try {
            DB::beginTransaction();

            /**
             * @var User $authUser
             */
            $authUser = Auth::user();
            $validated = $request->validated();

            // Get the init cotisation (current or changed)
            $targetInitCotisation = isset($validated['init_cotisation_id'])
                ? InitCotisation::findOrFail($validated['init_cotisation_id'])
                : $cotisation->initCotisation;

            $targetUserId = $validated['user_id'] ?? $cotisation->user_id;
            $targetAmount = isset($validated['amount']) ? (float) $validated['amount'] : (float) $cotisation->amount;

            $alreadyTotal = Cotisation::where('init_cotisation_id', $targetInitCotisation->id)
                ->where('user_id', $targetUserId)
                ->where('id', '!=', $cotisation->id)
                ->sum('amount');

            $maxAmount = (float) $targetInitCotisation->montant;
            $newTotal = (float) $alreadyTotal + $targetAmount;

            if ($newTotal > $maxAmount) {
                $remaining = max(0, $maxAmount - (float) $alreadyTotal);
                return $this->errorResponse(
                    'Validation échouée.',
                    ['amount' => "Le montant dépasse le montant attendu. Reste à payer: {$remaining}."],
                    422
                );
            }

            $userBelongsToStructure = AssignStructure::where('user_id', $targetUserId)
                ->where('structure_id', $targetInitCotisation->structure_id)
                ->where('is_active', true)
                ->exists();

            if (!$userBelongsToStructure) {
                return $this->errorResponse(
                    'Validation échouée.',
                    ['user_id' => 'L\'utilisateur sélectionné n\'appartient pas à cette structure.'],
                    422
                );
            }

            // Check permissions for 'membre' role
            if ($authUser->role === 'membre') {
                // Check if membre has an active statut
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour modifier une cotisation.'],
                        403
                    );
                }

                // Ensure cotisation's init cotisation belongs to auth user's active structures
                $userStructure = AssignStructure::where('user_id', $authUser->id)
                    ->where('structure_id', $targetInitCotisation->structure_id)
                    ->where('is_active', true)
                    ->exists();

                if (!$userStructure) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez modifier que les cotisations de vos structures actives.'],
                        403
                    );
                }
            }

            $validated['updated_by'] = Auth::id();
            $cotisation->update($validated);

            DB::commit();

            // Load relationships for response
            $cotisation->load([
                'initCotisation.typeCotisation:id,libelle',
                'initCotisation.structure:id,libelle',
                'user:id,full_name,telephone,email',
                'createdBy:id,full_name',
                'updatedBy:id,full_name'
            ]);

            return $this->successResponse(
                new CotisationResource($cotisation),
                'Cotisation mise à jour avec succès.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la mise à jour de la cotisation.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Remove the specified cotisation.
     */
    public function destroy(Cotisation $cotisation)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            // Get the init cotisation
            $initCotisation = $cotisation->initCotisation;

            // Check permissions for 'membre' role
            if ($authUser->role === 'membre') {
                // Check if membre has an active statut
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour supprimer une cotisation.'],
                        403
                    );
                }

                // Ensure cotisation's init cotisation belongs to auth user's active structures
                $userStructure = AssignStructure::where('user_id', $authUser->id)
                    ->where('structure_id', $initCotisation->structure_id)
                    ->where('is_active', true)
                    ->exists();

                if (!$userStructure) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez supprimer que les cotisations de vos structures actives.'],
                        403
                    );
                }
            }

            $cotisation->delete();

            return $this->successResponse(
                [],
                'Cotisation supprimée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la suppression de la cotisation.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}
