<?php

namespace App\Http\Requests\Gestion;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInitCotisationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type_cotisation_id' => ['sometimes', 'required', 'exists:type_cotisations,id'],
            'structure_id' => ['sometimes', 'required', 'exists:structures,id'],
            'libelle' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'montant' => ['sometimes', 'required', 'numeric', 'min:0'],
            'date_limite' => ['nullable', 'date'],
            'is_completed' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'type_cotisation_id.required' => 'Le type de cotisation est obligatoire.',
            'type_cotisation_id.exists' => 'Le type de cotisation sélectionné n\'existe pas.',
            'structure_id.required' => 'La structure est obligatoire.',
            'structure_id.exists' => 'La structure sélectionnée n\'existe pas.',
            'libelle.required' => 'Le libellé est obligatoire.',
            'libelle.max' => 'Le libellé ne doit pas dépasser 255 caractères.',
            'montant.required' => 'Le montant est obligatoire.',
            'montant.numeric' => 'Le montant doit être un nombre.',
            'montant.min' => 'Le montant doit être positif.',
            'date_limite.date' => 'La date limite doit être une date valide.',
        ];
    }
}
