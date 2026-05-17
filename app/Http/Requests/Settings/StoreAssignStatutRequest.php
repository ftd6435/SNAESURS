<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssignStatutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'statut_id' => ['required', 'integer', 'exists:statuts,id'],
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['required', 'date', 'after:date_debut'],
            'remarks' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'integer', 'exists:assign_statuts,id'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'statut_id.required' => 'Le statut est obligatoire.',
            'statut_id.exists' => 'Le statut sélectionné n\'existe pas.',
            'user_id.required' => 'L\'utilisateur est obligatoire.',
            'user_id.exists' => 'L\'utilisateur sélectionné n\'existe pas.',
            'date_debut.date' => 'La date de début doit être une date valide.',
            'date_fin.required' => 'La date de fin est obligatoire.',
            'date_fin.date' => 'La date de fin doit être une date valide.',
            'date_fin.after' => 'La date de fin doit être postérieure à la date de début.',
            'parent_id.exists' => 'L\'affectation parente sélectionnée n\'existe pas.',
        ];
    }
}
