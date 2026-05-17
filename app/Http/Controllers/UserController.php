<?php

namespace App\Http\Controllers;

use App\Events\SendMessageEvent;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\PublicUserResource;
use App\Http\Resources\UserResource;
use App\Models\Gestion\Cotisation;
use App\Models\Gestion\InitCotisation;
use App\Models\Settings\AssignStatut;
use App\Models\Settings\AssignStructure;
use App\Models\User;
use App\Traits\ApiResponses;
use App\Traits\CloudflareUpload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    use ApiResponses, CloudflareUpload;

    /**
     * Display a listing of users.
     */
    public function index(Request $request)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            $light = $request->boolean('light');

            // Build query based on auth user's role
            $query = User::query();

            if ($light) {
                $query->select([
                    'id',
                    'code',
                    'full_name',
                    'telephone',
                    'email',
                    'role',
                    'avatar',
                    'is_approved',
                    'is_active',
                    'created_at',
                    'updated_at',
                ]);
            } else {
                $query->with([
                    'assignStructures.structure:id,libelle',
                    'assignStatuts.statut:id,libelle',
                    'createdBy:id,full_name',
                    'updatedBy:id,full_name'
                ]);
            }

            // If auth user is 'membre', filter by structure
            if ($authUser->role === 'membre') {
                // Check if user has an active statut
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour consulter les utilisateurs.'],
                        403
                    );
                }

                // Get auth user's active structure IDs
                $structureIds = AssignStructure::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->pluck('structure_id')
                    ->toArray();

                // Filter users by same structures
                $query->whereHas('assignStructures', function ($q) use ($structureIds) {
                    $q->whereIn('structure_id', $structureIds)
                        ->where('is_active', true);
                });
            }

            if ($request->has('init_cotisation_id')) {
                $initCotisation = InitCotisation::query()
                    ->select(['id', 'structure_id', 'montant'])
                    ->findOrFail((int) $request->input('init_cotisation_id'));

                $query->where('role', 'membre')
                    ->where('is_active', true)
                    ->where('is_approved', true)
                    ->whereHas('assignStructures', function ($q) use ($initCotisation) {
                        $q->where('structure_id', $initCotisation->structure_id)
                            ->where('is_active', true);
                    });

                $paidSub = Cotisation::query()
                    ->selectRaw('COALESCE(SUM(amount),0)')
                    ->whereColumn('user_id', 'users.id')
                    ->where('init_cotisation_id', $initCotisation->id);

                $query->whereRaw('(' . $paidSub->toSql() . ') < ?', array_merge($paidSub->getBindings(), [(float) $initCotisation->montant]));
            } elseif ($request->has('structure_id')) {
                $structureId = (int) $request->input('structure_id');
                $query->whereHas('assignStructures', function ($q) use ($structureId) {
                    $q->where('structure_id', $structureId)
                        ->where('is_active', true);
                });
            }

            // Add search functionality
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                        ->orWhere('telephone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Add role filter
            if ($request->has('role')) {
                $query->where('role', $request->input('role'));
            }

            // Add status filters
            if ($request->has('is_approved')) {
                $query->where('is_approved', $request->boolean('is_approved'));
            }

            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            // Pagination
            $perPage = $request->input('per_page', 15);
            $users = $query->latest()->paginate($perPage);

            return $this->successResponse(
                UserResource::collection($users)->response()->getData(true),
                'Liste des utilisateurs récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération des utilisateurs.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(StoreUserRequest $request)
    {
        try {
            DB::beginTransaction();

            /**
             * @var User $authUser
             */
            $authUser = Auth::user();
            $validated = $request->validated();

            // Enforce structure assignment rules based on auth user's role
            if ($authUser->role === 'membre') {
                // Check if membre has an active statut
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour créer des utilisateurs.'],
                        403
                    );
                }

                // Force structure_id to be auth user's active structure
                $authUserStructure = AssignStructure::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->first();

                if (!$authUserStructure) {
                    return $this->errorResponse(
                        'Erreur.',
                        ['error' => 'Vous devez appartenir à une structure active pour créer des utilisateurs.'],
                        400
                    );
                }

                // Override the structure_id with auth user's structure
                $validated['structure_id'] = $authUserStructure->structure_id;
                // Members can only create new members, and cannot self-approve at creation time
                $validated['role'] = 'membre';
                $validated['is_approved'] = true;
                $validated['approved_at'] = now();
                unset($validated['approved_at']);
            } elseif (!in_array($authUser->role, ['super_admin', 'admin'])) {
                // Only super_admin and admin can create users with different structures
                return $this->errorResponse(
                    'Accès refusé.',
                    ['error' => 'Vous n\'avez pas les permissions nécessaires pour créer des utilisateurs.'],
                    403
                );
            }

            // Handle avatar upload if provided
            $avatarFilename = null;
            if ($request->hasFile('avatar')) {
                $avatarFilename = $this->uploadImage($request->file('avatar'), 'profile-photos');
            }

            // Create the user
            $user = User::create([
                'code' => $validated['code'] ?? null,
                'full_name' => $validated['full_name'],
                'telephone' => $validated['telephone'],
                'email' => $validated['email'] ?? null,
                'adresse' => $validated['adresse'] ?? null,
                'genre' => $validated['genre'] ?? 'autre',
                'date_naissance' => $validated['date_naissance'] ?? null,
                'person_a_contacter' => $validated['person_a_contacter'] ?? null,
                'phone_person_a_contacter' => $validated['phone_person_a_contacter'] ?? null,
                'avatar' => $avatarFilename,
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'] ?? 'membre',
                'is_approved' => $validated['is_approved'] ?? false,
                'is_active' => $validated['is_active'] ?? true,
                'approved_at' => isset($validated['is_approved']) && $validated['is_approved'] ? now() : null,
                'created_by' => Auth::id(),
            ]);

            // Assign structure (required)
            AssignStructure::create([
                'structure_id' => $validated['structure_id'],
                'user_id' => $user->id,
                'assigned_at' => $validated['assigned_at'] ?? now(),
                'frais_integration' => $validated['frais_integration'] ?? 0,
                'is_active' => true,
                'created_by' => Auth::id(),
            ]);

            // Assign statut if provided (optional)
            if (isset($validated['statut_id'])) {
                AssignStatut::create([
                    'statut_id' => $validated['statut_id'],
                    'user_id' => $user->id,
                    'date_debut' => $validated['date_debut'] ?? now(),
                    'date_fin' => $validated['date_fin'] ?? null,
                    'is_active' => true,
                    'created_by' => Auth::id(),
                ]);
            }

            DB::commit();

            // Send a message to the user about their account creation
            SendMessageEvent::dispatch($user->telephone, "Bonjour {$user->full_name} ! \n\nVotre compte a été créé avec succès.\nTEL: {$user->telephone}\nMPD : {$validated['password']} \nVeuillez le changer dès votre première connexion.");

            // Load relationships for response
            $user->load([
                'assignStructures.structure:id,libelle',
                'assignStatuts.statut:id,libelle',
                'createdBy:id,full_name'
            ]);

            return $this->successResponse(
                new UserResource($user),
                'Utilisateur créé avec succès.',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la création de l\'utilisateur.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Approve a user.
     */
    public function approve(User $user)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            if ($authUser->role === 'membre') {
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour approuver un membre.'],
                        403
                    );
                }

                $authUserStructureId = AssignStructure::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->value('structure_id');

                if (!$authUserStructureId) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez appartenir à une structure active pour approuver un membre.'],
                        403
                    );
                }

                $sameStructure = AssignStructure::where('user_id', $user->id)
                    ->where('structure_id', $authUserStructureId)
                    ->where('is_active', true)
                    ->exists();

                if (!$sameStructure || $user->role !== 'membre') {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez approuver que les membres de votre structure.'],
                        403
                    );
                }
            }

            if ($user->is_approved) {
                return $this->errorResponse(
                    'Cet utilisateur est déjà approuvé.',
                    [],
                    400
                );
            }

            $user->update([
                'is_approved' => true,
                'approved_at' => now(),
                'updated_by' => Auth::id(),
            ]);

            $user->load([
                'assignStructures.structure:id,libelle',
                'assignStatuts.statut:id,libelle',
                'updatedBy:id,full_name'
            ]);

            return $this->successResponse(
                new UserResource($user),
                'Utilisateur approuvé avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de l\'approbation de l\'utilisateur.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Toggle user active/inactive status.
     */
    public function toggleActive(User $user)
    {
        try {
            $newStatus = !$user->is_active;

            $user->update([
                'is_active' => $newStatus,
                'updated_by' => Auth::id(),
            ]);

            $user->load([
                'assignStructures.structure:id,libelle',
                'assignStatuts.statut:id,libelle',
                'updatedBy:id,full_name'
            ]);

            $statusMessage = $newStatus ? 'activé' : 'désactivé';

            return $this->successResponse(
                new UserResource($user),
                "Utilisateur {$statusMessage} avec succès."
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors du changement du statut de l\'utilisateur.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Update authenticated user's profile.
     */
    public function updateProfile(UpdateProfileRequest $request)
    {
        try {
            DB::beginTransaction();

            /**
             * @var User $user
             */
            $user = Auth::user();
            $validated = $request->validated();

            // Handle avatar upload if provided
            if ($request->hasFile('avatar')) {
                // Delete old avatar if exists
                if ($user->avatar) {
                    $this->deleteImage($user->avatar, 'profile-photos');
                }
                $validated['avatar'] = $this->uploadImage($request->file('avatar'), 'profile-photos');
            }

            // Update user profile
            $user->update($validated);

            DB::commit();

            // Load relationships for response
            $user->load([
                'assignStructures.structure:id,libelle',
                'assignStatuts.statut:id,libelle'
            ]);

            return $this->successResponse(
                new UserResource($user),
                'Profil mis à jour avec succès.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la mise à jour du profil.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Change authenticated user's password.
     */
    public function changePassword(ChangePasswordRequest $request)
    {
        try {
            /**
             * @var User $user
             */
            $user = Auth::user();
            $validated = $request->validated();

            // Verify current password
            if (!Hash::check($validated['current_password'], $user->password)) {
                return $this->errorResponse(
                    'Mot de passe actuel incorrect.',
                    ['current_password' => 'Le mot de passe actuel est incorrect.'],
                    422
                );
            }

            // Update password
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);

            return $this->successResponse(
                [],
                'Mot de passe modifié avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors du changement du mot de passe.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Get users ready for badge printing.
     */
    public function badgeUsers(Request $request)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            if ($authUser->role !== 'super_admin') {
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour accéder aux badges.'],
                        403
                    );
                }

                if (!in_array($authUser->role, ['admin', 'membre'])) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous n\'avez pas les permissions nécessaires pour accéder aux badges.'],
                        403
                    );
                }
            }

            $query = User::query()
                ->with([
                    'assignStructures.structure:id,libelle',
                    'assignStatuts.statut:id,libelle',
                ])
                ->where('is_active', true)
                ->whereNotNull('code');

            if ($authUser->role === 'membre') {
                $structureIds = AssignStructure::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->pluck('structure_id')
                    ->toArray();

                if (count($structureIds) === 0) {
                    $query->whereRaw('1 = 0');
                } else {
                    $query->whereHas('assignStructures', function ($q) use ($structureIds) {
                        $q->where('is_active', true)->whereIn('structure_id', $structureIds);
                    });
                }
            }

            $query->where(function ($q) {
                $q->where('role', '!=', 'membre')
                    ->orWhere('is_approved', true);
            });

            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                        ->orWhere('telephone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            }

            $perPage = $request->input('per_page', 200);
            $users = $query->latest()->paginate($perPage);

            return $this->successResponse(
                UserResource::collection($users)->response()->getData(true),
                'Liste des utilisateurs récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération des utilisateurs.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Public user profile by code (for badge authenticity).
     */
    public function publicShowByCode(string $code)
    {
        try {
            $user = User::query()
                ->with([
                    'assignStructures.structure:id,libelle',
                    'assignStatuts.statut:id,libelle',
                ])
                ->where('code', $code)
                ->first();

            if (!$user) {
                return $this->errorResponse(
                    'Utilisateur introuvable.',
                    [],
                    404
                );
            }

            return $this->successResponse(
                new PublicUserResource($user),
                'Profil récupéré avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération du profil.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}
