<?php

namespace App\Http\Resources\Settings;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssignStructureResource extends JsonResource
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
            'structure_id' => $this->structure_id,
            'user_id' => $this->user_id,
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
            'assigned_at' => $this->assigned_at,
            'unassigned_at' => $this->unassigned_at,
            'remarks' => $this->remarks,
            'frais_integration' => $this->frais_integration ? (float) $this->frais_integration : 0,
            'is_active' => $this->is_active,
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
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
