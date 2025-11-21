# 📦 Source Code (`src/`)

Ce dossier contient **tout le code source** de l'application, organisé de manière claire et modulaire.

## 📁 Structure

```
src/
├── features/       # 🎯 Fonctionnalités métier (par module)
├── shared/         # 🔄 Code partagé entre features
├── core/           # ⚙️ Configuration et setup
└── assets/         # 🎨 Images, fonts, icons
```

## 🎯 Features (Fonctionnalités)

Chaque feature est **autonome** et contient :
- `screens/` - Les écrans spécifiques
- `components/` - Les composants de la feature
- `services/` - La logique métier
- `index.ts` - L'API publique (exports)

### Liste des Features

| Feature | Description | Priorité MVP |
|---------|-------------|--------------|
| `auth/` | Authentification | 🔴 Critique |
| `events/` | Événements et activités | 🔴 Critique |
| `challenges/` | Défis scouts | 🟡 Important |
| `messaging/` | Messagerie de groupe | 🔴 Critique |
| `documents/` | Gestion de documents | 🟡 Important |
| `profile/` | Profils utilisateurs | 🔴 Critique |
| `units/` | Unités et groupes | 🔴 Critique |
| `leaderboard/` | Classement | 🟢 Nice to have |

## 🔄 Shared (Partagé)

Code réutilisable par **toutes** les features :

```
shared/
├── components/
│   ├── ui/          # Système de design (Button, Card, etc.)
│   ├── forms/       # Composants de formulaires
│   └── feedback/    # Loaders, toasts, modals
├── services/        # Services globaux (storage, etc.)
├── hooks/           # Custom hooks
├── utils/           # Fonctions utilitaires
└── types/           # Types TypeScript globaux
```

## ⚙️ Core (Cœur)

Configuration et setup de l'application :

```
core/
├── config/          # Firebase, API keys, etc.
├── constants/       # Couleurs, tailles, etc.
├── context/         # React Context (Auth, Theme, etc.)
└── navigation/      # Configuration navigation
```

## 🎨 Assets

Assets statiques de l'application :

```
assets/
├── images/          # Images et photos
├── fonts/           # Polices personnalisées
└── icons/           # Icônes de l'app
```

## 🧭 Comment Naviguer

### Je cherche la logique métier
→ `features/[nom-feature]/services/`

### Je cherche un composant UI
→ `shared/components/ui/`

### Je cherche la config Firebase
→ `core/config/firebase.ts`

### Je cherche un hook personnalisé
→ `shared/hooks/`

## 📝 Conventions

- **Composants** : `PascalCase.tsx`
- **Services** : `kebab-case.ts`
- **Hooks** : `use-kebab-case.ts`
- **Types** : `kebab-case.types.ts`

## 🚀 Imports Recommandés

```typescript
// ✅ Utiliser les path aliases
import { eventService } from '@features/events';
import { Button } from '@shared/components/ui';
import { useAuth } from '@core/context';

// ❌ Éviter les imports relatifs
import { Button } from '../../../shared/components/ui/button';
```

---

**Pour plus d'infos :** Consultez [../ARCHITECTURE.md](../ARCHITECTURE.md)
