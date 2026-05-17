<?php

namespace App\Http\Controllers\Gestion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Gestion\StoreSanctionRequest;
use App\Http\Requests\Gestion\UpdateSanctionRequest;
use App\Http\Resources\Gestion\SanctionResource;
use App\Models\Gestion\Sanction;
use App\Models\Settings\AssignStatut;
use App\Models\Settings\AssignStructure;
use App\Models\User;
use App\Traits\ApiResponses;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SanctionController extends Controller
{
    use ApiResponses;

    /**
     * Display a listing of sanctions.
     */
    public function index(Request $request)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            // Build query
            $query = Sanction::with([
                'typeSanction:id,libelle',
                'structure:id,libelle',
                'user:id,full_name,telephone,email',
                'createdBy:id,full_name',
                'updatedBy:id,full_name'
            ]);

            // Apply role-based filters
            if ($authUser->role === 'membre') {
                // Check if membre has active statut
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if ($hasActiveStatut) {
                    // Get user's active structure IDs
                    $activeStructureIds = AssignStructure::where('user_id', $authUser->id)
                        ->where('is_active', true)
                        ->pluck('structure_id')
                        ->toArray();

                    if (empty($activeStructureIds)) {
                        $query->whereRaw('1 = 0');
                    } else {
                        $query->whereIn('structure_id', $activeStructureIds);
                    }
                } else {
                    // No active statut: only own sanctions
                    $query->where('user_id', $authUser->id);
                }
            }

            // Add filters
            if ($request->has('type_sanction_id')) {
                $query->where('type_sanction_id', $request->input('type_sanction_id'));
            }

            if ($request->has('structure_id')) {
                $query->where('structure_id', $request->input('structure_id'));
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->input('user_id'));
            }

            if ($request->filled('date_from') || $request->filled('date_to')) {
                $from = $request->filled('date_from')
                    ? Carbon::parse($request->input('date_from'))->startOfDay()
                    : Carbon::parse('1970-01-01')->startOfDay();
                $to = $request->filled('date_to')
                    ? Carbon::parse($request->input('date_to'))->endOfDay()
                    : Carbon::parse('2100-01-01')->endOfDay();

                $query->whereBetween('sanctions.created_at', [$from, $to]);
            }

            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->whereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('full_name', 'like', "%{$search}%")
                            ->orWhere('telephone', 'like', "%{$search}%");
                    })
                        ->orWhereHas('typeSanction', function ($typeQuery) use ($search) {
                            $typeQuery->where('libelle', 'like', "%{$search}%");
                        });
                });
            }

            // Pagination
            $perPage = $request->input('per_page', 15);
            $sanctions = $query->latest()->paginate($perPage);

            return $this->successResponse(
                SanctionResource::collection($sanctions)->response()->getData(true),
                'Liste des sanctions récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération des sanctions.',
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
                        $activeStructureIds = AssignStructure::where('user_id', $authUser->id)
                            ->where('is_active', true)
                            ->pluck('structure_id')
                            ->toArray();

                        if (empty($activeStructureIds)) {
                            $query->whereRaw('1 = 0');
                        } else {
                            $query->whereIn('structure_id', $activeStructureIds);
                        }
                    } else {
                        $query->where('user_id', $authUser->id);
                    }
                }

                if ($request->filled('type_sanction_id')) {
                    $query->where('type_sanction_id', $request->input('type_sanction_id'));
                }

                if ($request->filled('structure_id')) {
                    $query->where('structure_id', $request->input('structure_id'));
                }

                if ($request->filled('user_id')) {
                    $query->where('user_id', $request->input('user_id'));
                }

                if ($request->filled('date_from') || $request->filled('date_to')) {
                    $from = $request->filled('date_from')
                        ? Carbon::parse($request->input('date_from'))->startOfDay()
                        : Carbon::parse('1970-01-01')->startOfDay();
                    $to = $request->filled('date_to')
                        ? Carbon::parse($request->input('date_to'))->endOfDay()
                        : Carbon::parse('2100-01-01')->endOfDay();

                    $query->whereBetween('sanctions.created_at', [$from, $to]);
                }

                if ($request->filled('search')) {
                    $search = $request->input('search');
                    $query->where(function ($q) use ($search) {
                        $q->whereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('full_name', 'like', "%{$search}%")
                                ->orWhere('telephone', 'like', "%{$search}%");
                        })
                            ->orWhereHas('typeSanction', function ($typeQuery) use ($search) {
                                $typeQuery->where('libelle', 'like', "%{$search}%");
                            });
                    });
                }
            };

            $base = Sanction::query();
            $apply($base);

            $totals = (clone $base)
                ->selectRaw('COALESCE(SUM(montant), 0) as total_amount')
                ->selectRaw('COUNT(*) as total_count')
                ->selectRaw('COALESCE(AVG(montant), 0) as avg_amount')
                ->first();

            $byType = (clone $base)
                ->join('type_sanctions', 'type_sanctions.id', '=', 'sanctions.type_sanction_id')
                ->selectRaw('type_sanctions.id as type_id, type_sanctions.libelle as libelle, COALESCE(SUM(sanctions.montant), 0) as total_amount, COUNT(*) as total_count')
                ->groupBy('type_sanctions.id', 'type_sanctions.libelle')
                ->orderByDesc('total_amount')
                ->get();

            $byStructure = (clone $base)
                ->join('structures', 'structures.id', '=', 'sanctions.structure_id')
                ->selectRaw('structures.id as structure_id, structures.libelle as libelle, COALESCE(SUM(sanctions.montant), 0) as total_amount, COUNT(*) as total_count')
                ->groupBy('structures.id', 'structures.libelle')
                ->orderByDesc('total_amount')
                ->get();

            return $this->successResponse(
                [
                    'totals' => [
                        'total_amount' => (float) ($totals->total_amount ?? 0),
                        'total_count' => (int) ($totals->total_count ?? 0),
                        'avg_amount' => (float) ($totals->avg_amount ?? 0),
                    ],
                    'by_type_sanction' => $byType,
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
     * Store a newly created sanction.
     */
    public function store(StoreSanctionRequest $request)
    {
        try {
            DB::beginTransaction();

            /**
             * @var User $authUser
             */
            $authUser = Auth::user();
            $validated = $request->validated();

            // Check permissions for 'membre' and 'admin' roles
            if (in_array($authUser->role, ['membre', 'admin'])) {
                // Check if user has an active statut
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour créer une sanction.'],
                        403
                    );
                }

                // Get user's active structures
                $activeStructureIds = AssignStructure::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->pluck('structure_id')
                    ->toArray();

                // Ensure structure belongs to user's active structures
                if (!in_array($validated['structure_id'], $activeStructureIds)) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez créer des sanctions que pour vos structures actives.'],
                        403
                    );
                }

                // Ensure sanctioned user belongs to the same structure
                $userBelongsToStructure = AssignStructure::where('user_id', $validated['user_id'])
                    ->where('structure_id', $validated['structure_id'])
                    ->exists();

                if (!$userBelongsToStructure) {
                    return $this->errorResponse(
                        'Validation échouée.',
                        ['error' => 'L\'utilisateur sélectionné n\'appartient pas à cette structure.'],
                        422
                    );
                }
            }

            // Create sanction
            $sanction = Sanction::create([
                'type_sanction_id' => $validated['type_sanction_id'],
                'structure_id' => $validated['structure_id'],
                'user_id' => $validated['user_id'],
                'montant' => $validated['montant'],
                'commentaire' => $validated['commentaire'] ?? null,
                'created_by' => Auth::id(),
            ]);

            DB::commit();

            // Load relationships for response
            $sanction->load([
                'typeSanction:id,libelle',
                'structure:id,libelle',
                'user:id,full_name,telephone,email',
                'createdBy:id,full_name'
            ]);

            return $this->successResponse(
                new SanctionResource($sanction),
                'Sanction créée avec succès.',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la création de la sanction.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Display the specified sanction.
     */
    public function show(Sanction $sanction)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            // Check permissions for 'membre' role
            if ($authUser->role === 'membre') {
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if ($hasActiveStatut) {
                    $activeStructureIds = AssignStructure::where('user_id', $authUser->id)
                        ->where('is_active', true)
                        ->pluck('structure_id')
                        ->toArray();

                    if (!in_array($sanction->structure_id, $activeStructureIds)) {
                        return $this->errorResponse(
                            'Accès refusé.',
                            ['error' => 'Vous ne pouvez consulter que les sanctions de vos structures actives.'],
                            403
                        );
                    }
                } else {
                    // No active statut: only own sanctions
                    if ($sanction->user_id !== $authUser->id) {
                        return $this->errorResponse(
                            'Accès refusé.',
                            ['error' => 'Vous ne pouvez consulter que vos propres sanctions.'],
                            403
                        );
                    }
                }
            }

            // Load relationships
            $sanction->load([
                'typeSanction:id,libelle',
                'structure:id,libelle',
                'user:id,full_name,telephone,email',
                'createdBy:id,full_name',
                'updatedBy:id,full_name'
            ]);

            return $this->successResponse(
                new SanctionResource($sanction),
                'Sanction récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération de la sanction.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Update the specified sanction.
     */
    public function update(UpdateSanctionRequest $request, Sanction $sanction)
    {
        try {
            DB::beginTransaction();

            /**
             * @var User $authUser
             */
            $authUser = Auth::user();
            $validated = $request->validated();

            // Check permissions for 'membre' and 'admin' roles
            if (in_array($authUser->role, ['membre', 'admin'])) {
                // Check if user has an active statut
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour modifier une sanction.'],
                        403
                    );
                }

                // Get user's active structures
                $activeStructureIds = AssignStructure::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->pluck('structure_id')
                    ->toArray();

                // Ensure sanction belongs to user's active structures
                if (!in_array($sanction->structure_id, $activeStructureIds)) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez modifier que les sanctions de vos structures actives.'],
                        403
                    );
                }

                // If structure is being changed, ensure new structure is in user's active structures
                if (isset($validated['structure_id']) && !in_array($validated['structure_id'], $activeStructureIds)) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez modifier une sanction que vers vos structures actives.'],
                        403
                    );
                }

                // If user is being changed, ensure new user belongs to the structure
                if (isset($validated['user_id'])) {
                    $targetStructure = $validated['structure_id'] ?? $sanction->structure_id;
                    $userBelongsToStructure = AssignStructure::where('user_id', $validated['user_id'])
                        ->where('structure_id', $targetStructure)
                        ->exists();

                    if (!$userBelongsToStructure) {
                        return $this->errorResponse(
                            'Validation échouée.',
                            ['error' => 'L\'utilisateur sélectionné n\'appartient pas à cette structure.'],
                            422
                        );
                    }
                }
            }

            // Update sanction
            $sanction->update(array_merge($validated, [
                'updated_by' => Auth::id(),
            ]));

            DB::commit();

            // Load relationships for response
            $sanction->load([
                'typeSanction:id,libelle',
                'structure:id,libelle',
                'user:id,full_name,telephone,email',
                'createdBy:id,full_name',
                'updatedBy:id,full_name'
            ]);

            return $this->successResponse(
                new SanctionResource($sanction),
                'Sanction mise à jour avec succès.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la mise à jour de la sanction.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Remove the specified sanction (soft delete).
     */
    public function destroy(Sanction $sanction)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            // Check permissions for 'membre' and 'admin' roles
            if (in_array($authUser->role, ['membre', 'admin'])) {
                // Check if user has an active statut
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour supprimer une sanction.'],
                        403
                    );
                }

                // Get user's active structures
                $activeStructureIds = AssignStructure::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->pluck('structure_id')
                    ->toArray();

                // Ensure sanction belongs to user's active structures
                if (!in_array($sanction->structure_id, $activeStructureIds)) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez supprimer que les sanctions de vos structures actives.'],
                        403
                    );
                }
            }

            // Soft delete the sanction
            $sanction->delete();

            return $this->successResponse(
                null,
                'Sanction supprimée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la suppression de la sanction.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}
