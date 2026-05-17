<?php

namespace App\Http\Controllers\Auth;

use App\Events\SendMessageEvent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Settings\AssignStructure;
use App\Models\User;
use App\Traits\ApiResponses;
use App\Traits\CloudflareUpload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponses, CloudflareUpload;

    public function register(RegisterRequest $request)
    {
        try {
            DB::beginTransaction();

            // Extract validated data from the request
            $validated = $request->validated();

            // Handle avatar upload if provided
            $avatarFilename = null;
            if ($request->hasFile('avatar')) {
                $avatarFilename = $this->uploadImage($request->file('avatar'), 'profile-photos');
            }

            // Create a new user using the validated data
            $user = User::create([
                'full_name' => $validated['full_name'],
                'telephone' => $validated['telephone'],
                'email' => $validated['email'],
                'adresse' => $validated['adresse'] ?? null,
                'genre' => $validated['genre'] ?? 'autre',
                'date_naissance' => $validated['date_naissance'] ?? null,
                'person_a_contacter' => $validated['person_a_contacter'] ?? null,
                'phone_person_a_contacter' => $validated['phone_person_a_contacter'] ?? null,
                'avatar' => $avatarFilename,
                'password' => Hash::make($validated['password']),
                'role' => 'membre',
                'is_approved' => false,
                'is_active' => true,
            ]);

            // If structure_id is provided, associate the user with the structure
            if (isset($validated['structure_id'])) {
                AssignStructure::create([
                    'structure_id' => $validated['structure_id'],
                    'user_id' => $user->id,
                    'assigned_at' => now(),
                    'is_active' => true,
                    'frais_integration' => 0,
                    'created_by' => $user->id,
                ]);
            }

            DB::commit();

            // Send a message to the user about their account creation and wait for admin approval in french
            $message = "Bonjour {$user->full_name},\n\nvotre compte a été créé avec succès. Votre inscription est en attente d'approbation par un administrateur. Vous serez notifié une fois votre compte approuvé.";
            SendMessageEvent::dispatch($user->telephone, $message);

            // Return a success response indicating that the registration was successful and is pending approval in french
            return $this->successResponse(
                new UserResource($user),
                'Inscription réussie. Votre compte est en attente d\'approbation par un administrateur.',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Une erreur s\'est produite lors de l\'inscription.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function login(Request $request)
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'login' => ['required', 'string'],
                'password' => ['nullable', 'string', 'min:8'],
            ], [
                'login.required' => 'L\'identifiant (email ou téléphone) est obligatoire.',
                'password.min' => 'Le mot de passe doit comporter au moins 8 caractères.',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse(
                    'Erreur de validation.',
                    $validator->errors(),
                    422
                );
            }

            $login = $request->input('login');
            $password = $request->input('password');

            // Determine if login is email or telephone
            $field = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'telephone';

            // Find user
            $user = User::where($field, $login)->first();

            if (!$user) {
                return $this->errorResponse(
                    'Identifiants invalides.',
                    ['login' => 'Aucun compte trouvé avec ces identifiants.'],
                    401
                );
            }

            // Check if user is approved and active
            if (!$user->is_approved) {
                return $this->errorResponse(
                    'Compte en attente d\'approbation.',
                    ['status' => 'Votre compte est en attente d\'approbation par un administrateur.'],
                    403
                );
            }

            if (!$user->is_active) {
                return $this->errorResponse(
                    'Compte inactif.',
                    ['status' => 'Votre compte a été désactivé. Veuillez contacter l\'administrateur.'],
                    403
                );
            }

            // If password is provided, authenticate with password
            if ($password) {
                if (!Hash::check($password, $user->password)) {
                    return $this->errorResponse(
                        'Identifiants invalides.',
                        ['password' => 'Mot de passe incorrect.'],
                        401
                    );
                }

                // Generate authentication token
                $token = $user->createToken('auth-token')->plainTextToken;

                return $this->successResponseWithToken(
                    new UserResource($user->load([
                        'assignStructures.structure:id,libelle',
                        'assignStatuts.statut:id,libelle',
                    ])),
                    $token,
                    'Connexion réussie.',
                    200
                );
            }

            // If no password and login is telephone, generate OTP
            if ($field === 'telephone') {
                // Generate OTP using config
                $otpLength = config('constants.otp.length', 6);
                $maxOtp = (int) str_repeat('9', $otpLength);
                $minOtp = (int) ('1' . str_repeat('0', $otpLength - 1));
                $otp = str_pad((string) random_int($minOtp, $maxOtp), $otpLength, '0', STR_PAD_LEFT);

                // Store encrypted OTP in cache
                $expiryMinutes = config('constants.otp.expiry_minutes', 10);
                $encryptedOtp = config('constants.security.encrypt_otp', true) ? encrypt($otp) : $otp;
                Cache::put("otp:{$user->telephone}", $encryptedOtp, now()->addMinutes($expiryMinutes));

                // Send OTP via SMS
                $message = "Votre code de vérification est: {$otp}. Ce code est valide pendant 10 minutes.";
                SendMessageEvent::dispatch($user->telephone, $message);

                return $this->successResponse(
                    ['telephone' => $user->telephone],
                    'Un code de vérification a été envoyé à votre numéro de téléphone.',
                    200
                );
            }

            // If email without password, require password
            return $this->errorResponse(
                'Mot de passe requis.',
                ['password' => 'Le mot de passe est obligatoire pour la connexion par email.'],
                422
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Une erreur s\'est produite lors de la connexion.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function verifyOtp(Request $request)
    {
        try {
            // Validate the OTP and telephone number
            $validator = Validator::make($request->all(), [
                'telephone' => ['required', 'string', 'exists:users,telephone'],
                'otp' => ['required', 'string', 'size:6'],
            ], [
                'telephone.required' => 'Le numéro de téléphone est obligatoire.',
                'telephone.exists' => 'Aucun compte trouvé avec ce numéro de téléphone.',
                'otp.required' => 'Le code de vérification est obligatoire.',
                'otp.size' => 'Le code de vérification doit comporter 6 chiffres.',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse(
                    'Erreur de validation.',
                    $validator->errors(),
                    422
                );
            }

            $telephone = $request->input('telephone');
            $otp = $request->input('otp');

            // Check if the OTP is valid for the given telephone number
            $cachedOtp = Cache::get("otp:{$telephone}");

            // Decrypt OTP if encryption is enabled
            if ($cachedOtp && config('constants.security.encrypt_otp', true)) {
                try {
                    $cachedOtp = decrypt($cachedOtp);
                } catch (\Exception $e) {
                    $cachedOtp = null;
                }
            }

            if (!$cachedOtp || $cachedOtp !== $otp) {
                return $this->errorResponse(
                    'Code de vérification invalide ou expiré.',
                    ['otp' => 'Le code de vérification est incorrect ou a expiré.'],
                    401
                );
            }

            // Find user
            $user = User::where('telephone', $telephone)->first();

            // Check if user is approved and active
            if (!$user->is_approved) {
                return $this->errorResponse(
                    'Compte en attente d\'approbation.',
                    ['status' => 'Votre compte est en attente d\'approbation par un administrateur.'],
                    403
                );
            }

            if (!$user->is_active) {
                return $this->errorResponse(
                    'Compte inactif.',
                    ['status' => 'Votre compte a été désactivé. Veuillez contacter l\'administrateur.'],
                    403
                );
            }

            // Delete OTP from cache
            Cache::forget("otp:{$telephone}");

            // Generate authentication token
            $token = $user->createToken('auth-token')->plainTextToken;

            return $this->successResponseWithToken(
                new UserResource($user->load([
                    'assignStructures.structure:id,libelle',
                    'assignStatuts.statut:id,libelle',
                ])),
                $token,
                'Vérification réussie. Connexion établie.',
                200
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Une erreur s\'est produite lors de la vérification.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function resendOtp(Request $request)
    {
        try {
            // Validate the telephone number
            $validator = Validator::make($request->all(), [
                'telephone' => ['required', 'string', 'exists:users,telephone'],
            ], [
                'telephone.required' => 'Le numéro de téléphone est obligatoire.',
                'telephone.exists' => 'Aucun compte trouvé avec ce numéro de téléphone.',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse(
                    'Erreur de validation.',
                    $validator->errors(),
                    422
                );
            }

            $telephone = $request->input('telephone');

            // Use rate limiting to prevent abuse - max 3 times per hour per telephone number
            $key = 'resend-otp:' . $telephone;

            if (RateLimiter::tooManyAttempts($key, 3)) {
                $seconds = RateLimiter::availableIn($key);
                $minutes = ceil($seconds / 60);

                return $this->errorResponse(
                    'Trop de tentatives.',
                    ['rate_limit' => "Vous avez dépassé le nombre maximum de tentatives. Veuillez réessayer dans {$minutes} minute(s)."],
                    429
                );
            }

            // Find user
            $user = User::where('telephone', $telephone)->first();

            // Check if user is approved and active
            if (!$user->is_approved) {
                return $this->errorResponse(
                    'Compte en attente d\'approbation.',
                    ['status' => 'Votre compte est en attente d\'approbation par un administrateur.'],
                    403
                );
            }

            if (!$user->is_active) {
                return $this->errorResponse(
                    'Compte inactif.',
                    ['status' => 'Votre compte a été désactivé. Veuillez contacter l\'administrateur.'],
                    403
                );
            }

            // Generate OTP using config
            $otpLength = config('constants.otp.length', 6);
            $maxOtp = (int) str_repeat('9', $otpLength);
            $minOtp = (int) ('1' . str_repeat('0', $otpLength - 1));
            $otp = str_pad((string) random_int($minOtp, $maxOtp), $otpLength, '0', STR_PAD_LEFT);

            // Store encrypted OTP in cache
            $expiryMinutes = config('constants.otp.expiry_minutes', 10);
            $encryptedOtp = config('constants.security.encrypt_otp', true) ? encrypt($otp) : $otp;
            Cache::put("otp:{$telephone}", $encryptedOtp, now()->addMinutes($expiryMinutes));

            // Send the new OTP to the user's telephone number
            $message = "Votre nouveau code de vérification est: {$otp}. Ce code est valide pendant 10 minutes.";
            SendMessageEvent::dispatch($telephone, $message);

            // Increment rate limiter
            RateLimiter::hit($key, 3600); // 1 hour

            return $this->successResponse(
                ['telephone' => $telephone],
                'Un nouveau code de vérification a été envoyé à votre numéro de téléphone.',
                200
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Une erreur s\'est produite lors de l\'envoi du code.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function logout(Request $request)
    {
        try {
            // Delete current access token
            $request->user()->currentAccessToken()->delete();

            return $this->noContentSuccessResponse(
                'Déconnexion réussie.',
                200
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Une erreur s\'est produite lors de la déconnexion.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}
