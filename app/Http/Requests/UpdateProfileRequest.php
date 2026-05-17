<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
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

        $userId = Auth::id();

        return [
            'full_name' => ['required', 'string', 'max:255'],
            'telephone' => ['required', 'string', 'max:20', Rule::unique('users', 'telephone')->ignore($userId)],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'adresse' => ['nullable', 'string', 'max:255'],
            'genre' => ['nullable', 'string', Rule::in(['m', 'f', 'autre'])],
            'date_naissance' => ['nullable', 'date', 'before:today'],
            'person_a_contacter' => ['nullable', 'string', 'max:255'],
            'phone_person_a_contacter' => ['nullable', 'string', 'max:20'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:1024'],
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
            'full_name.required' => 'Le nom complet est obligatoire.',
            'full_name.max' => 'Le nom complet ne doit pas dépasser 255 caractères.',
            'telephone.required' => 'Le numéro de téléphone est obligatoire.',
            'telephone.unique' => 'Ce numéro de téléphone est déjà utilisé.',
            'email.email' => 'L\'adresse email doit être valide.',
            'email.unique' => 'Cette adresse email est déjà utilisée.',
            'genre.in' => 'Le genre doit être homme, femme ou autre.',
            'date_naissance.date' => 'La date de naissance doit être une date valide.',
            'date_naissance.before' => 'La date de naissance doit être antérieure à aujourd\'hui.',
            'avatar.image' => 'L\'avatar doit être une image.',
            'avatar.mimes' => 'L\'avatar doit être au format jpeg, jpg, png, gif ou webp.',
            'avatar.max' => 'L\'avatar ne doit pas dépasser 1 Mo.',
        ];
    }
}
