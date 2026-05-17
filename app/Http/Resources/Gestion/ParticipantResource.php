<?php

namespace App\Http\Resources\Gestion;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParticipantResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reunion_id' => $this->reunion_id,
            'user_id' => $this->user_id,
            'status' => $this->status,
            'comment' => $this->comment,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relationships
            'reunion' => $this->whenLoaded('reunion', function () {
                return [
                    'id' => $this->reunion->id,
                    'libelle' => $this->reunion->libelle,
                    'type' => $this->reunion->type,
                    'date_reunion' => $this->reunion->date_reunion?->format('d-m-Y'),
                    'status' => $this->reunion->status,
                ];
            }),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'full_name' => $this->user->full_name,
                    'telephone' => $this->user->telephone,
                    'email' => $this->user->email,
                    'avatar_url' => $this->user->avatar_url,
                ];
            }),
        ];
    }
}
