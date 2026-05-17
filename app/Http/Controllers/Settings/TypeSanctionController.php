<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreTypeSanctionRequest;
use App\Http\Requests\Settings\UpdateTypeSanctionRequest;
use App\Http\Resources\Settings\TypeSanctionResource;
use App\Models\Settings\TypeSanction;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TypeSanctionController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $isActive = $request->input('is_active');

            $query = TypeSanction::query();

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
                TypeSanctionResource::collection($types)->response()->getData(true),
                'Liste des types de sanction récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération des types de sanction.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function store(StoreTypeSanctionRequest $request)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            $validated['created_by'] = Auth::id();

            $typeSanction = TypeSanction::create($validated);

            DB::commit();

            return $this->successResponse(
                new TypeSanctionResource($typeSanction),
                'Type de sanction créé avec succès.',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la création du type de sanction.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function show(TypeSanction $typeSanction)
    {
        try {
            return $this->successResponse(
                new TypeSanctionResource($typeSanction),
                'Type de sanction récupéré avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération du type de sanction.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function update(UpdateTypeSanctionRequest $request, TypeSanction $typeSanction)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            $validated['updated_by'] = Auth::id();

            $typeSanction->update($validated);

            DB::commit();

            return $this->successResponse(
                new TypeSanctionResource($typeSanction),
                'Type de sanction mis à jour avec succès.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la mise à jour du type de sanction.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function destroy(TypeSanction $typeSanction)
    {
        try {
            $typeSanction->delete();

            return $this->noContentSuccessResponse('Type de sanction supprimé avec succès.');
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la suppression du type de sanction.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}
