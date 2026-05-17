<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreAssignStructureRequest;
use App\Http\Requests\Settings\UpdateAssignStructureRequest;
use App\Http\Resources\Settings\AssignStructureResource;
use App\Models\Settings\AssignStructure;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AssignStructureController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $userId = $request->input('user_id');
            $structureId = $request->input('structure_id');
            $isActive = $request->input('is_active');

            $query = AssignStructure::query()
                ->with([
                    'structure:id,libelle',
                    'user:id,full_name,telephone,email,avatar',
                    'createdBy:id,full_name',
                    'updatedBy:id,full_name'
                ]);

            if ($userId) {
                $query->where('user_id', $userId);
            }

            if ($structureId) {
                $query->where('structure_id', $structureId);
            }

            if ($isActive !== null) {
                $query->where('is_active', $isActive);
            }

            $assignments = $query->latest()->paginate($perPage);

            return $this->successResponse(
                AssignStructureResource::collection($assignments)->response()->getData(true),
                'Liste des affectations de structure récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération des affectations de structure.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function store(StoreAssignStructureRequest $request)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            $validated['created_by'] = Auth::id();
            $validated['assigned_at'] = $validated['assigned_at'] ?? now();

            // Check if user already has an active assignment
            $existingActiveAssignment = AssignStructure::where('user_id', $validated['user_id'])
                ->where('is_active', true)
                ->first();

            if ($existingActiveAssignment) {
                return $this->errorResponse(
                    'Affectation impossible.',
                    ['user_id' => 'Cet utilisateur a déjà une affectation active.'],
                    422
                );
            }

            $assignment = AssignStructure::create($validated);

            DB::commit();

            return $this->successResponse(
                new AssignStructureResource($assignment->load([
                    'structure:id,libelle',
                    'user:id,full_name,telephone,email,avatar',
                    'createdBy:id,full_name'
                ])),
                'Affectation de structure créée avec succès.',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la création de l\'affectation de structure.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function show(AssignStructure $assignStructure)
    {
        try {
            $assignStructure->load([
                'structure:id,libelle',
                'user:id,full_name,telephone,email,avatar',
                'createdBy:id,full_name',
                'updatedBy:id,full_name'
            ]);

            return $this->successResponse(
                new AssignStructureResource($assignStructure),
                'Affectation de structure récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération de l\'affectation de structure.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function update(UpdateAssignStructureRequest $request, AssignStructure $assignStructure)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            $validated['updated_by'] = Auth::id();

            // If marking as inactive, ensure unassigned_at is set
            if (isset($validated['is_active']) && !$validated['is_active'] && !isset($validated['unassigned_at'])) {
                $validated['unassigned_at'] = now();
            }

            $assignStructure->update($validated);

            DB::commit();

            return $this->successResponse(
                new AssignStructureResource($assignStructure->load([
                    'structure:id,libelle',
                    'user:id,full_name,telephone,email,avatar',
                    'createdBy:id,full_name',
                    'updatedBy:id,full_name'
                ])),
                'Affectation de structure mise à jour avec succès.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la mise à jour de l\'affectation de structure.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function destroy(AssignStructure $assignStructure)
    {
        try {
            $assignStructure->delete();

            return $this->noContentSuccessResponse('Affectation de structure supprimée avec succès.');
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la suppression de l\'affectation de structure.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}
