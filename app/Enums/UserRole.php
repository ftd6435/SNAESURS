<?php

namespace App\Enums;

enum UserRole: string
{
    case SUPER_ADMIN = 'super_admin';
    case ADMIN = 'admin';
    case MEMBRE = 'membre';
    case TRESORIER = 'tresorier';
    case SECRETAIRE = 'secretaire';

    /**
     * Get all role values
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Check if role is admin level (super_admin or admin)
     */
    public function isAdmin(): bool
    {
        return in_array($this->value, [self::SUPER_ADMIN->value, self::ADMIN->value]);
    }

    /**
     * Check if role is super admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->value === self::SUPER_ADMIN->value;
    }

    /**
     * Get role label in French
     */
    public function label(): string
    {
        return match($this) {
            self::SUPER_ADMIN => 'Super Administrateur',
            self::ADMIN => 'Administrateur',
            self::MEMBRE => 'Membre',
            self::TRESORIER => 'Trésorier',
            self::SECRETAIRE => 'Secrétaire',
        };
    }
}
