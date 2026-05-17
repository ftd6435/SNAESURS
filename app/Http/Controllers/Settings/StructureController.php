<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreStructureRequest;
use App\Http\Requests\Settings\UpdateStructureRequest;
use App\Http\Resources\Settings\StructureResource;
use App\Models\Settings\Structure;
use App\Traits\ApiResponses;
use App\Traits\CloudflareUpload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StructureController extends Controller
{
    use ApiResponses, CloudflareUpload;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $isActive = $request->input('is_active');

            $query = Structure::query()
                ->with(['createdBy:id,full_name', 'updatedBy:id,full_name']);

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('libelle', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('contact', 'like', "%{$search}%");
                });
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

            $structures = $query->latest()->paginate($perPage);

            return $this->successResponse(
                StructureResource::collection($structures)->response()->getData(true),
                'Liste des structures récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération des structures.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreStructureRequest $request)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Handle logo upload if provided
            if ($request->hasFile('logo')) {
                $validated['logo'] = $this->uploadImage($request->file('logo'), 'structures');
            }

            $validated['created_by'] = Auth::id();
            $validated['date_creation'] = $validated['date_creation'] ?? now();

            $structure = Structure::create($validated);

            DB::commit();

            return $this->successResponse(
                new StructureResource($structure->load(['createdBy:id,full_name'])),
                'Structure créée avec succès.',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la création de la structure.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Structure $structure)
    {
        try {
            $structure->load(['createdBy:id,full_name', 'updatedBy:id,full_name']);

            return $this->successResponse(
                new StructureResource($structure),
                'Structure récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération de la structure.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateStructureRequest $request, Structure $structure)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Handle logo upload if provided
            if ($request->hasFile('logo')) {
                // Delete old logo if exists
                if ($structure->logo) {
                    $this->deleteImage($structure->logo, 'structures');
                }
                $validated['logo'] = $this->uploadImage($request->file('logo'), 'structures');
            }

            $validated['updated_by'] = Auth::id();

            $structure->update($validated);

            DB::commit();

            return $this->successResponse(
                new StructureResource($structure->load(['createdBy:id,full_name', 'updatedBy:id,full_name'])),
                'Structure mise à jour avec succès.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la mise à jour de la structure.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Structure $structure)
    {
        try {
            DB::beginTransaction();

            // Delete logo if exists
            if ($structure->logo) {
                $this->deleteImage($structure->logo, 'structures');
            }

            $structure->delete();

            DB::commit();

            return $this->noContentSuccessResponse('Structure supprimée avec succès.');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la suppression de la structure.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}
