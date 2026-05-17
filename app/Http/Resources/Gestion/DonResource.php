<?php

namespace App\Http\Resources\Gestion;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DonResource extends JsonResource
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
            'type_don_id' => $this->type_don_id,
            'structure_id' => $this->structure_id,
            'user_id' => $this->user_id,
            'montant' => $this->montant,
            'commentaire' => $this->commentaire,
            'deleted_at' => $this->deleted_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relationships
            'type_don' => $this->whenLoaded('typeDon', function () {
                return [
                    'id' => $this->typeDon->id,
                    'libelle' => $this->typeDon->libelle,
                ];
            }),
            'structure' => $this->whenLoaded('structure', function () {
                return [
                    'id' => $this->structure->id,
                    'libelle' => $this->structure->libelle,
                ];
            }),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'full_name' => $this->user->full_name,
                    'telephone' => $this->user->telephone,
                    'email' => $this->user->email,
                ];
            }),
            'created_by' => $this->whenLoaded('createdBy', function () {
                return [
                    'id' => $this->createdBy->id,
                    'full_name' => $this->createdBy->full_name,
                ];
            }),
            'updated_by' => $this->whenLoaded('updatedBy', function () {
                return [
                    'id' => $this->updatedBy->id,
                    'full_name' => $this->updatedBy->full_name,
                ];
            }),
        ];
    }
}
