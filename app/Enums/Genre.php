<?php

namespace App\Enums;

enum Genre: string
{
    case MASCULIN = 'm';
    case FEMININ = 'f';
    case AUTRE = 'autre';

    /**
     * Get all genre values
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get genre label in French
     */
    public function label(): string
    {
        return match ($this) {
            self::MASCULIN => 'Masculin',
            self::FEMININ => 'Féminin',
            self::AUTRE => 'Autre',
        };
    }
}
