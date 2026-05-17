<?php

namespace App\Http\Resources\Gestion;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepenseResource extends JsonResource
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
            'type_depense_id' => $this->type_depense_id,
            'structure_id' => $this->structure_id,
            'montant' => $this->montant,
            'commentaire' => $this->commentaire,
            'deleted_at' => $this->deleted_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relationships
            'type_depense' => $this->whenLoaded('typeDepense', function () {
                return [
                    'id' => $this->typeDepense->id,
                    'libelle' => $this->typeDepense->libelle,
                ];
            }),
            'structure' => $this->whenLoaded('structure', function () {
                return [
                    'id' => $this->structure->id,
                    'libelle' => $this->structure->libelle,
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
