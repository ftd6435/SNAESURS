<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreStatutRequest;
use App\Http\Requests\Settings\UpdateStatutRequest;
use App\Http\Resources\Settings\StatutResource;
use App\Models\Settings\Statut;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StatutController extends Controller
{
    use ApiResponses;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $isActive = $request->input('is_active');

            $query = Statut::query()
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

            $statuts = $query->latest()->paginate($perPage);

            return $this->successResponse(
                StatutResource::collection($statuts)->response()->getData(true),
                'Liste des statuts récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération des statuts.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreStatutRequest $request)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            $validated['created_by'] = Auth::id();

            $statut = Statut::create($validated);

            DB::commit();

            return $this->successResponse(
                new StatutResource($statut->load(['createdBy:id,full_name'])),
                'Statut créé avec succès.',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la création du statut.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Statut $statut)
    {
        try {
            $statut->load(['createdBy:id,full_name', 'updatedBy:id,full_name']);

            return $this->successResponse(
                new StatutResource($statut),
                'Statut récupéré avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération du statut.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateStatutRequest $request, Statut $statut)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            $validated['updated_by'] = Auth::id();

            $statut->update($validated);

            DB::commit();

            return $this->successResponse(
                new StatutResource($statut->load(['createdBy:id,full_name', 'updatedBy:id,full_name'])),
                'Statut mis à jour avec succès.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la mise à jour du statut.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Statut $statut)
    {
        try {
            $statut->delete();

            return $this->noContentSuccessResponse('Statut supprimé avec succès.');
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la suppression du statut.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}
