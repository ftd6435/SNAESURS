<?php

namespace App\Http\Controllers\Gestion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Gestion\StoreDepenseRequest;
use App\Http\Requests\Gestion\UpdateDepenseRequest;
use App\Http\Resources\Gestion\DepenseResource;
use App\Models\Gestion\Depense;
use App\Models\Settings\AssignStatut;
use App\Models\Settings\AssignStructure;
use App\Models\User;
use App\Traits\ApiResponses;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DepenseController extends Controller
{
    use ApiResponses;

    /**
     * Display a listing of depenses.
     */
    public function index(Request $request)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            // Build query
            $query = Depense::with([
                'typeDepense:id,libelle',
                'structure:id,libelle',
                'createdBy:id,full_name',
                'updatedBy:id,full_name'
            ]);

            // Apply role-based filters
            if ($authUser->role === 'membre') {
                // Get user's active structure IDs
                $activeStructureIds = AssignStructure::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->pluck('structure_id')
                    ->toArray();

                // Show only depenses from active structures
                $query->whereIn('structure_id', $activeStructureIds);
            }

            // Add filters
            if ($request->has('type_depense_id')) {
                $query->where('type_depense_id', $request->input('type_depense_id'));
            }

            if ($request->has('structure_id')) {
                $query->where('structure_id', $request->input('structure_id'));
            }

            if ($request->filled('date_from') || $request->filled('date_to')) {
                $from = $request->filled('date_from')
                    ? Carbon::parse($request->input('date_from'))->startOfDay()
                    : Carbon::parse('1970-01-01')->startOfDay();
                $to = $request->filled('date_to')
                    ? Carbon::parse($request->input('date_to'))->endOfDay()
                    : Carbon::parse('2100-01-01')->endOfDay();

                $query->whereBetween('depenses.created_at', [$from, $to]);
            }

            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->whereHas('typeDepense', function ($typeQuery) use ($search) {
                        $typeQuery->where('libelle', 'like', "%{$search}%");
                    })
                        ->orWhere('commentaire', 'like', "%{$search}%");
                });
            }

            // Pagination
            $perPage = $request->input('per_page', 15);
            $depenses = $query->latest()->paginate($perPage);

            return $this->successResponse(
                DepenseResource::collection($depenses)->response()->getData(true),
                'Liste des dépenses récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération des dépenses.',
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
                    $activeStructureIds = AssignStructure::where('user_id', $authUser->id)
                        ->where('is_active', true)
                        ->pluck('structure_id')
                        ->toArray();

                    if (empty($activeStructureIds)) {
                        $query->whereRaw('1 = 0');
                    } else {
                        $query->whereIn('structure_id', $activeStructureIds);
                    }
                }

                if ($request->filled('type_depense_id')) {
                    $query->where('type_depense_id', $request->input('type_depense_id'));
                }

                if ($request->filled('structure_id')) {
                    $query->where('structure_id', $request->input('structure_id'));
                }

                if ($request->filled('date_from') || $request->filled('date_to')) {
                    $from = $request->filled('date_from')
                        ? Carbon::parse($request->input('date_from'))->startOfDay()
                        : Carbon::parse('1970-01-01')->startOfDay();
                    $to = $request->filled('date_to')
                        ? Carbon::parse($request->input('date_to'))->endOfDay()
                        : Carbon::parse('2100-01-01')->endOfDay();

                    $query->whereBetween('depenses.created_at', [$from, $to]);
                }

                if ($request->filled('search')) {
                    $search = $request->input('search');
                    $query->where(function ($q) use ($search) {
                        $q->whereHas('typeDepense', function ($typeQuery) use ($search) {
                            $typeQuery->where('libelle', 'like', "%{$search}%");
                        })
                            ->orWhere('commentaire', 'like', "%{$search}%");
                    });
                }
            };

            $base = Depense::query();
            $apply($base);

            $totals = (clone $base)
                ->selectRaw('COALESCE(SUM(montant), 0) as total_amount')
                ->selectRaw('COUNT(*) as total_count')
                ->selectRaw('COALESCE(AVG(montant), 0) as avg_amount')
                ->first();

            $byType = (clone $base)
                ->join('type_depenses', 'type_depenses.id', '=', 'depenses.type_depense_id')
                ->selectRaw('type_depenses.id as type_id, type_depenses.libelle as libelle, COALESCE(SUM(depenses.montant), 0) as total_amount, COUNT(*) as total_count')
                ->groupBy('type_depenses.id', 'type_depenses.libelle')
                ->orderByDesc('total_amount')
                ->get();

            $byStructure = (clone $base)
                ->join('structures', 'structures.id', '=', 'depenses.structure_id')
                ->selectRaw('structures.id as structure_id, structures.libelle as libelle, COALESCE(SUM(depenses.montant), 0) as total_amount, COUNT(*) as total_count')
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
                    'by_type_depense' => $byType,
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
     * Store a newly created depense.
     */
    public function store(StoreDepenseRequest $request)
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
                        ['error' => 'Vous devez avoir un statut actif pour créer une dépense.'],
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
                        ['error' => 'Vous ne pouvez créer des dépenses que pour vos structures actives.'],
                        403
                    );
                }
            }

            // Create depense
            $depense = Depense::create([
                'type_depense_id' => $validated['type_depense_id'],
                'structure_id' => $validated['structure_id'],
                'montant' => $validated['montant'],
                'commentaire' => $validated['commentaire'] ?? null,
                'created_by' => Auth::id(),
            ]);

            DB::commit();

            // Load relationships for response
            $depense->load([
                'typeDepense:id,libelle',
                'structure:id,libelle',
                'createdBy:id,full_name'
            ]);

            return $this->successResponse(
                new DepenseResource($depense),
                'Dépense créée avec succès.',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la création de la dépense.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Display the specified depense.
     */
    public function show(Depense $depense)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            // Check permissions for 'membre' role
            if ($authUser->role === 'membre') {
                // Check if depense belongs to user's active structures
                $activeStructureIds = AssignStructure::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->pluck('structure_id')
                    ->toArray();

                if (!in_array($depense->structure_id, $activeStructureIds)) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez consulter que les dépenses de vos structures actives.'],
                        403
                    );
                }
            }

            // Load relationships
            $depense->load([
                'typeDepense:id,libelle',
                'structure:id,libelle',
                'createdBy:id,full_name',
                'updatedBy:id,full_name'
            ]);

            return $this->successResponse(
                new DepenseResource($depense),
                'Dépense récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération de la dépense.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Update the specified depense.
     */
    public function update(UpdateDepenseRequest $request, Depense $depense)
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
                        ['error' => 'Vous devez avoir un statut actif pour modifier une dépense.'],
                        403
                    );
                }

                // Get user's active structures
                $activeStructureIds = AssignStructure::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->pluck('structure_id')
                    ->toArray();

                // Ensure depense belongs to user's active structures
                if (!in_array($depense->structure_id, $activeStructureIds)) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez modifier que les dépenses de vos structures actives.'],
                        403
                    );
                }

                // If structure is being changed, ensure new structure is in user's active structures
                if (isset($validated['structure_id']) && !in_array($validated['structure_id'], $activeStructureIds)) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez modifier une dépense que vers vos structures actives.'],
                        403
                    );
                }
            }

            // Update depense
            $depense->update(array_merge($validated, [
                'updated_by' => Auth::id(),
            ]));

            DB::commit();

            // Load relationships for response
            $depense->load([
                'typeDepense:id,libelle',
                'structure:id,libelle',
                'createdBy:id,full_name',
                'updatedBy:id,full_name'
            ]);

            return $this->successResponse(
                new DepenseResource($depense),
                'Dépense mise à jour avec succès.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la mise à jour de la dépense.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Remove the specified depense (soft delete).
     */
    public function destroy(Depense $depense)
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
                        ['error' => 'Vous devez avoir un statut actif pour supprimer une dépense.'],
                        403
                    );
                }

                // Get user's active structures
                $activeStructureIds = AssignStructure::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->pluck('structure_id')
                    ->toArray();

                // Ensure depense belongs to user's active structures
                if (!in_array($depense->structure_id, $activeStructureIds)) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez supprimer que les dépenses de vos structures actives.'],
                        403
                    );
                }
            }

            // Soft delete the depense
            $depense->delete();

            return $this->successResponse(
                null,
                'Dépense supprimée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la suppression de la dépense.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}
