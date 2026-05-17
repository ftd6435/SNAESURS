<?php

namespace App\Models\Gestion;

use App\Models\Settings\Structure;
use App\Models\Settings\TypeCotisation;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class InitCotisation extends Model
{
    protected $fillable = [
        'type_cotisation_id',
        'structure_id',
        'libelle',
        'description',
        'montant',
        'date_limite',
        'is_completed',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'montant' => 'decimal:2',
        'date_limite' => 'date',
    ];

    public function typeCotisation()
    {
        return $this->belongsTo(TypeCotisation::class);
    }

    public function structure()
    {
        return $this->belongsTo(Structure::class);
    }

    public function cotisations()
    {
        return $this->hasMany(Cotisation::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
