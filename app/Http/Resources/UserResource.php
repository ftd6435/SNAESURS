<?php

namespace App\Http\Resources;

use App\Http\Resources\Settings\AssignStructureResource;
use App\Http\Resources\Settings\AssignStatutResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'code' => $this->code,
            'full_name' => $this->full_name,
            'telephone' => $this->telephone,
            'email' => $this->email,
            'adresse' => $this->adresse,
            'genre' => $this->genre,
            'date_naissance' => $this->date_naissance?->format('d-m-Y'),
            'approved_at' => $this->approved_at?->format('d-m-Y'),
            'person_a_contacter' => $this->person_a_contacter,
            'phone_person_a_contacter' => $this->phone_person_a_contacter,
            'role' => $this->role,
            'avatar' => $this->avatar,
            'avatar_url' => $this->avatar_url,
            'is_approved' => $this->is_approved,
            'is_active' => $this->is_active,
            'email_verified_at' => $this->email_verified_at?->format('d-m-Y H:i:s'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relationships
            'assign_structures' => AssignStructureResource::collection($this->whenLoaded('assignStructures')),
            'assign_statuts' => AssignStatutResource::collection($this->whenLoaded('assignStatuts')),
            'created_by' => new UserResource($this->whenLoaded('createdBy')),
            'updated_by' => new UserResource($this->whenLoaded('updatedBy')),
        ];
    }
}
