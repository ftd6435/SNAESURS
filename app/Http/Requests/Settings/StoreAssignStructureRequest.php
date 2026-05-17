<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssignStructureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'structure_id' => ['required', 'integer', 'exists:structures,id'],
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'assigned_at' => ['nullable', 'date'],
            'frais_integration' => ['nullable', 'numeric', 'min:0'],
            'remarks' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'structure_id.required' => 'La structure est obligatoire.',
            'structure_id.exists' => 'La structure sélectionnée n\'existe pas.',
            'user_id.required' => 'L\'utilisateur est obligatoire.',
            'user_id.exists' => 'L\'utilisateur sélectionné n\'existe pas.',
            'assigned_at.date' => 'La date d\'affectation doit être une date valide.',
            'frais_integration.numeric' => 'Les frais d\'intégration doivent être un nombre.',
            'frais_integration.min' => 'Les frais d\'intégration ne peuvent pas être négatifs.',
        ];
    }
}
