<?php

namespace App\Models\Gestion;

use App\Models\Settings\Structure;
use App\Models\Settings\TypeDepense;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Depense extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'type_depense_id',
        'structure_id',
        'commentaire',
        'montant',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
    ];

    public function typeDepense(): BelongsTo
    {
        return $this->belongsTo(TypeDepense::class);
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
