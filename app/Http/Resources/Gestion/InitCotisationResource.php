<?php

namespace App\Http\Resources\Gestion;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InitCotisationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $montant = $this->montant ? (float) $this->montant : 0;
        $activeMembersCount = (int) ($this->active_members_count ?? 0);
        $expectedTotal = $montant * $activeMembersCount;
        $receivedTotal = (float) ($this->received_total ?? 0);
        $remainingTotal = max(0, $expectedTotal - $receivedTotal);

        return [
            'id' => $this->id,
            'type_cotisation_id' => $this->type_cotisation_id,
            'structure_id' => $this->structure_id,
            'libelle' => $this->libelle,
            'description' => $this->description,
            'montant' => $montant,
            'date_limite' => $this->date_limite?->toISOString(),
            'is_completed' => $this->is_completed,
            'active_members_count' => $activeMembersCount,
            'received_total' => $receivedTotal,
            'expected_total' => $expectedTotal,
            'remaining_total' => $remainingTotal,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),
            'stats' => [
                'active_members_count' => $activeMembersCount,
                'received_total' => $receivedTotal,
                'expected_total' => $expectedTotal,
                'remaining_total' => $remainingTotal,
            ],

            // Relationships
            'type_cotisation' => $this->whenLoaded('typeCotisation', function () {
                return [
                    'id' => $this->typeCotisation->id,
                    'libelle' => $this->typeCotisation->libelle,
                ];
            }),
            'structure' => $this->whenLoaded('structure', function () {
                return [
                    'id' => $this->structure->id,
                    'libelle' => $this->structure->libelle,
                ];
            }),
            'cotisations' => CotisationResource::collection($this->whenLoaded('cotisations')),
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
