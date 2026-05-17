<?php

namespace App\Services;

use App\Models\Settings\AssignStatut;
use App\Models\Settings\AssignStructure;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class PermissionService
{
    /**
     * Check if user has an active statut
     */
    public function hasActiveStatut(User $user): bool
    {
        return AssignStatut::where('user_id', $user->id)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Get user's active structure IDs
     */
    public function getUserActiveStructureIds(User $user): array
    {
        return AssignStructure::where('user_id', $user->id)
            ->where('is_active', true)
            ->pluck('structure_id')
            ->toArray();
    }

    /**
     * Get user's active structures
     */
    public function getUserActiveStructures(User $user): Collection
    {
        return AssignStructure::where('user_id', $user->id)
            ->where('is_active', true)
            ->with('structure')
            ->get();
    }

    /**
     * Check if user can access a structure
     */
    public function canAccessStructure(User $user, int $structureId): bool
    {
        // Super admin can access all structures
        if ($user->role === 'super_admin') {
            return true;
        }

        // Admin with active statut can access all structures
        if ($user->role === 'admin' && $this->hasActiveStatut($user)) {
            return true;
        }

        // Check if structure is in user's active structures
        return in_array($structureId, $this->getUserActiveStructureIds($user));
    }

    /**
     * Check if user requires active statut for operations
     */
    public function requiresActiveStatut(User $user): bool
    {
        return in_array($user->role, ['membre', 'admin', 'tresorier', 'secretaire']);
    }

    /**
     * Validate user can perform operation
     */
    public function validateOperation(User $user, ?int $structureId = null): array
    {
        // Super admin has no restrictions
        if ($user->role === 'super_admin') {
            return ['allowed' => true];
        }

        // Check if role requires active statut
        if ($this->requiresActiveStatut($user) && !$this->hasActiveStatut($user)) {
            return [
                'allowed' => false,
                'message' => 'Vous devez avoir un statut actif pour effectuer cette opération.'
            ];
        }

        // If structure is specified, check access
        if ($structureId !== null && !$this->canAccessStructure($user, $structureId)) {
            return [
                'allowed' => false,
                'message' => 'Vous n\'avez pas accès à cette structure.'
            ];
        }

        return ['allowed' => true];
    }

    /**
     * Check if user can approve other users
     */
    public function canApproveUsers(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'admin']);
    }

    /**
     * Check if user can manage settings
     */
    public function canManageSettings(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'admin']);
    }

    /**
     * Check if user can create users
     */
    public function canCreateUsers(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'admin']);
    }

    /**
     * Check if user can change role
     */
    public function canChangeRole(User $user): bool
    {
        return $user->role === 'super_admin';
    }
}
