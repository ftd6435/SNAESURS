<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Override;

class RegisterRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'min:2', 'max:255'],
            'telephone' => ['required', 'string', 'max:20', 'unique:users,telephone', 'regex:/^(\+224|224)?6[0-9]{8}$/'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'genre' => ['nullable', 'in:m,f,autre'],
            'date_naissance' => ['nullable', 'date'],
            'person_a_contacter' => ['nullable', 'string', 'max:255'],
            'phone_person_a_contacter' => ['nullable', 'string', 'max:20', 'regex:/^(\+224|224)?6[0-9]{8}$/'],
            'avatar' => ['nullable', 'image', 'mimes:png,jpg,jpeg', 'max:1024'],
            'structure_id' => ['nullable', 'integer', 'exists:structures,id'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    #[Override]
    public function messages()
    {
        return [
            'full_name.required' => "Le nom complèt est obligatoire",
            'full_name.string' => "Le nom complèt doit être une chaîne de caractères",
            'full_name.min' => "Le nom complèt doit comporter au moins 2 caractères",
            'full_name.max' => "Le nom complèt ne doit pas dépasser 255 caractères",
            'telephone.required' => "Le numéro de téléphone est obligatoire",
            'telephone.string' => "Le numéro de téléphone doit être une chaîne de caractères",
            'telephone.max' => "Le numéro de téléphone ne doit pas dépasser 20 caractères",
            'telephone.unique' => "Ce numéro de téléphone est déjà utilisé",
            'telephone.regex' => "Le numéro de téléphone doit être au format +2246XXXXXXXX ou 2246XXXXXXXX",
            'email.required' => "L'adresse e-mail est obligatoire",
            'email.string' => "L'adresse e-mail doit être une chaîne de caractères",
            'email.email' => "L'adresse e-mail doit être une adresse e-mail valide",
            'email.max' => "L'adresse e-mail ne doit pas dépasser 255 caractères",
            'email.unique' => "Cette adresse e-mail est déjà utilisée",
            'adresse.string' => "L'adresse doit être une chaîne de caractères",
            'adresse.max' => "L'adresse ne doit pas dépasser 255 caractères",
            'genre.in' => "Le genre doit être l'un des suivants : m, f, autre",
            'date_naissance.date' => "La date de naissance doit être une date valide",
            'person_a_contacter.string' => "La personne à contacter doit être une chaîne de caractères",
            'person_a_contacter.max' => "La personne à contacter ne doit pas dépasser 255 caractères",
            'phone_person_a_contacter.string' => "Le numéro de téléphone de la personne à contacter doit être une chaîne de caractères",
            'phone_person_a_contacter.max' => "Le numéro de téléphone de la personne à contacter ne doit pas dépasser 20 caractères",
            'phone_person_a_contacter.regex' => "Le numéro de téléphone de la personne à contacter doit être au format +2246XXXXXXXX ou 2246XXXXXXXX",
            'structure_id.integer' => "L'identifiant de la structure doit être un entier",
            'structure_id.exists' => "La structure sélectionnée n'existe pas",
            'avatar.image' => "L'avatar doit être une image",
            'avatar.mimes' => "L'avatar doit être au format png, jpg ou jpeg",
            'avatar.max' => "L'avatar ne doit pas dépasser 1 Mo",
            'password.required' => "Le mot de passe est obligatoire",
            'password.string' => "Le mot de passe doit être une chaîne de caractères",
            'password.min' => "Le mot de passe doit comporter au moins 8 caractères",
            'password.confirmed' => "Le mot de passe de confirmation ne correspond pas",
        ];
    }
}
