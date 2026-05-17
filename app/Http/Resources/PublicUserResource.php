<?php

namespace App\Http\Resources;

use App\Http\Resources\Settings\AssignStructureResource;
use App\Http\Resources\Settings\AssignStatutResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'code' => $this->code,
            'full_name' => $this->full_name,
            'telephone' => $this->telephone,
            'email' => $this->email,
            'role' => $this->role,
            'avatar_url' => $this->avatar_url,
            'is_approved' => $this->is_approved,
            'is_active' => $this->is_active,
            'assign_structures' => AssignStructureResource::collection($this->whenLoaded('assignStructures')),
            'assign_statuts' => AssignStatutResource::collection($this->whenLoaded('assignStatuts')),
        ];
    }
}

