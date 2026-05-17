<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreTypeCotisationRequest;
use App\Http\Requests\Settings\UpdateTypeCotisationRequest;
use App\Http\Resources\Settings\TypeCotisationResource;
use App\Models\Settings\TypeCotisation;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TypeCotisationController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $isActive = $request->input('is_active');

            $query = TypeCotisation::query()
                ->with(['createdBy:id,full_name', 'updatedBy:id,full_name']);

            if ($search) {
                $query->where('libelle', 'like', "%{$search}%");
            }

            if ($request->has('is_active')) {
                $rawIsActive = $request->input('is_active');
                $boolIsActive = filter_var($rawIsActive, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

                if ($boolIsActive === null && is_numeric($rawIsActive)) {
                    $boolIsActive = ((int) $rawIsActive) === 1;
                }

                if ($boolIsActive !== null) {
                    $query->where('is_active', $boolIsActive);
                }
            }

            $types = $query->latest()->paginate($perPage);

            return $this->successResponse(
                TypeCotisationResource::collection($types)->response()->getData(true),
                'Liste des types de cotisation récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération des types de cotisation.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function store(StoreTypeCotisationRequest $request)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            $validated['created_by'] = Auth::id();

            $typeCotisation = TypeCotisation::create($validated);

            DB::commit();

            return $this->successResponse(
                new TypeCotisationResource($typeCotisation->load(['createdBy:id,full_name'])),
                'Type de cotisation créé avec succès.',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la création du type de cotisation.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function show(TypeCotisation $typeCotisation)
    {
        try {
            $typeCotisation->load(['createdBy:id,full_name', 'updatedBy:id,full_name']);

            return $this->successResponse(
                new TypeCotisationResource($typeCotisation),
                'Type de cotisation récupéré avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération du type de cotisation.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function update(UpdateTypeCotisationRequest $request, TypeCotisation $typeCotisation)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            $validated['updated_by'] = Auth::id();

            $typeCotisation->update($validated);

            DB::commit();

            return $this->successResponse(
                new TypeCotisationResource($typeCotisation->load(['createdBy:id,full_name', 'updatedBy:id,full_name'])),
                'Type de cotisation mis à jour avec succès.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la mise à jour du type de cotisation.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function destroy(TypeCotisation $typeCotisation)
    {
        try {
            $typeCotisation->delete();

            return $this->noContentSuccessResponse('Type de cotisation supprimé avec succès.');
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la suppression du type de cotisation.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}
