<?php

namespace App\Enums;

enum ParticipantStatus: string
{
    case PENDING = 'pending';
    case PRESENT = 'present';
    case ABSENT = 'absent';

    /**
     * Get all status values
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get status label in French
     */
    public function label(): string
    {
        return match($this) {
            self::PENDING => 'En attente',
            self::PRESENT => 'Présent',
            self::ABSENT => 'Absent',
        };
    }
}
