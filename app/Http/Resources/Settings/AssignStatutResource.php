<?php

namespace App\Http\Resources\Settings;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssignStatutResource extends JsonResource
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
            'statut' => $this->whenLoaded('statut', function () {
                return [
                    'id' => $this->statut->id,
                    'libelle' => $this->statut->libelle,
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
            'date_debut' => $this->date_debut,
            'date_fin' => $this->date_fin,
            'remarks' => $this->remarks,
            'parent' => $this->whenLoaded('parent', function () {
                return $this->parent ? [
                    'id' => $this->parent->id,
                    'date_debut' => $this->parent->date_debut,
                    'date_fin' => $this->parent->date_fin,
                ] : null;
            }),
            'children' => $this->whenLoaded('children', function () {
                return $this->children->map(function ($child) {
                    return [
                        'id' => $child->id,
                        'date_debut' => $child->date_debut,
                        'date_fin' => $child->date_fin,
                    ];
                });
            }),
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
