<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Models\Gestion\Cotisation;
use App\Traits\CloudflareUpload;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, CloudflareUpload;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'full_name',
        'telephone',
        'adresse',
        'genre',
        'date_naissance',
        'approved_at',
        'person_a_contacter',
        'phone_person_a_contacter',
        'role',
        'avatar',
        'is_approved',
        'is_active',
        'email',
        'password',
        'created_by',
        'updated_by',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_naissance' => 'date',
            'approved_at' => 'datetime',
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    protected $appends = [
        'avatar_url',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $user) {
            if (filled($user->code)) return;
            $user->code = self::generateUniqueCode();
        });
    }

    public static function generateUniqueCode(): string
    {
        for ($attempt = 0; $attempt < 25; $attempt++) {
            $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            if (!self::where('code', $code)->exists()) return $code;
        }

        throw new \RuntimeException('Impossible de générer un code unique.');
    }

    /**
     * Get the profile photo URL attribute.
     */
    public function getAvatarUrlAttribute(): ?string
    {
        if ($this->avatar) {
            return $this->getImageUrl($this->avatar, 'profile-photos');
        }
        // Return default avatar
        return $this->defaultProfilePhotoUrl();
    }

    /**
     * Get the default profile photo URL.
     */
    protected function defaultProfilePhotoUrl(): string
    {
        $name = trim(collect(explode(' ', $this->full_name))->map(function ($segment) {
            return mb_substr($segment, 0, 1);
        })->join(' '));

        return 'https://ui-avatars.com/api/?name=' . urlencode($name) . '&color=7F9CF5&background=EBF4FF';
    }

    /**
     * Get the user's structure assignments.
     */
    public function assignStructures()
    {
        return $this->hasMany(\App\Models\Settings\AssignStructure::class, 'user_id');
    }

    /**
     * Get the user's statut assignments.
     */
    public function assignStatuts()
    {
        return $this->hasMany(\App\Models\Settings\AssignStatut::class, 'user_id');
    }

    public function cotisations()
    {
        return $this->hasMany(Cotisation::class, 'user_id');
    }

    public function participations()
    {
        return $this->hasMany(\App\Models\Gestion\Participant::class, 'user_id');
    }

    /**
     * Get the user who created this user.
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated this user.
     */
    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
