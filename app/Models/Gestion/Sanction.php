<?php

namespace App\Models\Gestion;

use App\Models\Settings\Structure;
use App\Models\Settings\TypeSanction;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sanction extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'type_sanction_id',
        'structure_id',
        'user_id',
        'commentaire',
        'montant',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
    ];

    public function typeSanction(): BelongsTo
    {
        return $this->belongsTo(TypeSanction::class);
    }

    public function structure(): BelongsTo
    {
        return $this->belongsTo(Structure::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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
