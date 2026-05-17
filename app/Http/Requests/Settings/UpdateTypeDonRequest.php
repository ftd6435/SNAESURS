<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTypeDonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'libelle' => ['sometimes', 'string', 'max:255', Rule::unique('type_dons')->ignore($this->route('type_don'))],
            'description' => ['nullable', 'string'],
            'montant_attendu' => ['nullable', 'numeric', 'min:0'],
            'is_open' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'libelle.unique' => 'Ce libellé existe déjà.',
            'libelle.max' => 'Le libellé ne doit pas dépasser 255 caractères.',
            'montant_attendu.numeric' => 'Le montant attendu doit être un nombre.',
            'montant_attendu.min' => 'Le montant attendu ne peut pas être négatif.',
        ];
    }
}
