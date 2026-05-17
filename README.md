# Système de Gestion Syndicale - Guinée

Un système complet de gestion pour les syndicats en Guinée, développé avec Laravel 12 et PHP 8.2+.

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Sécurité](#sécurité)
- [Tests](#tests)
- [Contribution](#contribution)

## 🚀 Fonctionnalités

### Authentification et Gestion des Utilisateurs
- Inscription et connexion par email ou téléphone
- Authentification par OTP (SMS) via Nimba SMS
- Authentification par mot de passe
- Système de rôles: super_admin, admin, membre, trésorier, secrétaire
- Approbation des nouveaux utilisateurs par les administrateurs
- Gestion du profil utilisateur avec avatar (Cloudflare R2)

### Gestion des Structures et Statuts
- Création et gestion de structures syndicales (bureaux régionaux, etc.)
- Gestion des statuts (Secrétaire Général, Trésorier, etc.)
- Attribution de structures aux utilisateurs
- Attribution de statuts aux utilisateurs

### Gestion des Cotisations
- Définition des types de cotisations
- Initialisation des cotisations par structure
- Enregistrement des paiements de cotisations
- Suivi des cotisations par membre

### Gestion des Réunions
- Création et planification de réunions
- Gestion automatique des participants par structure
- Suivi de la présence (Présent, Absent, En attente)
- Notification SMS des participants

### Gestion Financière
- Enregistrement des dons (espèces, nature, etc.)
- Gestion des dépenses par catégorie
- Traçabilité des transactions financières
- Filtrage par structure

### Gestion des Sanctions
- Enregistrement des sanctions disciplinaires
- Types de sanctions: avertissement, blâme, suspension, exclusion, etc.
- Historique des sanctions par membre

## 📦 Prérequis

- PHP >= 8.2
- Composer
- MySQL ou SQLite
- Node.js et NPM (pour les assets front-end)
- Un compte Nimba SMS pour l'envoi des OTP
- Un compte Cloudflare R2 pour le stockage des fichiers (optionnel)

## 🔧 Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd gestion-syndicale
```

### 2. Installer les dépendances

```bash
composer install
npm install
```

### 3. Configuration de l'environnement

```bash
cp .env.example .env
php artisan key:generate
```

### 4. Configurer la base de données

Éditer le fichier `.env` avec vos paramètres de base de données:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gestion_syndicale
DB_USERNAME=root
DB_PASSWORD=
```

### 5. Exécuter les migrations et seeders

```bash
php artisan migrate --seed
```

Cela créera:
- Un super administrateur: `admin@gestion-syndicale.gn` / `password123`
- Un administrateur: `administrateur@gestion-syndicale.gn` / `password123`
- 5 structures régionales (Bureau National, Kindia, Labé, Kankan, N'Zérékoré)
- 10 statuts prédéfinis
- Types de cotisations, dons, dépenses et sanctions

### 6. Configuration du stockage

Pour utiliser Cloudflare R2:

```env
FILESYSTEM_DISK=r2
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET=your_bucket_name
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_URL=https://your-public-url.com
```

### 7. Configuration Nimba SMS

```env
NIMBA_URL=https://api.nimbasms.com
NIMBA_BASIC_TOKEN=your_basic_token
NIMBA_SECRET_TOKEN=your_secret_token
NIMBA_SENDER=YourSenderName
NIMBA_SERVICE_ID=your_service_id
```

### 8. Démarrer le serveur

```bash
php artisan serve
```

Le serveur sera accessible à `http://localhost:8000`.

### 9. Compiler les assets (optionnel)

```bash
npm run dev
```

## ⚙️ Configuration

### Constants de l'application

Les constantes de l'application sont définies dans `config/constants.php` et peuvent être configurées via les variables d'environnement:

```env
# Pagination
PAGINATION_PER_PAGE=15
PAGINATION_MAX_PER_PAGE=100

# OTP
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_RATE_LIMIT=3
OTP_RATE_LIMIT_DECAY=60

# Sécurité
PASSWORD_MIN_LENGTH=8
ENCRYPT_OTP=true

# Upload
UPLOAD_MAX_FILE_SIZE=10240
SMS_MAX_LENGTH=160
```

### Queue Worker

Pour traiter les SMS en arrière-plan:

```bash
php artisan queue:work
```

En production, utilisez Supervisor ou un gestionnaire de processus similaire.

## 🏗️ Architecture

### Structure du Projet

```
app/
├── Enums/              # Énumérations type-safe
│   ├── UserRole.php
│   ├── Genre.php
│   ├── ReunionStatus.php
│   └── ParticipantStatus.php
├── Events/             # Événements Laravel
│   ├── SendMessageEvent.php
│   └── SendMessageToManyEvent.php
├── Exceptions/         # Exceptions personnalisées
│   ├── BusinessException.php
│   ├── ResourceNotFoundException.php
│   └── UnauthorizedException.php
├── Http/
│   ├── Controllers/    # Contrôleurs API
│   │   ├── Auth/
│   │   ├── Gestion/
│   │   └── Settings/
│   ├── Middleware/     # Middlewares
│   │   └── CheckRole.php
│   ├── Requests/       # Form Requests
│   └── Resources/      # API Resources
├── Listeners/          # Listeners d'événements
├── Models/             # Modèles Eloquent
├── Services/           # Services métier
│   ├── PermissionService.php
│   └── SmsService.php
└── Traits/             # Traits réutilisables
    ├── ApiResponses.php
    ├── CloudflareUpload.php
    └── ImageUpload.php
```

### Rôles et Permissions

- **super_admin**: Accès complet, peut tout faire
- **admin**: Gestion complète après avoir un statut actif
- **membre**: Consultation et opérations limitées à sa structure
- **trésorier**: Spécialisé dans la gestion financière
- **secrétaire**: Gestion administrative

## 📚 API Endpoints

### Authentification

```
POST /api/auth/register              - Inscription
POST /api/auth/login                 - Connexion (email/téléphone + password/OTP)
POST /api/auth/verify-otp            - Vérification OTP
POST /api/auth/resend-otp            - Renvoyer OTP
POST /api/auth/logout                - Déconnexion
```

### Profil

```
GET  /api/user                       - Obtenir l'utilisateur connecté
PUT  /api/profile                    - Mettre à jour le profil
POST /api/profile/change-password    - Changer le mot de passe
```

### Utilisateurs (admin/super_admin uniquement)

```
GET  /api/users                      - Liste des utilisateurs
POST /api/users                      - Créer un utilisateur
POST /api/users/{id}/approve         - Approuver un utilisateur
POST /api/users/{id}/toggle-active   - Activer/Désactiver un utilisateur
```

### Paramètres (admin/super_admin uniquement)

```
CRUD /api/settings/structures              - Gestion des structures
CRUD /api/settings/statuts                 - Gestion des statuts
CRUD /api/settings/type-cotisations        - Types de cotisations
CRUD /api/settings/type-dons               - Types de dons
CRUD /api/settings/type-depenses           - Types de dépenses
CRUD /api/settings/type-sanctions          - Types de sanctions
CRUD /api/settings/assign-structures       - Attribution structures
CRUD /api/settings/assign-statuts          - Attribution statuts
```

### Gestion

```
CRUD /api/gestion/init-cotisations         - Initialisation cotisations
CRUD /api/gestion/cotisations              - Cotisations
CRUD /api/gestion/reunions                 - Réunions
CRUD /api/gestion/participants             - Participants (lecture/mise à jour uniquement)
CRUD /api/gestion/dons                     - Dons
CRUD /api/gestion/sanctions                - Sanctions
CRUD /api/gestion/depenses                 - Dépenses
```

Toutes les routes protégées nécessitent un token Bearer dans l'en-tête:
```
Authorization: Bearer {token}
```

## 🔒 Sécurité

### Mesures de Sécurité Implémentées

1. **Authentification sécurisée**
   - Tokens Sanctum pour l'API
   - OTP chiffrés en cache
   - Rate limiting sur les OTP (3 tentatives/heure)

2. **Contrôle d'accès**
   - Middleware de rôles
   - Validation des permissions par structure
   - Vérification des statuts actifs

3. **Protection des données**
   - Validation stricte des entrées (FormRequests)
   - Exceptions personnalisées
   - Messages d'erreur génériques en production

4. **Stockage sécurisé**
   - Mots de passe hashés (bcrypt)
   - OTP chiffrés
   - Files uploadés sur Cloudflare R2

### Best Practices

- Toujours utiliser HTTPS en production
- Configurer CORS correctement
- Activer `APP_DEBUG=false` en production
- Utiliser des variables d'environnement pour les secrets
- Sauvegarder régulièrement la base de données
- Monitorer les logs d'erreur

## 🧪 Tests

```bash
# Exécuter tous les tests
php artisan test

# Tests avec couverture
php artisan test --coverage

# Tests spécifiques
php artisan test --filter AuthenticationTest
```

## 📝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence propriétaire. Tous droits réservés.

## 👥 Support

Pour toute question ou support:
- Email: support@gestion-syndicale.gn
- Téléphone: +224 622 00 00 00

## 🙏 Remerciements

- Laravel Framework
- Nimba SMS
- Cloudflare R2
- Communauté open-source

---

Développé avec ❤️ pour les syndicats de Guinée


## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework. You can also check out [Laravel Learn](https://laravel.com/learn), where you will be guided through building a modern Laravel application.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
