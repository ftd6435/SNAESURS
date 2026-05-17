<?php

namespace App\Models\Settings;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AssignStatut extends Model
{
    protected $fillable = [
        'statut_id',
        'user_id',
        'date_debut',
        'date_fin',
        'remarks',
        'parent_id',
        'is_active',
        'created_by',
        'updated_by',
    ];

    public function statut()
    {
        return $this->belongsTo(Statut::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(AssignStatut::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(AssignStatut::class, 'parent_id');
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
