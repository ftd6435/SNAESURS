# 🎨 Frontend Implementation Plan

**Projet**: Système de Gestion Syndicale - Guinée  
**Date**: 2026-05-14  
**Tech Stack**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui

---

## 📋 Table des matières

1. [Vue d'ensemble API](#1-vue-densemble-api)
2. [Architecture Frontend](#2-architecture-frontend)
3. [Structure du Projet](#3-structure-du-projet)
4. [Étapes d'implémentation](#4-étapes-dimplémentation)
5. [Pages & Composants](#5-pages--composants)
6. [Gestion d'État](#6-gestion-détat)
7. [API Integration](#7-api-integration)
8. [Design System Implementation](#8-design-system-implementation)
9. [Mobile Readiness](#9-mobile-readiness)

---

## 1. Vue d'ensemble API

### 🔐 Authentification

| Endpoint               | Méthode | Description                                |
| ---------------------- | ------- | ------------------------------------------ |
| `/api/auth/register`   | POST    | Inscription utilisateur                    |
| `/api/auth/login`      | POST    | Connexion (email/téléphone + password/OTP) |
| `/api/auth/verify-otp` | POST    | Vérification OTP                           |
| `/api/auth/resend-otp` | POST    | Renvoyer OTP                               |
| `/api/auth/logout`     | POST    | Déconnexion                                |

### 👥 Utilisateurs

| Endpoint                        | Méthode | Description                                  |
| ------------------------------- | ------- | -------------------------------------------- |
| `/api/users`                    | GET     | Liste des utilisateurs (pagination, filtres) |
| `/api/users`                    | POST    | Créer un utilisateur                         |
| `/api/users/{id}/approve`       | POST    | Approuver un utilisateur                     |
| `/api/users/{id}/toggle-active` | POST    | Activer/Désactiver                           |
| `/api/profile`                  | PUT     | Mettre à jour le profil                      |
| `/api/profile/change-password`  | POST    | Changer le mot de passe                      |

### ⚙️ Paramètres

| Module            | Endpoint                          | CRUD |
| ----------------- | --------------------------------- | ---- |
| Structures        | `/api/settings/structures`        | ✅   |
| Statuts           | `/api/settings/statuts`           | ✅   |
| Types Cotisations | `/api/settings/type-cotisations`  | ✅   |
| Types Dons        | `/api/settings/type-dons`         | ✅   |
| Types Dépenses    | `/api/settings/type-depenses`     | ✅   |
| Types Sanctions   | `/api/settings/type-sanctions`    | ✅   |
| Assign Structures | `/api/settings/assign-structures` | ✅   |
| Assign Statuts    | `/api/settings/assign-statuts`    | ✅   |

### 📊 Gestion

| Module           | Endpoint                        | CRUD |
| ---------------- | ------------------------------- | ---- |
| Init Cotisations | `/api/gestion/init-cotisations` | ✅   |
| Cotisations      | `/api/gestion/cotisations`      | ✅   |
| Réunions         | `/api/gestion/reunions`         | ✅   |
| Participants     | `/api/gestion/participants`     | R/U  |
| Dons             | `/api/gestion/dons`             | ✅   |
| Sanctions        | `/api/gestion/sanctions`        | ✅   |
| Dépenses         | `/api/gestion/depenses`         | ✅   |

### Format de Réponse API

```typescript
interface ApiResponse<T> {
    status: 1 | 0; // 1 = succès, 0 = erreur
    message?: string;
    data?: T;
    token?: string; // Pour login/verify-otp
    error?: Record<string, string[]>; // Pour validation
}
```

---

## 2. Architecture Frontend

### 🛠️ Tech Stack

- **Framework**: React 18.2+
- **Langage**: TypeScript 5.0+
- **Build Tool**: Vite 5.0+
- **Styling**: Tailwind CSS 3.4+
- **UI Components**: shadcn/ui
- **Routing**: React Router v6.20+
- **Data Fetching**: TanStack Query v5.14+
- **State Management**: Zustand (lightweight)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod
- **Dates**: date-fns
- **i18n**: react-i18next (future)

### 🎨 Design System (From GRAPHIC_CHARTER.md)

- **Colors**: Primary Blue (#135796), Secondary Blue (#1E6EC0), Sage Gray (#9BA9A1), Dark Slate (#0D1D23)
- **Typography**: Orbitron (headings), Inter (body)
- **Border Radius**: 18px (cards), 12px (buttons), 8px (inputs)
- **Spacing**: 4px base

---

## 3. Structure du Projet

```
gestion-syndicale/
├── backend/                    # Laravel API (existant)
│   ├── app/
│   ├── public/
│   └── ...
└── frontend/                   # Nouveau: React App
    ├── public/
    │   ├── images/
    │   │   └── logo.png       # Copié depuis backend/public/images/
    │   └── icons/              # PWA icons
    ├── src/
    │   ├── assets/
    │   │   ├── images/
    │   │   └── styles/
    │   │       └── globals.css
    │   ├── components/
    │   │   ├── ui/             # shadcn/ui components
    │   │   │   ├── button.tsx
    │   │   │   ├── input.tsx
    │   │   │   ├── card.tsx
    │   │   │   ├── table.tsx
    │   │   │   ├── dialog.tsx
    │   │   │   ├── badge.tsx
    │   │   │   ├── avatar.tsx
    │   │   │   ├── toast.tsx
    │   │   │   └── ...
    │   │   ├── layout/
    │   │   │   ├── Sidebar.tsx
    │   │   │   ├── Navbar.tsx
    │   │   │   ├── PageContainer.tsx
    │   │   │   └── ProtectedRoute.tsx
    │   │   ├── forms/
    │   │   │   ├── UserForm.tsx
    │   │   │   ├── CotisationForm.tsx
    │   │   │   ├── ReunionForm.tsx
    │   │   │   └── ...
    │   │   └── shared/
    │   │       ├── StatCard.tsx
    │   │       ├── DataTable.tsx
    │   │       ├── StatusBadge.tsx
    │   │       ├── RoleBadge.tsx
    │   │       ├── EmptyState.tsx
    │   │       ├── LoadingState.tsx
    │   │       └── ErrorBoundary.tsx
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── LoginPage.tsx
    │   │   │   ├── RegisterPage.tsx
    │   │   │   ├── OtpVerificationPage.tsx
    │   │   │   └── ForgotPasswordPage.tsx
    │   │   ├── dashboard/
    │   │   │   └── DashboardPage.tsx
    │   │   ├── users/
    │   │   │   ├── UsersListPage.tsx
    │   │   │   ├── UserDetailPage.tsx
    │   │   │   └── UserCreatePage.tsx
    │   │   ├── structures/
    │   │   │   ├── StructuresPage.tsx
    │   │   │   └── StatutsPage.tsx
    │   │   ├── cotisations/
    │   │   │   ├── CotisationsPage.tsx
    │   │   │   └── InitCotisationsPage.tsx
    │   │   ├── reunions/
    │   │   │   ├── ReunionsPage.tsx
    │   │   │   └── ReunionDetailPage.tsx
    │   │   ├── financials/
    │   │   │   ├── DonsPage.tsx
    │   │   │   ├── DepensesPage.tsx
    │   │   │   └── FinancialReportsPage.tsx
    │   │   ├── sanctions/
    │   │   │   └── SanctionsPage.tsx
    │   │   ├── settings/
    │   │   │   ├── SettingsPage.tsx
    │   │   │   ├── ProfilePage.tsx
    │   │   │   └── TypesSettingsPage.tsx
    │   │   └── errors/
    │   │       ├── NotFoundPage.tsx
    │   │       └── ForbiddenPage.tsx
    │   ├── hooks/
    │   │   ├── useAuth.ts
    │   │   ├── useUsers.ts
    │   │   ├── useStructures.ts
    │   │   ├── useCotisations.ts
    │   │   ├── useReunions.ts
    │   │   ├── useFinancials.ts
    │   │   └── useToast.ts
    │   ├── services/
    │   │   ├── api/
    │   │   │   ├── client.ts          # Axios instance
    │   │   │   ├── auth.ts
    │   │   │   ├── users.ts
    │   │   │   ├── settings.ts
    │   │   │   └── gestion.ts
    │   │   └── storage.ts             # LocalStorage helpers
    │   ├── store/
    │   │   ├── useAuthStore.ts
    │   │   └── useUiStore.ts
    │   ├── types/
    │   │   ├── api.ts
    │   │   ├── user.ts
    │   │   ├── settings.ts
    │   │   └── gestion.ts
    │   ├── utils/
    │   │   ├── constants.ts
    │   │   ├── formatters.ts
    │   │   ├── validators.ts
    │   │   └── helpers.ts
    │   ├── lib/
    │   │   ├── utils.ts               # cn(), etc.
    │   │   └── queryClient.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── vite-env.d.ts
    ├── .env
    ├── .env.example
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── components.json
    └── README.md
```

---

## 4. Étapes d'implémentation

### Phase 1: Setup Projet (Priority: High)

1. Initialiser projet React + Vite + TypeScript
2. Configurer Tailwind CSS avec design tokens
3. Installer et configurer shadcn/ui
4. Configurer React Router
5. Configurer TanStack Query
6. Copier le logo depuis `backend/public/images/logo.png`

### Phase 2: Authentification (Priority: High)

1. Créer store d'authentification (Zustand)
2. Implémenter login page (email/téléphone + password/OTP toggle)
3. Implémenter OTP verification page
4. Implémenter register page
5. Créer ProtectedRoute component
6. Implémenter logout

### Phase 3: Layout & Navigation (Priority: High)

1. Créer Sidebar component (responsive)
2. Créer Navbar component (with user profile, notifications)
3. Implémenter PageContainer
4. Configurer la navigation principale

### Phase 4: Dashboard (Priority: High)

1. Créer DashboardPage avec stat cards
2. Implémenter quick actions
3. Ajouter charts (Recharts)

### Phase 5: Modules Principaux (Priority: Medium)

1. **Users Module**: List, Create, Detail, Approve, Toggle Active
2. **Settings Module**: Structures, Statuts, Types
3. **Cotisations Module**: Init, List, Create
4. **Réunions Module**: List, Create, Detail, Participants
5. **Financials Module**: Dons, Dépenses
6. **Sanctions Module**: List, Create

### Phase 6: Profil & Paramètres (Priority: Medium)

1. ProfilePage: Edit profile, Change password
2. SettingsPage: Application settings

### Phase 7: Polish & Testing (Priority: Low)

1. Responsive testing (mobile, tablet, desktop)
2. Accessibility checks
3. Performance optimization
4. Error handling & empty states
5. Animations (Framer Motion)

---

## 5. Pages & Composants

### Authentification

| Page                  | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `LoginPage`           | Formulaire avec toggle email/téléphone et password/OTP |
| `RegisterPage`        | Formulaire d'inscription complet                       |
| `OtpVerificationPage` | Input 6 chiffres avec resend                           |

### Utilisateurs

| Page             | Description                                   |
| ---------------- | --------------------------------------------- |
| `UsersListPage`  | DataTable avec filtres (search, role, status) |
| `UserCreatePage` | Formulaire création utilisateur               |
| `UserDetailPage` | Profil complet avec historique                |

### Dashboard

| Component         | Description                     |
| ----------------- | ------------------------------- |
| `StatCard`        | Carte avec statistique          |
| `DashboardCharts` | Graphiques financiers & membres |
| `RecentActivity`  | Liste des actions récentes      |

---

## 6. Gestion d'État

### Auth Store (Zustand)

```typescript
interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
}
```

### UI Store

```typescript
interface UiState {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
}
```

---

## 7. API Integration

### Axios Client Configuration

```typescript
// src/services/api/client.ts
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Intercepteur pour gérer les erreurs 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Logout user
        }
        return Promise.reject(error);
    },
);
```

### API Services

```typescript
// src/services/api/auth.ts
export const authApi = {
    login: (data: LoginData) => api.post("/auth/login", data),
    verifyOtp: (data: OtpData) => api.post("/auth/verify-otp", data),
    resendOtp: (telephone: string) =>
        api.post("/auth/resend-otp", { telephone }),
    register: (data: RegisterData) => api.post("/auth/register", data),
    logout: () => api.post("/auth/logout"),
};

// src/services/api/users.ts
export const usersApi = {
    getUsers: (params?: UsersFilters) => api.get("/users", { params }),
    createUser: (data: FormData) =>
        api.post("/users", data, {
            headers: { "Content-Type": "multipart/form-data" },
        }),
    approveUser: (id: number) => api.post(`/users/${id}/approve`),
    toggleActive: (id: number) => api.post(`/users/${id}/toggle-active`),
    updateProfile: (data: FormData) =>
        api.put("/profile", data, {
            headers: { "Content-Type": "multipart/form-data" },
        }),
    changePassword: (data: ChangePasswordData) =>
        api.post("/profile/change-password", data),
};
```

### TanStack Query Hooks

```typescript
// src/hooks/useUsers.ts
export const useUsers = (params?: UsersFilters) => {
    return useQuery({
        queryKey: ["users", params],
        queryFn: () => usersApi.getUsers(params),
    });
};

export const useCreateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: usersApi.createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
};
```

---

## 8. Design System Implementation

### Tailwind Config

```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#135796',
          hover: '#1E6EC0',
        },
        secondary: '#1E6EC0',
        sage: '#9BA9A1',
        darkslate: '#0D1D23',
        success: '#1FA750',
        warning: '#E0B63F',
        error: '#D64545',
        accent: {
          wood: '#9C5931',
          beige: '#D9C1A7',
        },
        surface: '#F5F7F7',
      },
      fontFamily: {
        heading: ['Orbitron', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '18px',
        '2xl': '24px',
      },
      fontSize: {
        h1: ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
        h3: ['1.5rem', { lineHeight: '1.4', fontWeight: '500' }],
        h4: ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '500' }],
        body: ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 9. Mobile Readiness

### Pour React Native/Flutter Future

- **API Consistency**: L'API est déjà RESTful et prête pour mobile
- **Authentication**: Token-based (Sanctum) fonctionne sur mobile
- **Data Formats**: JSON standard, compatible avec tous les clients
- **File Upload**: Multipart form-data supporté
- **Pagination**: Déjà implémentée pour les listes

### Recommandations pour Mobile

1. Utiliser les mêmes endpoints
2. Stocker le token de façon sécurisée (Keychain/Keystore)
3. Implémenter refresh token (si nécessaire)
4. Gérer la connectivité offline
5. Push notifications pour SMS OTP (si besoin)

---

## 📦 Dépendances à installer

```json
{
    "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-router-dom": "^6.20.0",
        "@tanstack/react-query": "^5.14.0",
        "zustand": "^4.4.7",
        "axios": "^1.6.2",
        "react-hook-form": "^7.48.2",
        "@hookform/resolvers": "^3.3.2",
        "zod": "^3.22.4",
        "date-fns": "^2.30.0",
        "framer-motion": "^10.16.16",
        "recharts": "^2.10.3",
        "lucide-react": "^0.294.0",
        "clsx": "^2.0.0",
        "tailwind-merge": "^2.1.0",
        "class-variance-authority": "^0.7.0"
    },
    "devDependencies": {
        "@types/react": "^18.2.43",
        "@types/react-dom": "^18.2.17",
        "@vitejs/plugin-react": "^4.2.1",
        "autoprefixer": "^10.4.16",
        "postcss": "^8.4.32",
        "tailwindcss": "^3.4.0",
        "typescript": "^5.3.3",
        "vite": "^5.0.8"
    }
}
```

---

## ✅ Checklist de lancement

- [ ] Initialiser le projet frontend
- [ ] Configurer Tailwind avec design tokens
- [ ] Installer shadcn/ui
- [ ] Copier le logo
- [ ] Implémenter l'authentification
- [ ] Créer le layout (Sidebar + Navbar)
- [ ] Implémenter le Dashboard
- [ ] Implémenter le module Users
- [ ] Implémenter le module Settings
- [ ] Implémenter le module Cotisations
- [ ] Implémenter le module Réunions
- [ ] Implémenter le module Financials
- [ ] Implémenter le module Sanctions
- [ ] Tester la responsivité
- [ ] Optimiser les performances

---

**Prochaine étape**: Commencer l'implémentation Phase 1 - Setup Projet !
