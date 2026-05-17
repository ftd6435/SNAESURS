<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreTypeDonRequest;
use App\Http\Requests\Settings\UpdateTypeDonRequest;
use App\Http\Resources\Settings\TypeDonResource;
use App\Models\Settings\TypeDon;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TypeDonController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $isOpen = $request->input('is_open');

            $query = TypeDon::query();

            if ($search) {
                $query->where('libelle', 'like', "%{$search}%");
            }

            if ($isOpen !== null) {
                $normalizedIsOpen = $isOpen;
                if (is_string($normalizedIsOpen)) {
                    $normalizedIsOpen = filter_var($normalizedIsOpen, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                    if ($normalizedIsOpen === null && is_numeric($isOpen)) {
                        $normalizedIsOpen = ((int) $isOpen) === 1;
                    }
                }

                if ($normalizedIsOpen === null) {
                    return $this->errorResponse(
                        'Validation échouée.',
                        ['is_open' => 'Le champ is_open doit être un booléen.'],
                        422
                    );
                }

                $query->where('is_open', (bool) $normalizedIsOpen);
            }

            $types = $query->latest()->paginate($perPage);

            return $this->successResponse(
                TypeDonResource::collection($types)->response()->getData(true),
                'Liste des types de don récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération des types de don.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function store(StoreTypeDonRequest $request)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            $validated['created_by'] = Auth::id();

            $typeDon = TypeDon::create($validated);

            DB::commit();

            return $this->successResponse(
                new TypeDonResource($typeDon),
                'Type de don créé avec succès.',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la création du type de don.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function show(TypeDon $typeDon)
    {
        try {
            return $this->successResponse(
                new TypeDonResource($typeDon),
                'Type de don récupéré avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération du type de don.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function update(UpdateTypeDonRequest $request, TypeDon $typeDon)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            $validated['updated_by'] = Auth::id();

            $typeDon->update($validated);

            DB::commit();

            return $this->successResponse(
                new TypeDonResource($typeDon),
                'Type de don mis à jour avec succès.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la mise à jour du type de don.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function destroy(TypeDon $typeDon)
    {
        try {
            $typeDon->delete();

            return $this->noContentSuccessResponse('Type de don supprimé avec succès.');
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la suppression du type de don.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}
