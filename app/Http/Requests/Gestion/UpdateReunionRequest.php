<?php

namespace App\Http\Requests\Gestion;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReunionRequest extends FormRequest
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
            'type' => ['sometimes', 'required', 'string', Rule::in(['generale', 'structure'])],
            'structure_id' => ['nullable', 'exists:structures,id'],
            'libelle' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'date_reunion' => ['sometimes', 'required', 'date'],
            'heure_debut' => ['sometimes', 'required', 'date_format:H:i'],
            'heure_fin' => ['sometimes', 'required', 'date_format:H:i'],
            'lieu' => ['nullable', 'string', 'max:255'],
            'points_reunion' => ['nullable', 'array'],
            'points_reunion.*' => ['string'],
            'proces_verbal' => ['nullable', 'array', 'required_if:status,completed', 'min:1'],
            'proces_verbal.*' => ['string'],
            'status' => ['nullable', 'string', Rule::in(['pending', 'completed', 'canceled'])],
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
            'type.required' => 'Le type de réunion est obligatoire.',
            'type.in' => 'Le type doit être generale ou structure.',
            'structure_id.exists' => 'La structure sélectionnée n\'existe pas.',
            'libelle.required' => 'Le libellé est obligatoire.',
            'libelle.max' => 'Le libellé ne doit pas dépasser 255 caractères.',
            'date_reunion.required' => 'La date de réunion est obligatoire.',
            'heure_debut.required' => 'L\'heure de début est obligatoire.',
            'heure_debut.date_format' => 'L\'heure de début doit être au format HH:MM.',
            'heure_fin.required' => 'L\'heure de fin est obligatoire.',
            'heure_fin.date_format' => 'L\'heure de fin doit être au format HH:MM.',
            'status.in' => 'Le statut doit être pending, completed ou canceled.',
            'proces_verbal.required_if' => 'Le procès-verbal est obligatoire pour terminer la réunion.',
            'proces_verbal.min' => 'Le procès-verbal ne peut pas être vide.',
        ];
    }
}
