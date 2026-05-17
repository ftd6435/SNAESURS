<?php

namespace App\Http\Resources\Gestion;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReunionResource extends JsonResource
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
            'type' => $this->type,
            'structure_id' => $this->structure_id,
            'libelle' => $this->libelle,
            'description' => $this->description,
            'date_reunion' => $this->date_reunion?->toISOString(),
            'heure_debut' => $this->heure_debut,
            'heure_fin' => $this->heure_fin,
            'lieu' => $this->lieu,
            'points_reunion' => $this->points_reunion,
            'proces_verbal' => $this->proces_verbal,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),

            // Relationships
            'structure' => $this->whenLoaded('structure', function () {
                return [
                    'id' => $this->structure->id,
                    'libelle' => $this->structure->libelle,
                ];
            }),
            'participants' => ParticipantResource::collection($this->whenLoaded('participants')),
        ];
    }
}
