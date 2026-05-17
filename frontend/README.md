# SNAESURS - Frontend

**Système de Gestion Syndicale - Guinée**

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- npm ou yarn

### Installation

```bash
cd frontend
npm install
npm run dev
```

L'application sera accessible à `http://localhost:3000`

## 🛠️ Stack Technique

- **Framework**: React 18.2
- **Langage**: TypeScript 5.0
- **Build Tool**: Vite 5.0
- **Styling**: Tailwind CSS 3.4
- **UI Components**: shadcn/ui (manuellement implémenté)
- **Routing**: React Router v6.20
- **Data Fetching**: TanStack Query v5.14
- **State Management**: Zustand
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod

## 📁 Structure du Projet

```
frontend/
├── public/
│   └── images/
│       └── logo.png          # Logo SNAESURS
├── src/
│   ├── components/
│   │   ├── ui/                # Composants shadcn/ui
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── input.tsx
│   │   │   ├── avatar.tsx
│   │   │   └── sonner.tsx
│   │   └── layout/            # Layout components
│   │       ├── Sidebar.tsx
│   │       ├── Navbar.tsx
│   │       ├── AppLayout.tsx
│   │       ├── PageContainer.tsx
│   │       └── ProtectedRoute.tsx
│   ├── pages/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx
│   │   └── dashboard/
│   │       └── DashboardPage.tsx
│   ├── services/
│   │   └── api/
│   │       ├── client.ts        # Client Axios
│   │       └── auth.ts          # API Auth
│   ├── store/
│   │   ├── useAuthStore.ts     # État authentification
│   │   └── useUiStore.ts       # État UI
│   ├── types/
│   │   ├── api.ts
│   │   ├── user.ts
│   │   └── settings.ts
│   ├── lib/
│   │   ├── utils.ts             # Utilitaires
│   │   └── queryClient.ts      # TanStack Query config
│   ├── index.css
│   ├── main.tsx
│   └── App.tsx
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

## 🎨 Design System

Le design system suit strictement le `GRAPHIC_CHARTER.md`:

- **Couleurs**: Primary Blue (#135796), Secondary (#1E6EC0), Sage Gray (#9BA9A1), Dark Slate (#0D1D23)
- **Typo**: Orbitron (titres), Inter (corps)
- **Bordures**: 18px (cards), 8px (buttons), 6px (inputs)

## 📝 Prochaines Étapes

1. Installer les dépendances: `npm install`
2. Démarrer le serveur: `npm run dev`
3. Implémenter la page d'inscription
4. Implémenter la vérification OTP
5. Implémenter les pages utilisateurs
6. Implémenter les modules de gestion

## 📚 Documentation

- [API Documentation](../API_DOCUMENTATION.md)
- [Graphic Charter](../GRAPHIC_CHARTER.md)
- [Frontend Plan](../FRONTEND_PLAN.md)
