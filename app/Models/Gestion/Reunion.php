<?php

namespace App\Models\Gestion;

use App\Models\Settings\Structure;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reunion extends Model
{
    protected $fillable = [
        'type',
        'structure_id',
        'libelle',
        'description',
        'proces_verbal',
        'date_reunion',
        'heure_debut',
        'heure_fin',
        'lieu',
        'points_reunion',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date_reunion' => 'date',
        'points_reunion' => 'array',
        'proces_verbal' => 'array',
    ];

    public function participants(): HasMany
    {
        return $this->hasMany(Participant::class);
    }

    public function structure(): BelongsTo
    {
        return $this->belongsTo(Structure::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
