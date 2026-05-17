<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssignStructureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'structure_id' => ['sometimes', 'integer', 'exists:structures,id'],
            'user_id' => ['sometimes', 'integer', 'exists:users,id'],
            'assigned_at' => ['nullable', 'date'],
            'unassigned_at' => ['nullable', 'date', 'after_or_equal:assigned_at'],
            'frais_integration' => ['nullable', 'numeric', 'min:0'],
            'remarks' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'structure_id.exists' => 'La structure sélectionnée n\'existe pas.',
            'user_id.exists' => 'L\'utilisateur sélectionné n\'existe pas.',
            'assigned_at.date' => 'La date d\'affectation doit être une date valide.',
            'unassigned_at.date' => 'La date de désaffectation doit être une date valide.',
            'unassigned_at.after_or_equal' => 'La date de désaffectation doit être postérieure ou égale à la date d\'affectation.',
            'frais_integration.numeric' => 'Les frais d\'intégration doivent être un nombre.',
            'frais_integration.min' => 'Les frais d\'intégration ne peuvent pas être négatifs.',
        ];
    }
}
