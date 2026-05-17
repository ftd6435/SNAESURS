<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreAssignStatutRequest;
use App\Http\Requests\Settings\UpdateAssignStatutRequest;
use App\Http\Resources\Settings\AssignStatutResource;
use App\Models\Settings\AssignStatut;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AssignStatutController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $userId = $request->input('user_id');
            $statutId = $request->input('statut_id');
            $isActive = $request->input('is_active');

            $query = AssignStatut::query()
                ->with([
                    'statut:id,libelle',
                    'user:id,full_name,telephone,email,avatar',
                    'parent',
                    'createdBy:id,full_name',
                    'updatedBy:id,full_name'
                ]);

            if ($userId) {
                $query->where('user_id', $userId);
            }

            if ($statutId) {
                $query->where('statut_id', $statutId);
            }

            if ($isActive !== null) {
                $query->where('is_active', $isActive);
            }

            $assignments = $query->latest()->paginate($perPage);

            return $this->successResponse(
                AssignStatutResource::collection($assignments)->response()->getData(true),
                'Liste des affectations de statut récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération des affectations de statut.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function store(StoreAssignStatutRequest $request)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            $validated['created_by'] = Auth::id();
            $validated['date_debut'] = $validated['date_debut'] ?? now();

            // If parent_id is provided, deactivate the parent assignment
            if (isset($validated['parent_id'])) {
                $parentAssignment = AssignStatut::find($validated['parent_id']);
                if ($parentAssignment) {
                    $parentAssignment->update([
                        'is_active' => false,
                        'date_fin' => $validated['date_debut'],
                        'remarks' => 'Prolongation du précédent mandat',
                        'updated_by' => Auth::id(),
                    ]);
                }
            }

            $assignment = AssignStatut::create($validated);

            DB::commit();

            return $this->successResponse(
                new AssignStatutResource($assignment->load([
                    'statut:id,libelle',
                    'user:id,full_name,telephone,email,avatar',
                    'parent',
                    'createdBy:id,full_name'
                ])),
                'Affectation de statut créée avec succès.',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la création de l\'affectation de statut.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function show(AssignStatut $assignStatut)
    {
        try {
            $assignStatut->load([
                'statut:id,libelle',
                'user:id,full_name,telephone,email,avatar',
                'parent',
                'children',
                'createdBy:id,full_name',
                'updatedBy:id,full_name'
            ]);

            return $this->successResponse(
                new AssignStatutResource($assignStatut),
                'Affectation de statut récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération de l\'affectation de statut.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function update(UpdateAssignStatutRequest $request, AssignStatut $assignStatut)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            $validated['updated_by'] = Auth::id();

            $assignStatut->update($validated);

            DB::commit();

            return $this->successResponse(
                new AssignStatutResource($assignStatut->load([
                    'statut:id,libelle',
                    'user:id,full_name,telephone,email,avatar',
                    'parent',
                    'createdBy:id,full_name',
                    'updatedBy:id,full_name'
                ])),
                'Affectation de statut mise à jour avec succès.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la mise à jour de l\'affectation de statut.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function destroy(AssignStatut $assignStatut)
    {
        try {
            $assignStatut->delete();

            return $this->noContentSuccessResponse('Affectation de statut supprimée avec succès.');
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la suppression de l\'affectation de statut.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}
