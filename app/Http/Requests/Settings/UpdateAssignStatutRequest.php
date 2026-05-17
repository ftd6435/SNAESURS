<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssignStatutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'statut_id' => ['sometimes', 'integer', 'exists:statuts,id'],
            'user_id' => ['sometimes', 'integer', 'exists:users,id'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date', 'after:date_debut'],
            'remarks' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'integer', 'exists:assign_statuts,id'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'statut_id.exists' => 'Le statut sélectionné n\'existe pas.',
            'user_id.exists' => 'L\'utilisateur sélectionné n\'existe pas.',
            'date_debut.date' => 'La date de début doit être une date valide.',
            'date_fin.date' => 'La date de fin doit être une date valide.',
            'date_fin.after' => 'La date de fin doit être postérieure à la date de début.',
            'parent_id.exists' => 'L\'affectation parente sélectionnée n\'existe pas.',
        ];
    }
}
