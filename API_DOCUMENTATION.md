# SNAESURS API Documentation

**Version:** 1.0  
**Base URL:** `http://your-domain.com/api`  
**Date:** May 14, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Authentication Endpoints](#authentication-endpoints)
5. [User Management](#user-management)
6. [Settings Module](#settings-module)
7. [Gestion (Management) Module](#gestion-management-module)
8. [Error Handling](#error-handling)
9. [TanStack Query Integration](#tanstack-query-integration)

---

## Overview

### API Characteristics

- **Framework:** Laravel 12 (PHP 8.2+)
- **Authentication:** Laravel Sanctum (Token-based)
- **Format:** JSON
- **Encoding:** UTF-8
- **Language:** French (Primary)

### Base Headers

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}
```

### Rate Limiting

- **Authentication endpoints:** 5 attempts per minute
- **General endpoints:** 60 requests per minute per user

---

## Authentication

### Token-Based Authentication

All protected endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer {your_access_token}
```

### Token Generation

Tokens are generated upon successful login and returned in the response.

### Token Expiration

Tokens do not expire by default with Sanctum. Implement token rotation as needed.

---

## Response Format

### Success Response Structure

```json
{
    "status": 1,
    "message": "Success message in French",
    "data": {
        // Response data
    }
}
```

### Success Response with Token

```json
{
    "status": 1,
    "message": "Connexion réussie.",
    "data": {
        // User data
    },
    "token": "1|abc123def456..."
}
```

### Error Response Structure

```json
{
    "status": 0,
    "message": "Error message in French",
    "error": {
        "field_name": ["Error description"]
    }
}
```

### HTTP Status Codes

| Code | Meaning                                 |
| ---- | --------------------------------------- |
| 200  | Success                                 |
| 201  | Created                                 |
| 203  | No Content Success                      |
| 401  | Unauthorized                            |
| 403  | Forbidden (Account not approved/active) |
| 404  | Not Found                               |
| 422  | Validation Error                        |
| 500  | Server Error                            |

---

## Authentication Endpoints

### 1. Register User

**Endpoint:** `POST /api/auth/register`  
**Authentication:** Not required  
**Description:** Register a new user. Account requires admin approval before login.

#### Request Headers

```http
Content-Type: multipart/form-data
Accept: application/json
```

#### Request Body (multipart/form-data)

```json
{
    "full_name": "Mamadou Diallo",
    "telephone": "+224621234567",
    "email": "mamadou.diallo@example.com",
    "adresse": "Conakry, Ratoma",
    "genre": "m",
    "date_naissance": "1990-05-15",
    "person_a_contacter": "Fatoumata Diallo",
    "phone_person_a_contacter": "+224627654321",
    "avatar": "<file>",
    "structure_id": 1,
    "password": "SecurePass123",
    "password_confirmation": "SecurePass123"
}
```

#### Field Validation

| Field                    | Type    | Required | Validation                                        |
| ------------------------ | ------- | -------- | ------------------------------------------------- |
| full_name                | string  | Yes      | Min: 2, Max: 255                                  |
| telephone                | string  | Yes      | Format: `+2246XXXXXXXX` or `2246XXXXXXXX`, Unique |
| email                    | string  | Yes      | Valid email, Max: 255, Unique                     |
| adresse                  | string  | No       | Max: 255                                          |
| genre                    | string  | No       | Values: `m`, `f`, `autre`                         |
| date_naissance           | date    | No       | Valid date (Y-m-d)                                |
| person_a_contacter       | string  | No       | Max: 255                                          |
| phone_person_a_contacter | string  | No       | Format: `+2246XXXXXXXX`                           |
| avatar                   | file    | No       | Image (png, jpg, jpeg), Max: 1MB                  |
| structure_id             | integer | No       | Must exist in structures table                    |
| password                 | string  | Yes      | Min: 8, Must be confirmed                         |

#### Success Response (201)

```json
{
    "status": 1,
    "message": "Inscription réussie. Votre compte est en attente d'approbation par un administrateur.",
    "data": {
        "id": 15,
        "full_name": "Mamadou Diallo",
        "telephone": "+224621234567",
        "email": "mamadou.diallo@example.com",
        "adresse": "Conakry, Ratoma",
        "genre": "m",
        "date_naissance": "15-05-1990",
        "approved_at": null,
        "person_a_contacter": "Fatoumata Diallo",
        "phone_person_a_contacter": "+224627654321",
        "role": "membre",
        "avatar": "profile-photos/abc123.jpg",
        "avatar_url": "https://your-cloudflare-url.com/profile-photos/abc123.jpg",
        "is_approved": false,
        "is_active": true,
        "email_verified_at": null,
        "created_at": "14-05-2026 10:30:45",
        "updated_at": "14-05-2026 10:30:45",
        "assign_structures": [],
        "assign_statuts": []
    }
}
```

#### Error Response (422)

```json
{
    "status": 0,
    "message": "Erreur de validation.",
    "error": {
        "email": ["Cette adresse e-mail est déjà utilisée"],
        "telephone": ["Ce numéro de téléphone est déjà utilisé"]
    }
}
```

---

### 2. Login User

**Endpoint:** `POST /api/auth/login`  
**Authentication:** Not required  
**Description:** Login with email/phone and password, or phone + OTP

#### Request Body (Password Login)

```json
{
    "login": "mamadou.diallo@example.com",
    "password": "SecurePass123"
}
```

#### Request Body (OTP Request - Phone Only)

```json
{
    "login": "+224621234567"
}
```

#### Field Validation

| Field    | Type   | Required | Validation                        |
| -------- | ------ | -------- | --------------------------------- |
| login    | string | Yes      | Email or phone number             |
| password | string | No       | Min: 8 (required for email login) |

#### Success Response - Password Login (200)

```json
{
    "status": 1,
    "message": "Connexion réussie.",
    "data": {
        "id": 15,
        "full_name": "Mamadou Diallo",
        "telephone": "+224621234567",
        "email": "mamadou.diallo@example.com",
        "role": "membre",
        "avatar_url": "https://your-cloudflare-url.com/profile-photos/abc123.jpg",
        "is_approved": true,
        "is_active": true,
        "created_at": "14-05-2026 10:30:45"
    },
    "token": "1|abc123def456ghi789jkl012mno345pqr678"
}
```

#### Success Response - OTP Sent (200)

```json
{
    "status": 1,
    "message": "Un code de vérification a été envoyé à votre numéro de téléphone.",
    "data": {
        "telephone": "+224621234567"
    }
}
```

#### Error Responses

```json
// Account not approved (403)
{
  "status": 0,
  "message": "Compte en attente d'approbation.",
  "error": {
    "status": "Votre compte est en attente d'approbation par un administrateur."
  }
}

// Account inactive (403)
{
  "status": 0,
  "message": "Compte inactif.",
  "error": {
    "status": "Votre compte a été désactivé. Veuillez contacter l'administrateur."
  }
}

// Invalid credentials (401)
{
  "status": 0,
  "message": "Identifiants invalides.",
  "error": {
    "password": "Mot de passe incorrect."
  }
}
```

---

### 3. Verify OTP

**Endpoint:** `POST /api/auth/verify-otp`  
**Authentication:** Not required  
**Description:** Verify OTP code sent to phone

#### Request Body

```json
{
    "telephone": "+224621234567",
    "otp": "123456"
}
```

#### Field Validation

| Field     | Type   | Required | Validation          |
| --------- | ------ | -------- | ------------------- |
| telephone | string | Yes      | Guinea phone format |
| otp       | string | Yes      | 6 digits            |

#### Success Response (200)

```json
{
    "status": 1,
    "message": "Connexion réussie.",
    "data": {
        "id": 15,
        "full_name": "Mamadou Diallo",
        "telephone": "+224621234567",
        "email": "mamadou.diallo@example.com",
        "role": "membre",
        "avatar_url": "https://your-cloudflare-url.com/profile-photos/abc123.jpg",
        "is_approved": true,
        "is_active": true
    },
    "token": "1|abc123def456ghi789jkl012mno345pqr678"
}
```

#### Error Response (401)

```json
{
    "status": 0,
    "message": "Code OTP invalide.",
    "error": {
        "otp": "Le code de vérification est invalide ou a expiré."
    }
}
```

---

### 4. Resend OTP

**Endpoint:** `POST /api/auth/resend-otp`  
**Authentication:** Not required  
**Description:** Resend OTP code to phone

#### Request Body

```json
{
    "telephone": "+224621234567"
}
```

#### Success Response (200)

```json
{
    "status": 1,
    "message": "Un nouveau code de vérification a été envoyé à votre numéro de téléphone.",
    "data": {
        "telephone": "+224621234567"
    }
}
```

---

### 5. Logout

**Endpoint:** `POST /api/auth/logout`  
**Authentication:** Required  
**Description:** Revoke current access token

#### Success Response (200)

```json
{
    "status": 1,
    "message": "Déconnexion réussie."
}
```

---

## User Management

### 1. Get Authenticated User

**Endpoint:** `GET /api/user`  
**Authentication:** Required  
**Description:** Get current authenticated user details

#### Success Response (200)

```json
{
    "id": 15,
    "full_name": "Mamadou Diallo",
    "telephone": "+224621234567",
    "email": "mamadou.diallo@example.com",
    "adresse": "Conakry, Ratoma",
    "genre": "m",
    "date_naissance": "15-05-1990",
    "role": "membre",
    "avatar_url": "https://your-cloudflare-url.com/profile-photos/abc123.jpg",
    "is_approved": true,
    "is_active": true,
    "assign_structures": [
        {
            "id": 1,
            "structure": {
                "id": 1,
                "libelle": "Bureau National"
            },
            "assigned_at": "14-05-2026",
            "is_active": true
        }
    ]
}
```

---

### 2. List Users

**Endpoint:** `GET /api/users`  
**Authentication:** Required  
**Description:** Get list of all users with filters

#### Query Parameters

| Parameter    | Type    | Required | Description                     |
| ------------ | ------- | -------- | ------------------------------- |
| page         | integer | No       | Page number (default: 1)        |
| per_page     | integer | No       | Items per page (default: 15)    |
| search       | string  | No       | Search by name, email, or phone |
| role         | string  | No       | Filter by role                  |
| is_approved  | boolean | No       | Filter by approval status       |
| is_active    | boolean | No       | Filter by active status         |
| structure_id | integer | No       | Filter by structure             |

#### Example Request

```http
GET /api/users?page=1&per_page=20&role=membre&is_approved=true
Authorization: Bearer {token}
```

#### Success Response (200)

```json
{
    "status": 1,
    "message": null,
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 15,
                "full_name": "Mamadou Diallo",
                "telephone": "+224621234567",
                "email": "mamadou.diallo@example.com",
                "role": "membre",
                "avatar_url": "https://your-cloudflare-url.com/profile-photos/abc123.jpg",
                "is_approved": true,
                "is_active": true,
                "created_at": "14-05-2026 10:30:45"
            }
        ],
        "first_page_url": "http://your-domain.com/api/users?page=1",
        "from": 1,
        "last_page": 5,
        "last_page_url": "http://your-domain.com/api/users?page=5",
        "next_page_url": "http://your-domain.com/api/users?page=2",
        "path": "http://your-domain.com/api/users",
        "per_page": 20,
        "prev_page_url": null,
        "to": 20,
        "total": 100
    }
}
```

---

### 3. Create User (Admin Only)

**Endpoint:** `POST /api/users`  
**Authentication:** Required (super_admin, admin)  
**Description:** Create a new user (admin can directly approve)

#### Request Body

```json
{
    "full_name": "Aissatou Bah",
    "telephone": "+224625555555",
    "email": "aissatou.bah@example.com",
    "password": "SecurePass123",
    "password_confirmation": "SecurePass123",
    "role": "membre",
    "structure_id": 2
}
```

#### Success Response (201)

```json
{
    "status": 1,
    "message": "Utilisateur créé avec succès.",
    "data": {
        "id": 20,
        "full_name": "Aissatou Bah",
        "telephone": "+224625555555",
        "email": "aissatou.bah@example.com",
        "role": "membre",
        "is_approved": true,
        "is_active": true
    }
}
```

---

### 4. Approve User

**Endpoint:** `POST /api/users/{user}/approve`  
**Authentication:** Required (super_admin, admin)  
**Description:** Approve pending user registration

#### Success Response (200)

```json
{
    "status": 1,
    "message": "Utilisateur approuvé avec succès.",
    "data": {
        "id": 15,
        "full_name": "Mamadou Diallo",
        "is_approved": true,
        "approved_at": "14-05-2026"
    }
}
```

---

### 5. Toggle User Active Status

**Endpoint:** `POST /api/users/{user}/toggle-active`  
**Authentication:** Required (super_admin, admin)  
**Description:** Activate or deactivate user account

#### Success Response (200)

```json
{
    "status": 1,
    "message": "Statut de l'utilisateur mis à jour avec succès.",
    "data": {
        "id": 15,
        "full_name": "Mamadou Diallo",
        "is_active": false
    }
}
```

---

### 6. Update Profile

**Endpoint:** `PUT /api/profile`  
**Authentication:** Required  
**Description:** Update authenticated user's profile

#### Request Body (multipart/form-data)

```json
{
    "full_name": "Mamadou Diallo",
    "adresse": "Conakry, Kaloum",
    "genre": "m",
    "date_naissance": "1990-05-15",
    "person_a_contacter": "Fatoumata Diallo",
    "phone_person_a_contacter": "+224627654321",
    "avatar": "<file>"
}
```

#### Success Response (200)

```json
{
    "status": 1,
    "message": "Profil mis à jour avec succès.",
    "data": {
        "id": 15,
        "full_name": "Mamadou Diallo",
        "avatar_url": "https://your-cloudflare-url.com/profile-photos/new-avatar.jpg",
        "updated_at": "14-05-2026 15:20:30"
    }
}
```

---

### 7. Change Password

**Endpoint:** `POST /api/profile/change-password`  
**Authentication:** Required  
**Description:** Change authenticated user's password

#### Request Body

```json
{
    "current_password": "OldPassword123",
    "password": "NewSecurePass456",
    "password_confirmation": "NewSecurePass456"
}
```

#### Field Validation

| Field            | Type   | Required | Validation                  |
| ---------------- | ------ | -------- | --------------------------- |
| current_password | string | Yes      | Must match current password |
| password         | string | Yes      | Min: 8, Must be confirmed   |

#### Success Response (200)

```json
{
    "status": 1,
    "message": "Mot de passe modifié avec succès."
}
```

#### Error Response (401)

```json
{
    "status": 0,
    "message": "Erreur de validation.",
    "error": {
        "current_password": ["Le mot de passe actuel est incorrect."]
    }
}
```

---

## Settings Module

All settings endpoints require `super_admin` or `admin` role.

### 1. Structures

#### 1.1 List Structures

**Endpoint:** `GET /api/settings/structures`  
**Authentication:** Required (super_admin, admin)

##### Query Parameters

| Parameter | Type    | Description       |
| --------- | ------- | ----------------- |
| page      | integer | Page number       |
| search    | string  | Search by libelle |
| is_active | boolean | Filter by status  |

##### Success Response (200)

```json
{
    "status": 1,
    "message": null,
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1,
                "libelle": "Bureau National",
                "description": "Structure principale du syndicat",
                "adresse": "Conakry, Kaloum",
                "date_creation": "2020-01-15",
                "logo": "structures/logo-national.png",
                "logo_url": "https://your-cloudflare-url.com/structures/logo-national.png",
                "contact": "+224621111111",
                "email": "national@snaesurs.gn",
                "is_active": true,
                "created_at": "2026-01-10T08:00:00.000000Z",
                "updated_at": "2026-01-10T08:00:00.000000Z"
            }
        ],
        "total": 15,
        "per_page": 15
    }
}
```

#### 1.2 Create Structure

**Endpoint:** `POST /api/settings/structures`  
**Authentication:** Required (super_admin, admin)

##### Request Body (multipart/form-data)

```json
{
    "libelle": "Bureau Régional de Kindia",
    "description": "Bureau régional couvrant Kindia",
    "adresse": "Kindia Centre",
    "date_creation": "2026-05-01",
    "logo": "<file>",
    "contact": "+224622222222",
    "email": "kindia@snaesurs.gn",
    "is_active": true
}
```

##### Field Validation

| Field         | Type    | Required | Validation                            |
| ------------- | ------- | -------- | ------------------------------------- |
| libelle       | string  | Yes      | Max: 255, Unique                      |
| description   | string  | No       | -                                     |
| adresse       | string  | No       | Max: 255                              |
| date_creation | date    | No       | Valid date                            |
| logo          | file    | No       | Image (png, jpg, jpeg, svg), Max: 2MB |
| contact       | string  | No       | Max: 30                               |
| email         | string  | No       | Valid email, Max: 255                 |
| is_active     | boolean | No       | Default: true                         |

##### Success Response (201)

```json
{
    "status": 1,
    "message": "Structure créée avec succès.",
    "data": {
        "id": 2,
        "libelle": "Bureau Régional de Kindia",
        "logo_url": "https://your-cloudflare-url.com/structures/logo-kindia.png",
        "is_active": true,
        "created_at": "2026-05-14T10:30:00.000000Z"
    }
}
```

#### 1.3 Get Structure

**Endpoint:** `GET /api/settings/structures/{id}`  
**Authentication:** Required (super_admin, admin)

##### Success Response (200)

```json
{
    "status": 1,
    "message": null,
    "data": {
        "id": 1,
        "libelle": "Bureau National",
        "description": "Structure principale du syndicat",
        "adresse": "Conakry, Kaloum",
        "logo_url": "https://your-cloudflare-url.com/structures/logo-national.png",
        "contact": "+224621111111",
        "email": "national@snaesurs.gn",
        "is_active": true
    }
}
```

#### 1.4 Update Structure

**Endpoint:** `PUT /api/settings/structures/{id}`  
**Authentication:** Required (super_admin, admin)

##### Request Body

```json
{
    "libelle": "Bureau National SNAESURS",
    "description": "Structure principale",
    "is_active": true
}
```

##### Success Response (200)

```json
{
    "status": 1,
    "message": "Structure mise à jour avec succès.",
    "data": {
        "id": 1,
        "libelle": "Bureau National SNAESURS",
        "updated_at": "2026-05-14T15:20:00.000000Z"
    }
}
```

#### 1.5 Delete Structure

**Endpoint:** `DELETE /api/settings/structures/{id}`  
**Authentication:** Required (super_admin, admin)

##### Success Response (200)

```json
{
    "status": 1,
    "message": "Structure supprimée avec succès."
}
```

---

### 2. Statuts (Positions/Titles)

#### 2.1 List Statuts

**Endpoint:** `GET /api/settings/statuts`  
**Authentication:** Required (super_admin, admin)

##### Success Response (200)

```json
{
    "status": 1,
    "message": null,
    "data": [
        {
            "id": 1,
            "libelle": "Secrétaire Général",
            "description": "Responsable de la gestion administrative",
            "is_active": true,
            "created_at": "2026-01-10T08:00:00.000000Z"
        },
        {
            "id": 2,
            "libelle": "Trésorier",
            "description": "Responsable de la gestion financière",
            "is_active": true,
            "created_at": "2026-01-10T08:00:00.000000Z"
        }
    ]
}
```

#### 2.2 Create Statut

**Endpoint:** `POST /api/settings/statuts`  
**Authentication:** Required (super_admin, admin)

##### Request Body

```json
{
    "libelle": "Secrétaire Adjoint",
    "description": "Assiste le secrétaire général",
    "is_active": true
}
```

##### Field Validation

| Field       | Type    | Required | Validation       |
| ----------- | ------- | -------- | ---------------- |
| libelle     | string  | Yes      | Max: 255, Unique |
| description | string  | No       | -                |
| is_active   | boolean | No       | Default: true    |

##### Success Response (201)

```json
{
    "status": 1,
    "message": "Statut créé avec succès.",
    "data": {
        "id": 3,
        "libelle": "Secrétaire Adjoint",
        "description": "Assiste le secrétaire général",
        "is_active": true
    }
}
```

#### 2.3 Get/Update/Delete Statut

Follow the same pattern as Structures.

---

### 3. Type Cotisations (Contribution Types)

#### 3.1 List Type Cotisations

**Endpoint:** `GET /api/settings/type-cotisations`  
**Authentication:** Required (super_admin, admin)

##### Success Response (200)

```json
{
    "status": 1,
    "message": null,
    "data": [
        {
            "id": 1,
            "libelle": "Cotisation Mensuelle",
            "description": "Cotisation mensuelle standard",
            "montant": 50000,
            "is_active": true
        },
        {
            "id": 2,
            "libelle": "Cotisation Exceptionnelle",
            "description": "Pour événements spéciaux",
            "montant": 100000,
            "is_active": true
        }
    ]
}
```

#### 3.2 Create Type Cotisation

**Endpoint:** `POST /api/settings/type-cotisations`  
**Authentication:** Required (super_admin, admin)

##### Request Body

```json
{
    "libelle": "Cotisation Annuelle",
    "description": "Cotisation payée une fois par an",
    "montant": 500000,
    "is_active": true
}
```

##### Field Validation

| Field       | Type    | Required | Validation       |
| ----------- | ------- | -------- | ---------------- |
| libelle     | string  | Yes      | Max: 255, Unique |
| description | string  | No       | -                |
| montant     | numeric | Yes      | Min: 0           |
| is_active   | boolean | No       | Default: true    |

---

### 4. Type Dons (Donation Types)

#### API Resource: `/api/settings/type-dons`

Same CRUD structure as Type Cotisations.

##### Request Body Example

```json
{
    "libelle": "Don en Espèces",
    "description": "Dons monétaires",
    "is_active": true
}
```

---

### 5. Type Depenses (Expense Types)

#### API Resource: `/api/settings/type-depenses`

Same CRUD structure as Type Cotisations.

##### Request Body Example

```json
{
    "libelle": "Frais de Déplacement",
    "description": "Dépenses liées aux déplacements",
    "is_active": true
}
```

---

### 6. Type Sanctions (Sanction Types)

#### API Resource: `/api/settings/type-sanctions`

Same CRUD structure as Type Cotisations.

##### Request Body Example

```json
{
    "libelle": "Avertissement",
    "description": "Sanction légère pour manquement mineur",
    "is_active": true
}
```

---

### 7. Assign Structures (User-Structure Assignment)

#### 7.1 List Assignments

**Endpoint:** `GET /api/settings/assign-structures`  
**Authentication:** Required (super_admin, admin)

##### Query Parameters

| Parameter    | Type    | Description         |
| ------------ | ------- | ------------------- |
| user_id      | integer | Filter by user      |
| structure_id | integer | Filter by structure |
| is_active    | boolean | Filter by status    |

##### Success Response (200)

```json
{
    "status": 1,
    "message": null,
    "data": [
        {
            "id": 1,
            "user_id": 15,
            "structure_id": 1,
            "assigned_at": "14-05-2026",
            "is_active": true,
            "frais_integration": 50000,
            "user": {
                "id": 15,
                "full_name": "Mamadou Diallo",
                "telephone": "+224621234567"
            },
            "structure": {
                "id": 1,
                "libelle": "Bureau National"
            }
        }
    ]
}
```

#### 7.2 Assign User to Structure

**Endpoint:** `POST /api/settings/assign-structures`  
**Authentication:** Required (super_admin, admin)

##### Request Body

```json
{
    "user_id": 15,
    "structure_id": 2,
    "assigned_at": "2026-05-14",
    "is_active": true,
    "frais_integration": 50000
}
```

##### Field Validation

| Field             | Type    | Required | Validation         |
| ----------------- | ------- | -------- | ------------------ |
| user_id           | integer | Yes      | Must exist         |
| structure_id      | integer | Yes      | Must exist         |
| assigned_at       | date    | No       | Default: today     |
| is_active         | boolean | No       | Default: true      |
| frais_integration | numeric | No       | Min: 0, Default: 0 |

##### Success Response (201)

```json
{
    "status": 1,
    "message": "Assignation créée avec succès.",
    "data": {
        "id": 5,
        "user_id": 15,
        "structure_id": 2,
        "assigned_at": "14-05-2026",
        "is_active": true,
        "frais_integration": 50000
    }
}
```

---

### 8. Assign Statuts (User-Position Assignment)

#### API Resource: `/api/settings/assign-statuts`

Same CRUD structure as Assign Structures.

##### Request Body Example

```json
{
    "user_id": 15,
    "statut_id": 1,
    "structure_id": 2,
    "assigned_at": "2026-05-14",
    "is_active": true
}
```

---

## Gestion (Management) Module

### 1. Init Cotisations (Initialize Contributions)

#### 1.1 List Init Cotisations

**Endpoint:** `GET /api/gestion/init-cotisations`  
**Authentication:** Required

##### Query Parameters

| Parameter          | Type    | Description                 |
| ------------------ | ------- | --------------------------- |
| type_cotisation_id | integer | Filter by type              |
| structure_id       | integer | Filter by structure         |
| is_completed       | boolean | Filter by completion status |

##### Success Response (200)

```json
{
    "status": 1,
    "message": null,
    "data": [
        {
            "id": 1,
            "type_cotisation_id": 1,
            "structure_id": 1,
            "libelle": "Cotisation Mai 2026",
            "description": "Cotisation mensuelle pour mai 2026",
            "is_completed": false,
            "created_at": "14-05-2026 08:00:00",
            "type_cotisation": {
                "id": 1,
                "libelle": "Cotisation Mensuelle",
                "montant": 50000
            },
            "structure": {
                "id": 1,
                "libelle": "Bureau National"
            },
            "cotisations": [
                {
                    "id": 1,
                    "user_id": 15,
                    "amount": 50000,
                    "paid_at": "14-05-2026",
                    "user": {
                        "id": 15,
                        "full_name": "Mamadou Diallo"
                    }
                }
            ]
        }
    ]
}
```

#### 1.2 Create Init Cotisation

**Endpoint:** `POST /api/gestion/init-cotisations`  
**Authentication:** Required

##### Request Body

```json
{
    "type_cotisation_id": 1,
    "structure_id": 1,
    "libelle": "Cotisation Juin 2026",
    "description": "Cotisation mensuelle pour juin 2026",
    "is_completed": false,
    "cotisations": [
        {
            "user_id": 15,
            "amount": 50000,
            "paid_at": "2026-06-01"
        },
        {
            "user_id": 20,
            "amount": 50000,
            "paid_at": null
        }
    ]
}
```

##### Field Validation

| Field                  | Type    | Required | Validation           |
| ---------------------- | ------- | -------- | -------------------- |
| type_cotisation_id     | integer | Yes      | Must exist           |
| structure_id           | integer | Yes      | Must exist           |
| libelle                | string  | Yes      | Max: 255             |
| description            | string  | No       | -                    |
| is_completed           | boolean | No       | Default: false       |
| cotisations            | array   | No       | Array of cotisations |
| cotisations.\*.user_id | integer | Yes      | Must exist           |
| cotisations.\*.amount  | numeric | Yes      | Min: 0               |
| cotisations.\*.paid_at | date    | No       | -                    |

##### Success Response (201)

```json
{
    "status": 1,
    "message": "Initialisation de cotisation créée avec succès.",
    "data": {
        "id": 2,
        "libelle": "Cotisation Juin 2026",
        "is_completed": false,
        "cotisations": [
            {
                "id": 5,
                "user_id": 15,
                "amount": 50000,
                "paid_at": "01-06-2026"
            }
        ]
    }
}
```

#### 1.3 Toggle Completed Status

**Endpoint:** `POST /api/gestion/init-cotisations/{id}/toggle-completed`  
**Authentication:** Required

##### Success Response (200)

```json
{
    "status": 1,
    "message": "Statut de complétion modifié avec succès.",
    "data": {
        "id": 1,
        "is_completed": true
    }
}
```

---

### 2. Cotisations (Individual Contribution Payments)

#### 2.1 List Cotisations

**Endpoint:** `GET /api/gestion/cotisations`  
**Authentication:** Required

##### Query Parameters

| Parameter          | Type    | Description               |
| ------------------ | ------- | ------------------------- |
| init_cotisation_id | integer | Filter by init cotisation |
| user_id            | integer | Filter by user            |
| paid               | boolean | Filter by payment status  |

##### Success Response (200)

```json
{
    "status": 1,
    "message": null,
    "data": [
        {
            "id": 1,
            "init_cotisation_id": 1,
            "user_id": 15,
            "amount": 50000,
            "paid_at": "14-05-2026",
            "created_at": "14-05-2026 08:30:00",
            "user": {
                "id": 15,
                "full_name": "Mamadou Diallo",
                "avatar_url": "https://..."
            },
            "init_cotisation": {
                "id": 1,
                "libelle": "Cotisation Mai 2026"
            }
        }
    ]
}
```

#### 2.2 Create Cotisation

**Endpoint:** `POST /api/gestion/cotisations`  
**Authentication:** Required

##### Request Body

```json
{
    "init_cotisation_id": 1,
    "user_id": 15,
    "amount": 50000,
    "paid_at": "2026-05-14"
}
```

##### Success Response (201)

```json
{
    "status": 1,
    "message": "Cotisation enregistrée avec succès.",
    "data": {
        "id": 10,
        "user_id": 15,
        "amount": 50000,
        "paid_at": "14-05-2026"
    }
}
```

---

### 3. Réunions (Meetings)

#### 3.1 List Réunions

**Endpoint:** `GET /api/gestion/reunions`  
**Authentication:** Required

##### Query Parameters

| Parameter    | Type    | Description                                |
| ------------ | ------- | ------------------------------------------ |
| type         | string  | Filter: `generale` or `structure`          |
| structure_id | integer | Filter by structure                        |
| status       | string  | Filter: `pending`, `completed`, `canceled` |
| date_from    | date    | Filter from date                           |
| date_to      | date    | Filter to date                             |

##### Success Response (200)

```json
{
    "status": 1,
    "message": null,
    "data": [
        {
            "id": 1,
            "type": "generale",
            "structure_id": null,
            "libelle": "Assemblée Générale 2026",
            "description": "Réunion annuelle de tous les membres",
            "date_reunion": "20-06-2026",
            "heure_debut": "09:00",
            "heure_fin": "12:00",
            "lieu": "Salle de conférence, Conakry",
            "points_reunion": [
                "Bilan financier 2025",
                "Plan d'action 2026",
                "Élection du bureau"
            ],
            "proces_verbal": "Le procès-verbal complet...",
            "status": "pending",
            "created_at": "14-05-2026 10:00:00",
            "participants": [
                {
                    "id": 1,
                    "user_id": 15,
                    "status": "pending",
                    "user": {
                        "id": 15,
                        "full_name": "Mamadou Diallo"
                    }
                }
            ]
        }
    ]
}
```

#### 3.2 Create Réunion

**Endpoint:** `POST /api/gestion/reunions`  
**Authentication:** Required

##### Request Body

```json
{
    "type": "structure",
    "structure_id": 1,
    "libelle": "Réunion Mensuelle Bureau National",
    "description": "Discussion des activités du mois",
    "date_reunion": "2026-05-25",
    "heure_debut": "14:00",
    "heure_fin": "16:00",
    "lieu": "Bureau National, Conakry",
    "points_reunion": [
        "Suivi des cotisations",
        "Organisation événement",
        "Divers"
    ],
    "status": "pending"
}
```

##### Field Validation

| Field          | Type    | Required    | Validation                                 |
| -------------- | ------- | ----------- | ------------------------------------------ |
| type           | string  | Yes         | Values: `generale`, `structure`            |
| structure_id   | integer | Conditional | Required if type = `structure`             |
| libelle        | string  | Yes         | Max: 255                                   |
| description    | string  | No          | -                                          |
| date_reunion   | date    | Yes         | Must be today or future                    |
| heure_debut    | time    | Yes         | Format: HH:MM                              |
| heure_fin      | time    | Yes         | Format: HH:MM, Must be after heure_debut   |
| lieu           | string  | No          | Max: 255                                   |
| points_reunion | array   | No          | Array of strings                           |
| status         | string  | No          | Values: `pending`, `completed`, `canceled` |

##### Success Response (201)

```json
{
    "status": 1,
    "message": "Réunion créée avec succès. Les participants ont été notifiés par SMS.",
    "data": {
        "id": 5,
        "type": "structure",
        "libelle": "Réunion Mensuelle Bureau National",
        "date_reunion": "25-05-2026",
        "heure_debut": "14:00",
        "heure_fin": "16:00",
        "status": "pending"
    }
}
```

---

### 4. Participants (Meeting Participants)

#### 4.1 List Participants

**Endpoint:** `GET /api/gestion/participants`  
**Authentication:** Required

##### Query Parameters

| Parameter  | Type    | Description                            |
| ---------- | ------- | -------------------------------------- |
| reunion_id | integer | Filter by meeting                      |
| user_id    | integer | Filter by user                         |
| status     | string  | Filter: `pending`, `present`, `absent` |

##### Success Response (200)

```json
{
    "status": 1,
    "message": null,
    "data": [
        {
            "id": 1,
            "reunion_id": 1,
            "user_id": 15,
            "status": "present",
            "user": {
                "id": 15,
                "full_name": "Mamadou Diallo",
                "avatar_url": "https://..."
            },
            "reunion": {
                "id": 1,
                "libelle": "Assemblée Générale 2026",
                "date_reunion": "20-06-2026"
            }
        }
    ]
}
```

#### 4.2 Update Participant Status

**Endpoint:** `PUT /api/gestion/participants/{id}`  
**Authentication:** Required

##### Request Body

```json
{
    "status": "present"
}
```

##### Field Validation

| Field  | Type   | Required | Validation                             |
| ------ | ------ | -------- | -------------------------------------- |
| status | string | Yes      | Values: `pending`, `present`, `absent` |

##### Success Response (200)

```json
{
    "status": 1,
    "message": "Statut du participant mis à jour avec succès.",
    "data": {
        "id": 1,
        "status": "present"
    }
}
```

---

### 5. Dons (Donations)

#### 5.1 List Dons

**Endpoint:** `GET /api/gestion/dons`  
**Authentication:** Required

##### Query Parameters

| Parameter    | Type    | Description         |
| ------------ | ------- | ------------------- |
| type_don_id  | integer | Filter by type      |
| structure_id | integer | Filter by structure |
| user_id      | integer | Filter by donor     |
| date_from    | date    | Filter from date    |
| date_to      | date    | Filter to date      |

##### Success Response (200)

```json
{
    "status": 1,
    "message": null,
    "data": [
        {
            "id": 1,
            "type_don_id": 1,
            "structure_id": 1,
            "user_id": 15,
            "montant": 100000,
            "commentaire": "Don pour soutenir les activités",
            "created_at": "14-05-2026 09:00:00",
            "type_don": {
                "id": 1,
                "libelle": "Don en Espèces"
            },
            "structure": {
                "id": 1,
                "libelle": "Bureau National"
            },
            "user": {
                "id": 15,
                "full_name": "Mamadou Diallo"
            }
        }
    ]
}
```

#### 5.2 Create Don

**Endpoint:** `POST /api/gestion/dons`  
**Authentication:** Required

##### Request Body

```json
{
    "type_don_id": 1,
    "structure_id": 1,
    "user_id": 15,
    "montant": 150000,
    "commentaire": "Don pour l'événement annuel"
}
```

##### Field Validation

| Field        | Type    | Required | Validation |
| ------------ | ------- | -------- | ---------- |
| type_don_id  | integer | Yes      | Must exist |
| structure_id | integer | Yes      | Must exist |
| user_id      | integer | Yes      | Must exist |
| montant      | numeric | Yes      | Min: 0     |
| commentaire  | string  | No       | Max: 1000  |

##### Success Response (201)

```json
{
    "status": 1,
    "message": "Don enregistré avec succès.",
    "data": {
        "id": 5,
        "montant": 150000,
        "created_at": "14-05-2026 11:30:00"
    }
}
```

---

### 6. Dépenses (Expenses)

#### 6.1 List Dépenses

**Endpoint:** `GET /api/gestion/depenses`  
**Authentication:** Required

##### Query Parameters

Same as Dons (type_depense_id, structure_id, date_from, date_to)

##### Success Response (200)

```json
{
    "status": 1,
    "message": null,
    "data": [
        {
            "id": 1,
            "type_depense_id": 1,
            "structure_id": 1,
            "montant": 75000,
            "commentaire": "Déplacement pour réunion régionale",
            "created_at": "14-05-2026 10:00:00",
            "type_depense": {
                "id": 1,
                "libelle": "Frais de Déplacement"
            },
            "structure": {
                "id": 1,
                "libelle": "Bureau National"
            }
        }
    ]
}
```

#### 6.2 Create Dépense

**Endpoint:** `POST /api/gestion/depenses`  
**Authentication:** Required

##### Request Body

```json
{
    "type_depense_id": 1,
    "structure_id": 1,
    "montant": 120000,
    "commentaire": "Achat matériel de bureau"
}
```

##### Field Validation

| Field           | Type    | Required | Validation |
| --------------- | ------- | -------- | ---------- |
| type_depense_id | integer | Yes      | Must exist |
| structure_id    | integer | Yes      | Must exist |
| montant         | numeric | Yes      | Min: 0     |
| commentaire     | string  | No       | Max: 1000  |

---

### 7. Sanctions

#### 7.1 List Sanctions

**Endpoint:** `GET /api/gestion/sanctions`  
**Authentication:** Required

##### Query Parameters

| Parameter        | Type    | Description               |
| ---------------- | ------- | ------------------------- |
| type_sanction_id | integer | Filter by type            |
| structure_id     | integer | Filter by structure       |
| user_id          | integer | Filter by sanctioned user |

##### Success Response (200)

```json
{
    "status": 1,
    "message": null,
    "data": [
        {
            "id": 1,
            "type_sanction_id": 1,
            "structure_id": 1,
            "user_id": 20,
            "montant": 25000,
            "commentaire": "Absence répétée aux réunions",
            "created_at": "14-05-2026 11:00:00",
            "type_sanction": {
                "id": 1,
                "libelle": "Avertissement"
            },
            "structure": {
                "id": 1,
                "libelle": "Bureau National"
            },
            "user": {
                "id": 20,
                "full_name": "Aissatou Bah"
            }
        }
    ]
}
```

#### 7.2 Create Sanction

**Endpoint:** `POST /api/gestion/sanctions`  
**Authentication:** Required

##### Request Body

```json
{
    "type_sanction_id": 1,
    "structure_id": 1,
    "user_id": 20,
    "montant": 25000,
    "commentaire": "Manquement aux règles du syndicat"
}
```

##### Field Validation

Same as Dons structure.

---

## Error Handling

### Validation Errors (422)

```json
{
    "status": 0,
    "message": "Erreur de validation.",
    "error": {
        "field_name": ["Le champ est obligatoire.", "Le format est invalide."],
        "another_field": ["Cette valeur existe déjà."]
    }
}
```

### Unauthorized (401)

```json
{
    "status": 0,
    "message": "Non authentifié.",
    "error": {}
}
```

### Forbidden (403)

```json
{
    "status": 0,
    "message": "Action non autorisée.",
    "error": {
        "permission": "Vous n'avez pas les permissions nécessaires."
    }
}
```

### Not Found (404)

```json
{
    "status": 0,
    "message": "Ressource introuvable.",
    "error": {
        "resource": "L'élément demandé n'existe pas."
    }
}
```

### Server Error (500)

```json
{
    "status": 0,
    "message": "Une erreur s'est produite sur le serveur.",
    "error": {
        "error": "Message d'erreur détaillé"
    }
}
```

---

## TanStack Query Integration

### Setup

#### 1. Install Dependencies

```bash
npm install @tanstack/react-query
npm install @tanstack/react-query-devtools
```

#### 2. Configure Query Client

```javascript
// src/lib/queryClient.js
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false,
            retry: 1,
        },
        mutations: {
            retry: 1,
        },
    },
});
```

#### 3. Setup Provider

```javascript
// src/App.jsx
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient";

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            {/* Your app */}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
```

### API Client Setup

#### Create Axios Instance

```javascript
// src/lib/apiClient.js
import axios from "axios";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// Add auth token interceptor
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("auth_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Handle response errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Redirect to login
            localStorage.removeItem("auth_token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    },
);

export default apiClient;
```

### API Services

#### Auth Service

```javascript
// src/services/authService.js
import apiClient from "../lib/apiClient";

export const authService = {
    // Register
    register: async (data) => {
        const formData = new FormData();
        Object.keys(data).forEach((key) => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        const response = await apiClient.post("/auth/register", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    // Login
    login: async (credentials) => {
        const response = await apiClient.post("/auth/login", credentials);
        return response.data;
    },

    // Verify OTP
    verifyOtp: async (data) => {
        const response = await apiClient.post("/auth/verify-otp", data);
        return response.data;
    },

    // Resend OTP
    resendOtp: async (telephone) => {
        const response = await apiClient.post("/auth/resend-otp", {
            telephone,
        });
        return response.data;
    },

    // Logout
    logout: async () => {
        const response = await apiClient.post("/auth/logout");
        return response.data;
    },

    // Get authenticated user
    getCurrentUser: async () => {
        const response = await apiClient.get("/user");
        return response.data;
    },
};
```

#### Users Service

```javascript
// src/services/userService.js
import apiClient from "../lib/apiClient";

export const userService = {
    // Get users list
    getUsers: async (params) => {
        const response = await apiClient.get("/users", { params });
        return response.data;
    },

    // Create user
    createUser: async (data) => {
        const response = await apiClient.post("/users", data);
        return response.data;
    },

    // Approve user
    approveUser: async (userId) => {
        const response = await apiClient.post(`/users/${userId}/approve`);
        return response.data;
    },

    // Toggle active status
    toggleActive: async (userId) => {
        const response = await apiClient.post(`/users/${userId}/toggle-active`);
        return response.data;
    },

    // Update profile
    updateProfile: async (data) => {
        const formData = new FormData();
        Object.keys(data).forEach((key) => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        const response = await apiClient.post("/profile", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    // Change password
    changePassword: async (data) => {
        const response = await apiClient.post("/profile/change-password", data);
        return response.data;
    },
};
```

### React Hooks Examples

#### useAuth Hook

```javascript
// src/hooks/useAuth.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/authService";

export const useAuth = () => {
    const queryClient = useQueryClient();

    // Get current user
    const { data: user, isLoading } = useQuery({
        queryKey: ["currentUser"],
        queryFn: authService.getCurrentUser,
        enabled: !!localStorage.getItem("auth_token"),
    });

    // Register mutation
    const registerMutation = useMutation({
        mutationFn: authService.register,
        onSuccess: (data) => {
            // Handle success (show message, redirect)
        },
    });

    // Login mutation
    const loginMutation = useMutation({
        mutationFn: authService.login,
        onSuccess: (data) => {
            if (data.token) {
                localStorage.setItem("auth_token", data.token);
                queryClient.setQueryData(["currentUser"], data.data);
            }
        },
    });

    // Verify OTP mutation
    const verifyOtpMutation = useMutation({
        mutationFn: authService.verifyOtp,
        onSuccess: (data) => {
            if (data.token) {
                localStorage.setItem("auth_token", data.token);
                queryClient.setQueryData(["currentUser"], data.data);
            }
        },
    });

    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: authService.logout,
        onSuccess: () => {
            localStorage.removeItem("auth_token");
            queryClient.clear();
        },
    });

    return {
        user: user?.data,
        isLoading,
        register: registerMutation.mutate,
        login: loginMutation.mutate,
        verifyOtp: verifyOtpMutation.mutate,
        logout: logoutMutation.mutate,
        isRegistering: registerMutation.isPending,
        isLoggingIn: loginMutation.isPending,
        isVerifying: verifyOtpMutation.isPending,
    };
};
```

#### useUsers Hook

```javascript
// src/hooks/useUsers.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/userService";

export const useUsers = (filters = {}) => {
    const queryClient = useQueryClient();

    // Get users
    const { data, isLoading, error } = useQuery({
        queryKey: ["users", filters],
        queryFn: () => userService.getUsers(filters),
    });

    // Approve user
    const approveMutation = useMutation({
        mutationFn: userService.approveUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });

    // Toggle active
    const toggleActiveMutation = useMutation({
        mutationFn: userService.toggleActive,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });

    return {
        users: data?.data?.data || [],
        pagination: {
            currentPage: data?.data?.current_page,
            lastPage: data?.data?.last_page,
            total: data?.data?.total,
            perPage: data?.data?.per_page,
        },
        isLoading,
        error,
        approveUser: approveMutation.mutate,
        toggleActive: toggleActiveMutation.mutate,
        isApproving: approveMutation.isPending,
    };
};
```

#### useReunions Hook

```javascript
// src/hooks/useReunions.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../lib/apiClient";

const reunionService = {
    getReunions: async (params) => {
        const response = await apiClient.get("/gestion/reunions", { params });
        return response.data;
    },
    getReunion: async (id) => {
        const response = await apiClient.get(`/gestion/reunions/${id}`);
        return response.data;
    },
    createReunion: async (data) => {
        const response = await apiClient.post("/gestion/reunions", data);
        return response.data;
    },
    updateReunion: async ({ id, data }) => {
        const response = await apiClient.put(`/gestion/reunions/${id}`, data);
        return response.data;
    },
    deleteReunion: async (id) => {
        const response = await apiClient.delete(`/gestion/reunions/${id}`);
        return response.data;
    },
};

export const useReunions = (filters = {}) => {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["reunions", filters],
        queryFn: () => reunionService.getReunions(filters),
    });

    const createMutation = useMutation({
        mutationFn: reunionService.createReunion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reunions"] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: reunionService.updateReunion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reunions"] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: reunionService.deleteReunion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reunions"] });
        },
    });

    return {
        reunions: data?.data || [],
        isLoading,
        createReunion: createMutation.mutate,
        updateReunion: updateMutation.mutate,
        deleteReunion: deleteMutation.mutate,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
};
```

### Component Usage Examples

#### Login Component

```javascript
// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
    const [credentials, setCredentials] = useState({ login: "", password: "" });
    const { login, isLoggingIn } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        login(credentials, {
            onSuccess: () => {
                // Redirect to dashboard
                window.location.href = "/dashboard";
            },
            onError: (error) => {
                // Show error message
                console.error(error);
            },
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Input
                type="text"
                placeholder="Email ou Téléphone"
                value={credentials.login}
                onChange={(e) =>
                    setCredentials({ ...credentials, login: e.target.value })
                }
            />
            <Input
                type="password"
                placeholder="Mot de passe"
                value={credentials.password}
                onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                }
            />
            <Button type="submit" disabled={isLoggingIn}>
                {isLoggingIn ? "Connexion..." : "Se connecter"}
            </Button>
        </form>
    );
}
```

#### Users List Component

```javascript
// src/pages/Users.jsx
import { useUsers } from "../hooks/useUsers";
import { Button } from "@/components/ui/button";

export default function Users() {
    const { users, isLoading, approveUser, pagination } = useUsers({
        is_approved: false,
    });

    if (isLoading) return <div>Chargement...</div>;

    return (
        <div>
            <h1>Utilisateurs en attente d'approbation</h1>
            <div className="grid gap-4">
                {users.map((user) => (
                    <div key={user.id} className="card">
                        <h3>{user.full_name}</h3>
                        <p>{user.email}</p>
                        <p>{user.telephone}</p>
                        <Button onClick={() => approveUser(user.id)}>
                            Approuver
                        </Button>
                    </div>
                ))}
            </div>
            {/* Pagination component */}
        </div>
    );
}
```

---

## Additional Notes

### File Uploads

- Use `multipart/form-data` content type for file uploads
- Avatar images are stored in Cloudflare R2
- Maximum file sizes:
    - Avatar: 1MB (png, jpg, jpeg)
    - Structure logo: 2MB (png, jpg, jpeg, svg)

### Phone Number Format

- Guinea phone numbers: `+2246XXXXXXXX` or `2246XXXXXXXX`
- Always starts with country code 224
- Followed by digit 6 and 8 more digits

### Date Formats

- **Request:** `Y-m-d` (2026-05-14)
- **Response:** `d-m-Y` (14-05-2026)
- **DateTime Response:** `d-m-Y H:i:s` (14-05-2026 10:30:45)

### Pagination

- Default: 15 items per page
- Use `per_page` query parameter to adjust
- Response includes: `current_page`, `last_page`, `total`, `per_page`, `next_page_url`, `prev_page_url`

### SMS Notifications

- OTP codes expire after 10 minutes
- Meeting invitations sent automatically to all structure members
- Account creation confirmation sent to users

### Role-Based Access

- **super_admin:** Full access to all endpoints
- **admin:** Access to all endpoints except user role management
- **trésorier:** Access to financial modules
- **secrétaire:** Access to meeting management
- **membre:** Read access to own data

---

**Last Updated:** May 14, 2026  
**Maintained By:** SNAESURS Development Team  
**Support:** dev@snaesurs.gn
