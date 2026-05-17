<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
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
            'code' => ['nullable', 'string', 'regex:/^\d{6}$/', 'unique:users,code'],
            'full_name' => ['required', 'string', 'max:255'],
            'telephone' => ['required', 'string', 'max:20', 'unique:users,telephone'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'genre' => ['nullable', 'string', Rule::in(['homme', 'femme', 'autre'])],
            'date_naissance' => ['nullable', 'date', 'before:today'],
            'person_a_contacter' => ['nullable', 'string', 'max:255'],
            'phone_person_a_contacter' => ['nullable', 'string', 'max:20'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:2048'],
            'role' => ['nullable', 'string', Rule::in(['admin', 'membre', 'tresorier', 'secretaire'])],
            'is_approved' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],

            // Structure assignment - required
            'structure_id' => ['required', 'exists:structures,id'],
            'assigned_at' => ['nullable', 'date'],
            'frais_integration' => ['nullable', 'numeric', 'min:0'],

            // Statut assignment - optional
            'statut_id' => ['nullable', 'exists:statuts,id'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date', 'after_or_equal:date_debut'],
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
            'code.regex' => 'Le code doit contenir exactement 6 chiffres.',
            'code.unique' => 'Ce code est déjà utilisé.',
            'full_name.required' => 'Le nom complet est obligatoire.',
            'full_name.max' => 'Le nom complet ne doit pas dépasser 255 caractères.',
            'telephone.required' => 'Le numéro de téléphone est obligatoire.',
            'telephone.unique' => 'Ce numéro de téléphone est déjà utilisé.',
            'email.email' => 'L\'adresse email doit être valide.',
            'email.unique' => 'Cette adresse email est déjà utilisée.',
            'password.required' => 'Le mot de passe est obligatoire.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
            'genre.in' => 'Le genre doit être homme, femme ou autre.',
            'date_naissance.date' => 'La date de naissance doit être une date valide.',
            'date_naissance.before' => 'La date de naissance doit être antérieure à aujourd\'hui.',
            'avatar.image' => 'L\'avatar doit être une image.',
            'avatar.mimes' => 'L\'avatar doit être au format jpeg, jpg, png, gif ou webp.',
            'avatar.max' => 'L\'avatar ne doit pas dépasser 2 Mo.',
            'role.in' => 'Le rôle doit être admin, membre, tresorier ou secretaire.',

            'structure_id.required' => 'La structure est obligatoire.',
            'structure_id.exists' => 'La structure sélectionnée n\'existe pas.',
            'frais_integration.numeric' => 'Les frais d\'intégration doivent être un nombre.',
            'frais_integration.min' => 'Les frais d\'intégration doivent être positifs.',

            'statut_id.exists' => 'Le statut sélectionné n\'existe pas.',
            'date_debut.date' => 'La date de début doit être une date valide.',
            'date_fin.date' => 'La date de fin doit être une date valide.',
            'date_fin.after_or_equal' => 'La date de fin doit être égale ou postérieure à la date de début.',
        ];
    }
}
