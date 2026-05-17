<?php

namespace App\Models\Settings;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class Structure extends Model
{
    protected $fillable = [
        'libelle',
        'description',
        'adresse',
        'date_creation',
        'logo',
        'contact',
        'email',
        'is_active',
    ];

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
