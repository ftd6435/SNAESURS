<?php

namespace App\Http\Controllers\Gestion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Gestion\StoreInitCotisationRequest;
use App\Http\Requests\Gestion\UpdateInitCotisationRequest;
use App\Http\Resources\Gestion\InitCotisationResource;
use App\Models\Gestion\Cotisation;
use App\Models\Gestion\InitCotisation;
use App\Models\Settings\AssignStatut;
use App\Models\Settings\AssignStructure;
use App\Models\User;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InitCotisationController extends Controller
{
    use ApiResponses;

    /**
     * Display a listing of init cotisations.
     */
    public function index(Request $request)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            $receivedSub = Cotisation::query()
                ->select('init_cotisation_id')
                ->selectRaw('COALESCE(SUM(amount), 0) as received_total')
                ->whereNotNull('paid_at')
                ->groupBy('init_cotisation_id');

            $membersCountSub = AssignStructure::query()
                ->select('assign_structures.structure_id')
                ->selectRaw('COUNT(DISTINCT assign_structures.user_id) as active_members_count')
                ->join('users', 'users.id', '=', 'assign_structures.user_id')
                ->where('assign_structures.is_active', true)
                ->where('users.role', 'membre')
                ->where('users.is_active', true)
                ->where('users.is_approved', true)
                ->whereNull('users.deleted_at')
                ->groupBy('assign_structures.structure_id');

            $query = InitCotisation::query()
                ->with([
                    'typeCotisation:id,libelle',
                    'structure:id,libelle',
                    'createdBy:id,full_name',
                    'updatedBy:id,full_name'
                ])
                ->leftJoinSub($receivedSub, 'rcv', function ($join) {
                    $join->on('rcv.init_cotisation_id', '=', 'init_cotisations.id');
                })
                ->leftJoinSub($membersCountSub, 'mc', function ($join) {
                    $join->on('mc.structure_id', '=', 'init_cotisations.structure_id');
                })
                ->addSelect('init_cotisations.*')
                ->addSelect(DB::raw('COALESCE(rcv.received_total, 0) as received_total'))
                ->addSelect(DB::raw('COALESCE(mc.active_members_count, 0) as active_members_count'));

            // If auth user is 'membre', filter by assigned active structures
            if ($authUser->role === 'membre') {
                // Get auth user's active structure IDs
                $structureIds = AssignStructure::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->pluck('structure_id')
                    ->toArray();

                if (empty($structureIds)) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez être affecté à une structure active pour consulter les initialisations de cotisation.'],
                        403
                    );
                }

                $query->whereIn('structure_id', $structureIds);
            }

            // Add filters
            if ($request->has('structure_id')) {
                $query->where('init_cotisations.structure_id', $request->input('structure_id'));
            }

            if ($request->has('type_cotisation_id')) {
                $query->where('init_cotisations.type_cotisation_id', $request->input('type_cotisation_id'));
            }

            if ($request->has('is_completed')) {
                $query->where('init_cotisations.is_completed', $request->boolean('is_completed'));
            }

            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where('init_cotisations.libelle', 'like', "%{$search}%");
            }

            // Pagination
            $perPage = $request->input('per_page', 15);
            $initCotisations = $query->orderByDesc('init_cotisations.created_at')->paginate($perPage);

            return $this->successResponse(
                InitCotisationResource::collection($initCotisations)->response()->getData(true),
                'Liste des initialisations de cotisation récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération des initialisations de cotisation.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Store a newly created init cotisation.
     */
    public function store(StoreInitCotisationRequest $request)
    {
        try {
            DB::beginTransaction();

            /**
             * @var User $authUser
             */
            $authUser = Auth::user();
            $validated = $request->validated();

            // Check permissions for 'membre' role
            if ($authUser->role === 'membre') {
                // Check if membre has an active statut
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour créer une initialisation de cotisation.'],
                        403
                    );
                }

                // Ensure structure_id belongs to auth user's active structures
                $userStructure = AssignStructure::where('user_id', $authUser->id)
                    ->where('structure_id', $validated['structure_id'])
                    ->where('is_active', true)
                    ->exists();

                if (!$userStructure) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez créer des initialisations que pour vos structures actives.'],
                        403
                    );
                }
            }

            // Create init cotisation
            $initCotisation = InitCotisation::create([
                'type_cotisation_id' => $validated['type_cotisation_id'],
                'structure_id' => $validated['structure_id'],
                'libelle' => $validated['libelle'],
                'description' => $validated['description'] ?? null,
                'montant' => $validated['montant'],
                'date_limite' => $validated['date_limite'] ?? null,
                'is_completed' => $validated['is_completed'] ?? false,
                'created_by' => Auth::id(),
            ]);

            // Create associated cotisations if provided
            if (isset($validated['cotisations']) && is_array($validated['cotisations'])) {
                foreach ($validated['cotisations'] as $cotisationData) {
                    $userBelongsToStructure = AssignStructure::where('user_id', $cotisationData['user_id'])
                        ->where('structure_id', $validated['structure_id'])
                        ->where('is_active', true)
                        ->exists();

                    if (!$userBelongsToStructure) {
                        DB::rollBack();
                        return $this->errorResponse(
                            'Validation échouée.',
                            ['cotisations' => 'Un ou plusieurs utilisateurs ne sont pas membres de la structure sélectionnée.'],
                            422
                        );
                    }

                    Cotisation::create([
                        'init_cotisation_id' => $initCotisation->id,
                        'user_id' => $cotisationData['user_id'],
                        'amount' => $cotisationData['amount'],
                        'paid_at' => $cotisationData['paid_at'] ?? null,
                        'created_by' => Auth::id(),
                    ]);
                }
            }

            DB::commit();

            $initCotisation = InitCotisation::query()
                ->whereKey($initCotisation->id)
                ->with([
                    'typeCotisation:id,libelle',
                    'structure:id,libelle',
                    'cotisations.user:id,full_name,telephone,email',
                    'createdBy:id,full_name',
                    'updatedBy:id,full_name'
                ])
                ->withSum(['cotisations as received_total' => function ($q) {
                    $q->whereNotNull('paid_at');
                }], 'amount')
                ->addSelect([
                    'active_members_count' => AssignStructure::query()
                        ->selectRaw('COUNT(DISTINCT assign_structures.user_id)')
                        ->join('users', 'users.id', '=', 'assign_structures.user_id')
                        ->whereColumn('assign_structures.structure_id', 'init_cotisations.structure_id')
                        ->where('assign_structures.is_active', true)
                        ->where('users.role', 'membre')
                        ->where('users.is_active', true)
                        ->where('users.is_approved', true)
                        ->whereNull('users.deleted_at'),
                ])
                ->firstOrFail();

            return $this->successResponse(
                new InitCotisationResource($initCotisation),
                'Initialisation de cotisation créée avec succès.',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la création de l\'initialisation de cotisation.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Display the specified init cotisation.
     */
    public function show(InitCotisation $initCotisation)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            // Check permissions for 'membre' role
            if ($authUser->role === 'membre') {
                $userStructure = AssignStructure::where('user_id', $authUser->id)
                    ->where('structure_id', $initCotisation->structure_id)
                    ->where('is_active', true)
                    ->exists();

                if (!$userStructure) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez consulter que les initialisations de vos structures actives.'],
                        403
                    );
                }
            }

            $initCotisation = InitCotisation::query()
                ->whereKey($initCotisation->id)
                ->with([
                    'typeCotisation:id,libelle',
                    'structure:id,libelle',
                    'cotisations.user:id,full_name,telephone,email',
                    'createdBy:id,full_name',
                    'updatedBy:id,full_name'
                ])
                ->withSum(['cotisations as received_total' => function ($q) {
                    $q->whereNotNull('paid_at');
                }], 'amount')
                ->addSelect([
                    'active_members_count' => AssignStructure::query()
                        ->selectRaw('COUNT(DISTINCT assign_structures.user_id)')
                        ->join('users', 'users.id', '=', 'assign_structures.user_id')
                        ->whereColumn('assign_structures.structure_id', 'init_cotisations.structure_id')
                        ->where('assign_structures.is_active', true)
                        ->where('users.role', 'membre')
                        ->where('users.is_active', true)
                        ->where('users.is_approved', true)
                        ->whereNull('users.deleted_at'),
                ])
                ->firstOrFail();

            return $this->successResponse(
                new InitCotisationResource($initCotisation),
                'Initialisation de cotisation récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération de l\'initialisation de cotisation.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Update the specified init cotisation.
     */
    public function update(UpdateInitCotisationRequest $request, InitCotisation $initCotisation)
    {
        try {
            DB::beginTransaction();

            /**
             * @var User $authUser
             */
            $authUser = Auth::user();
            $validated = $request->validated();

            // Check permissions for 'membre' role
            if ($authUser->role === 'membre') {
                // Check if membre has an active statut
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour modifier une initialisation de cotisation.'],
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
                        ['error' => 'Vous ne pouvez modifier que les initialisations de vos structures actives.'],
                        403
                    );
                }

                // If trying to change structure_id, validate it
                if (isset($validated['structure_id']) && $validated['structure_id'] != $initCotisation->structure_id) {
                    $newUserStructure = AssignStructure::where('user_id', $authUser->id)
                        ->where('structure_id', $validated['structure_id'])
                        ->where('is_active', true)
                        ->exists();

                    if (!$newUserStructure) {
                        return $this->errorResponse(
                            'Accès refusé.',
                            ['error' => 'Vous ne pouvez modifier la structure que vers vos structures actives.'],
                            403
                        );
                    }
                }
            }

            $validated['updated_by'] = Auth::id();
            $initCotisation->update($validated);

            DB::commit();

            $initCotisation = InitCotisation::query()
                ->whereKey($initCotisation->id)
                ->with([
                    'typeCotisation:id,libelle',
                    'structure:id,libelle',
                    'cotisations.user:id,full_name,telephone,email',
                    'createdBy:id,full_name',
                    'updatedBy:id,full_name'
                ])
                ->withSum(['cotisations as received_total' => function ($q) {
                    $q->whereNotNull('paid_at');
                }], 'amount')
                ->addSelect([
                    'active_members_count' => AssignStructure::query()
                        ->selectRaw('COUNT(DISTINCT assign_structures.user_id)')
                        ->join('users', 'users.id', '=', 'assign_structures.user_id')
                        ->whereColumn('assign_structures.structure_id', 'init_cotisations.structure_id')
                        ->where('assign_structures.is_active', true)
                        ->where('users.role', 'membre')
                        ->where('users.is_active', true)
                        ->where('users.is_approved', true)
                        ->whereNull('users.deleted_at'),
                ])
                ->firstOrFail();

            return $this->successResponse(
                new InitCotisationResource($initCotisation),
                'Initialisation de cotisation mise à jour avec succès.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la mise à jour de l\'initialisation de cotisation.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Remove the specified init cotisation.
     */
    public function destroy(InitCotisation $initCotisation)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            // Check if init cotisation has linked cotisations
            $hasCotisations = $initCotisation->cotisations()->exists();
            if ($hasCotisations) {
                return $this->errorResponse(
                    'Suppression impossible.',
                    ['error' => 'Impossible de supprimer une initialisation qui a des cotisations liées.'],
                    400
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
                        ['error' => 'Vous devez avoir un statut actif pour supprimer une initialisation de cotisation.'],
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
                        ['error' => 'Vous ne pouvez supprimer que les initialisations de vos structures actives.'],
                        403
                    );
                }
            }

            $initCotisation->delete();

            return $this->successResponse(
                [],
                'Initialisation de cotisation supprimée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la suppression de l\'initialisation de cotisation.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Toggle is_completed status of init cotisation.
     */
    public function toggleCompleted(InitCotisation $initCotisation)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            // Check permissions for 'membre' role
            if ($authUser->role === 'membre') {
                // Check if membre has an active statut
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour modifier le statut d\'une initialisation de cotisation.'],
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
                        ['error' => 'Vous ne pouvez modifier que les initialisations de vos structures actives.'],
                        403
                    );
                }
            }

            $newStatus = !$initCotisation->is_completed;

            $initCotisation->update([
                'is_completed' => $newStatus,
                'updated_by' => Auth::id(),
            ]);

            $initCotisation->load([
                'typeCotisation:id,libelle',
                'structure:id,libelle',
                'cotisations',
                'updatedBy:id,full_name'
            ]);

            $statusMessage = $newStatus ? 'complétée' : 'non complétée';

            return $this->successResponse(
                new InitCotisationResource($initCotisation),
                "Initialisation de cotisation marquée comme {$statusMessage} avec succès."
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors du changement du statut de l\'initialisation de cotisation.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}
