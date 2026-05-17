<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreTypeDepenseRequest;
use App\Http\Requests\Settings\UpdateTypeDepenseRequest;
use App\Http\Resources\Settings\TypeDepenseResource;
use App\Models\Settings\TypeDepense;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TypeDepenseController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $isActive = $request->input('is_active');

            $query = TypeDepense::query()
                ->with(['createdBy:id,full_name', 'updatedBy:id,full_name']);

            if ($search) {
                $query->where('libelle', 'like', "%{$search}%");
            }

            if ($isActive !== null) {
                $normalizedIsActive = $isActive;
                if (is_string($normalizedIsActive)) {
                    $normalizedIsActive = filter_var($normalizedIsActive, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                    if ($normalizedIsActive === null && is_numeric($isActive)) {
                        $normalizedIsActive = ((int) $isActive) === 1;
                    }
                }

                if ($normalizedIsActive === null) {
                    return $this->errorResponse(
                        'Validation échouée.',
                        ['is_active' => 'Le champ is_active doit être un booléen.'],
                        422
                    );
                }

                $query->where('is_active', (bool) $normalizedIsActive);
            }

            $types = $query->latest()->paginate($perPage);

            return $this->successResponse(
                TypeDepenseResource::collection($types)->response()->getData(true),
                'Liste des types de dépense récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération des types de dépense.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function store(StoreTypeDepenseRequest $request)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            $validated['created_by'] = Auth::id();

            $typeDepense = TypeDepense::create($validated);

            DB::commit();

            return $this->successResponse(
                new TypeDepenseResource($typeDepense->load(['createdBy:id,full_name'])),
                'Type de dépense créé avec succès.',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la création du type de dépense.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function show(TypeDepense $typeDepense)
    {
        try {
            $typeDepense->load(['createdBy:id,full_name', 'updatedBy:id,full_name']);

            return $this->successResponse(
                new TypeDepenseResource($typeDepense),
                'Type de dépense récupéré avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération du type de dépense.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function update(UpdateTypeDepenseRequest $request, TypeDepense $typeDepense)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            $validated['updated_by'] = Auth::id();

            $typeDepense->update($validated);

            DB::commit();

            return $this->successResponse(
                new TypeDepenseResource($typeDepense->load(['createdBy:id,full_name', 'updatedBy:id,full_name'])),
                'Type de dépense mis à jour avec succès.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la mise à jour du type de dépense.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function destroy(TypeDepense $typeDepense)
    {
        try {
            $typeDepense->delete();

            return $this->noContentSuccessResponse('Type de dépense supprimé avec succès.');
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la suppression du type de dépense.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}
