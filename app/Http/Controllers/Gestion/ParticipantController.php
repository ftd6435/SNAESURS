<?php

namespace App\Http\Controllers\Gestion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Gestion\UpdateParticipantRequest;
use App\Http\Resources\Gestion\ParticipantResource;
use App\Models\Gestion\Participant;
use App\Models\Settings\AssignStatut;
use App\Models\Settings\AssignStructure;
use App\Models\User;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ParticipantController extends Controller
{
    use ApiResponses;

    /**
     * Display a listing of participants.
     */
    public function index(Request $request)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            // Build query
            $query = Participant::with([
                'reunion.structure:id,libelle',
                'user:id,full_name,telephone,email,avatar'
            ]);

            // If auth user is 'membre', filter by accessible reunions
            if ($authUser->role === 'membre') {
                // Get auth user's active structure IDs
                $structureIds = AssignStructure::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->pluck('structure_id')
                    ->toArray();

                // Filter participants by accessible reunions
                $query->whereHas('reunion', function ($q) use ($structureIds) {
                    $q->where('type', 'generale')
                        ->orWhere(function ($sq) use ($structureIds) {
                            $sq->where('type', 'structure')
                                ->whereIn('structure_id', $structureIds);
                        });
                });
            }

            // Add filters
            if ($request->has('reunion_id')) {
                $query->where('reunion_id', $request->input('reunion_id'));
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->input('user_id'));
            }

            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            // Pagination
            $perPage = $request->input('per_page', 15);
            $participants = $query->latest()->paginate($perPage);

            return $this->successResponse(
                ParticipantResource::collection($participants)->response()->getData(true),
                'Liste des participants récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération des participants.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Display the specified participant.
     */
    public function show(Participant $participant)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            // Check permissions for 'membre' role
            if ($authUser->role === 'membre') {
                $reunion = $participant->reunion;

                if ($reunion->type === 'structure') {
                    $userStructure = AssignStructure::where('user_id', $authUser->id)
                        ->where('structure_id', $reunion->structure_id)
                        ->where('is_active', true)
                        ->exists();

                    if (!$userStructure) {
                        return $this->errorResponse(
                            'Accès refusé.',
                            ['error' => 'Vous ne pouvez consulter que les participants des réunions accessibles.'],
                            403
                        );
                    }
                }
            }

            $participant->load([
                'reunion.structure:id,libelle',
                'user:id,full_name,telephone,email,avatar'
            ]);

            return $this->successResponse(
                new ParticipantResource($participant),
                'Participant récupéré avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération du participant.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Update the specified participant.
     */
    public function update(UpdateParticipantRequest $request, Participant $participant)
    {
        try {
            DB::beginTransaction();

            /**
             * @var User $authUser
             */
            $authUser = Auth::user();
            $validated = $request->validated();

            $reunion = $participant->reunion;

            // Check permissions
            if ($authUser->role === 'membre') {
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                $activeStructureIds = AssignStructure::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->pluck('structure_id')
                    ->toArray();

                $canAccessReunion = $reunion->type === 'generale'
                    || ($reunion->type === 'structure' && in_array($reunion->structure_id, $activeStructureIds));

                if (!$canAccessReunion) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez modifier que les participants des réunions accessibles.'],
                        403
                    );
                }

                if (!$hasActiveStatut) {
                    if ($participant->user_id !== $authUser->id) {
                        return $this->errorResponse(
                            'Accès refusé.',
                            ['error' => 'Vous ne pouvez modifier que votre propre participation.'],
                            403
                        );
                    }

                    if (array_key_exists('status', $validated) && $validated['status'] === 'present') {
                        return $this->errorResponse(
                            'Accès refusé.',
                            ['error' => 'Vous devez avoir un statut actif pour marquer votre présence.'],
                            403
                        );
                    }

                    if (array_key_exists('status', $validated) && $validated['status'] !== 'absent') {
                        return $this->errorResponse(
                            'Accès refusé.',
                            ['error' => 'Vous pouvez uniquement marquer votre absence.'],
                            403
                        );
                    }

                    $validated = array_intersect_key($validated, array_flip(['status', 'comment']));

                    if (!array_key_exists('status', $validated)) {
                        $validated['status'] = 'absent';
                    }
                } else {
                    if ($reunion->type === 'generale') {
                        if ($participant->user_id !== $authUser->id) {
                            return $this->errorResponse(
                                'Accès refusé.',
                                ['error' => 'Vous ne pouvez modifier que votre propre participation.'],
                                403
                            );
                        }

                        if (array_key_exists('status', $validated) && $validated['status'] !== 'absent') {
                            return $this->errorResponse(
                                'Accès refusé.',
                                ['error' => 'Vous pouvez uniquement marquer votre absence.'],
                                403
                            );
                        }

                        $validated = array_intersect_key($validated, array_flip(['status', 'comment']));

                        if (!array_key_exists('status', $validated)) {
                            $validated['status'] = 'absent';
                        }
                    }
                }
            } elseif ($authUser->role === 'admin') {
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour modifier un participant.'],
                        403
                    );
                }
            }

            $participant->update(array_merge($validated, [
                'updated_by' => Auth::id(),
            ]));

            DB::commit();

            // Load relationships for response
            $participant->load([
                'reunion.structure:id,libelle',
                'user:id,full_name,telephone,email,avatar'
            ]);

            return $this->successResponse(
                new ParticipantResource($participant),
                'Participant mis à jour avec succès.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la mise à jour du participant.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Remove the specified participant.
     */
    public function destroy(Participant $participant)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            $reunion = $participant->reunion;

            // Check permissions
            if ($authUser->role === 'membre') {
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour supprimer un participant.'],
                        403
                    );
                }

                if ($reunion->type === 'structure') {
                    $userStructure = AssignStructure::where('user_id', $authUser->id)
                        ->where('structure_id', $reunion->structure_id)
                        ->where('is_active', true)
                        ->exists();

                    if (!$userStructure) {
                        return $this->errorResponse(
                            'Accès refusé.',
                            ['error' => 'Vous ne pouvez supprimer que les participants de vos structures actives.'],
                            403
                        );
                    }
                } else {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez pas supprimer les participants d\'une réunion générale.'],
                        403
                    );
                }
            } elseif ($authUser->role === 'admin') {
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour supprimer un participant.'],
                        403
                    );
                }
            }

            $participant->delete();

            return $this->successResponse(
                [],
                'Participant supprimé avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la suppression du participant.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}
