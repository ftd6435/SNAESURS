<?php

namespace App\Http\Requests\Gestion;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCotisationRequest extends FormRequest
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
            'init_cotisation_id' => ['sometimes', 'required', 'exists:init_cotisations,id'],
            'user_id' => ['sometimes', 'required', 'exists:users,id'],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0'],
            'paid_at' => ['nullable', 'date'],
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
            'init_cotisation_id.required' => 'L\'initialisation de cotisation est obligatoire.',
            'init_cotisation_id.exists' => 'L\'initialisation de cotisation sélectionnée n\'existe pas.',
            'user_id.required' => 'L\'utilisateur est obligatoire.',
            'user_id.exists' => 'L\'utilisateur sélectionné n\'existe pas.',
            'amount.required' => 'Le montant est obligatoire.',
            'amount.numeric' => 'Le montant doit être un nombre.',
            'amount.min' => 'Le montant doit être positif.',
            'paid_at.date' => 'La date de paiement doit être une date valide.',
        ];
    }
}
