<?php

namespace App\Models\Settings;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AssignStructure extends Model
{
    protected $fillable = [
        'structure_id',
        'user_id',
        'assigned_at',
        'unassigned_at',
        'remarks',
        'frais_integration',
        'is_active',
        'created_by',
        'updated_by',
    ];

    public function structure()
    {
        return $this->belongsTo(Structure::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
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
