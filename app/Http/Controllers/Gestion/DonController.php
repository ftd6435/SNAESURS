<?php

namespace App\Http\Controllers\Gestion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Gestion\StoreDonRequest;
use App\Http\Requests\Gestion\UpdateDonRequest;
use App\Http\Resources\Gestion\DonResource;
use App\Models\Gestion\Don;
use App\Models\Settings\AssignStatut;
use App\Models\Settings\AssignStructure;
use App\Models\User;
use App\Traits\ApiResponses;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DonController extends Controller
{
    use ApiResponses;

    /**
     * Display a listing of dons.
     */
    public function index(Request $request)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            // Build query
            $query = Don::with([
                'typeDon:id,libelle',
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
                    // No active statut: only own donations
                    $query->where('user_id', $authUser->id);
                }
            }

            // Add filters
            if ($request->has('type_don_id')) {
                $query->where('type_don_id', $request->input('type_don_id'));
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

                $query->whereBetween('dons.created_at', [$from, $to]);
            }

            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->whereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('full_name', 'like', "%{$search}%")
                            ->orWhere('telephone', 'like', "%{$search}%");
                    })
                        ->orWhereHas('typeDon', function ($typeQuery) use ($search) {
                            $typeQuery->where('libelle', 'like', "%{$search}%");
                        });
                });
            }

            // Pagination
            $perPage = $request->input('per_page', 15);
            $dons = $query->latest()->paginate($perPage);

            return $this->successResponse(
                DonResource::collection($dons)->response()->getData(true),
                'Liste des dons récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération des dons.',
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

                if ($request->filled('type_don_id')) {
                    $query->where('type_don_id', $request->input('type_don_id'));
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

                    $query->whereBetween('dons.created_at', [$from, $to]);
                }

                if ($request->filled('search')) {
                    $search = $request->input('search');
                    $query->where(function ($q) use ($search) {
                        $q->whereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('full_name', 'like', "%{$search}%")
                                ->orWhere('telephone', 'like', "%{$search}%");
                        })
                            ->orWhereHas('typeDon', function ($typeQuery) use ($search) {
                                $typeQuery->where('libelle', 'like', "%{$search}%");
                            });
                    });
                }
            };

            $base = Don::query();
            $apply($base);

            $totals = (clone $base)
                ->selectRaw('COALESCE(SUM(montant), 0) as total_amount')
                ->selectRaw('COUNT(*) as total_count')
                ->selectRaw('COALESCE(AVG(montant), 0) as avg_amount')
                ->first();

            $byType = (clone $base)
                ->join('type_dons', 'type_dons.id', '=', 'dons.type_don_id')
                ->selectRaw('type_dons.id as type_id, type_dons.libelle as libelle, COALESCE(SUM(dons.montant), 0) as total_amount, COUNT(*) as total_count')
                ->groupBy('type_dons.id', 'type_dons.libelle')
                ->orderByDesc('total_amount')
                ->get();

            $byStructure = (clone $base)
                ->join('structures', 'structures.id', '=', 'dons.structure_id')
                ->selectRaw('structures.id as structure_id, structures.libelle as libelle, COALESCE(SUM(dons.montant), 0) as total_amount, COUNT(*) as total_count')
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
                    'by_type_don' => $byType,
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
     * Store a newly created don.
     */
    public function store(StoreDonRequest $request)
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
                        ['error' => 'Vous devez avoir un statut actif pour créer un don.'],
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
                        ['error' => 'Vous ne pouvez créer des dons que pour vos structures actives.'],
                        403
                    );
                }

                // Ensure donor user belongs to the same structure
                $donorBelongsToStructure = AssignStructure::where('user_id', $validated['user_id'])
                    ->where('structure_id', $validated['structure_id'])
                    ->exists();

                if (!$donorBelongsToStructure) {
                    return $this->errorResponse(
                        'Validation échouée.',
                        ['error' => 'L\'utilisateur sélectionné n\'appartient pas à cette structure.'],
                        422
                    );
                }
            }

            // Create don
            $don = Don::create([
                'type_don_id' => $validated['type_don_id'],
                'structure_id' => $validated['structure_id'],
                'user_id' => $validated['user_id'],
                'montant' => $validated['montant'],
                'commentaire' => $validated['commentaire'] ?? null,
                'created_by' => Auth::id(),
            ]);

            DB::commit();

            // Load relationships for response
            $don->load([
                'typeDon:id,libelle',
                'structure:id,libelle',
                'user:id,full_name,telephone,email',
                'createdBy:id,full_name'
            ]);

            return $this->successResponse(
                new DonResource($don),
                'Don créé avec succès.',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la création du don.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Display the specified don.
     */
    public function show(Don $don)
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

                    if (!in_array($don->structure_id, $activeStructureIds)) {
                        return $this->errorResponse(
                            'Accès refusé.',
                            ['error' => 'Vous ne pouvez consulter que les dons de vos structures actives.'],
                            403
                        );
                    }
                } else {
                    // No active statut: only own donations
                    if ($don->user_id !== $authUser->id) {
                        return $this->errorResponse(
                            'Accès refusé.',
                            ['error' => 'Vous ne pouvez consulter que vos propres dons.'],
                            403
                        );
                    }
                }
            }

            // Load relationships
            $don->load([
                'typeDon:id,libelle',
                'structure:id,libelle',
                'user:id,full_name,telephone,email',
                'createdBy:id,full_name',
                'updatedBy:id,full_name'
            ]);

            return $this->successResponse(
                new DonResource($don),
                'Don récupéré avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération du don.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Update the specified don.
     */
    public function update(UpdateDonRequest $request, Don $don)
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
                        ['error' => 'Vous devez avoir un statut actif pour modifier un don.'],
                        403
                    );
                }

                // Get user's active structures
                $activeStructureIds = AssignStructure::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->pluck('structure_id')
                    ->toArray();

                // Ensure don belongs to user's active structures
                if (!in_array($don->structure_id, $activeStructureIds)) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez modifier que les dons de vos structures actives.'],
                        403
                    );
                }

                // If structure is being changed, ensure new structure is in user's active structures
                if (isset($validated['structure_id']) && !in_array($validated['structure_id'], $activeStructureIds)) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez modifier un don que vers vos structures actives.'],
                        403
                    );
                }

                // If user is being changed, ensure new user belongs to the structure
                if (isset($validated['user_id'])) {
                    $targetStructure = $validated['structure_id'] ?? $don->structure_id;
                    $donorBelongsToStructure = AssignStructure::where('user_id', $validated['user_id'])
                        ->where('structure_id', $targetStructure)
                        ->exists();

                    if (!$donorBelongsToStructure) {
                        return $this->errorResponse(
                            'Validation échouée.',
                            ['error' => 'L\'utilisateur sélectionné n\'appartient pas à cette structure.'],
                            422
                        );
                    }
                }
            }

            // Update don
            $don->update(array_merge($validated, [
                'updated_by' => Auth::id(),
            ]));

            DB::commit();

            // Load relationships for response
            $don->load([
                'typeDon:id,libelle',
                'structure:id,libelle',
                'user:id,full_name,telephone,email',
                'createdBy:id,full_name',
                'updatedBy:id,full_name'
            ]);

            return $this->successResponse(
                new DonResource($don),
                'Don mis à jour avec succès.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la mise à jour du don.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Remove the specified don (soft delete).
     */
    public function destroy(Don $don)
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
                        ['error' => 'Vous devez avoir un statut actif pour supprimer un don.'],
                        403
                    );
                }

                // Get user's active structures
                $activeStructureIds = AssignStructure::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->pluck('structure_id')
                    ->toArray();

                // Ensure don belongs to user's active structures
                if (!in_array($don->structure_id, $activeStructureIds)) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez supprimer que les dons de vos structures actives.'],
                        403
                    );
                }
            }

            // Soft delete the don
            $don->delete();

            return $this->successResponse(
                null,
                'Don supprimé avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la suppression du don.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}
