# 🏗️ Architecture de WeCamp Scout Hub

## 📁 Structure du Projet

Cette application suit une architecture **feature-based** inspirée des bonnes pratiques Apple et iOS modernes. Chaque fonctionnalité est isolée dans son propre module pour faciliter la maintenance et le développement.

```
project-g4-ba/
├── app/                          # 🧭 Expo Router - Routing uniquement
│   ├── (auth)/                   # Routes d'authentification
│   ├── (scout)/                  # Routes pour les scouts
│   ├── (parent)/                 # Routes pour les parents
│   ├── (animator)/               # Routes pour les animateurs
│   └── _layout.tsx               # Layout racine
│
├── src/                          # 📦 Code source principal
│   ├── features/                 # 🎯 Fonctionnalités (Feature-based)
│   │   ├── auth/                 # 🔐 Authentification
│   │   │   ├── screens/          # Écrans (login, register, role-selection)
│   │   │   ├── components/       # Composants spécifiques
│   │   │   ├── services/         # Services métier
│   │   │   └── index.ts          # Exports publics
│   │   │
│   │   ├── challenges/           # 🏆 Défis/Challenges
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   │   ├── challenge-service.ts
│   │   │   │   ├── challenge-submission-service.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── events/               # 📅 Événements (activités, réunions, hikes)
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   │   ├── event-service.ts
│   │   │   │   ├── event-attendance-service.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── messaging/            # 💬 Messagerie et fil d'actualité
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   │   ├── messaging-service.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── documents/            # 📄 Documents (PDF, autorisations)
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   │   ├── document-service.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── profile/              # 👤 Profils utilisateurs
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   │   ├── user-service.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── units/                # 👥 Unités/Groupes scouts
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   │   ├── unit-service.ts
│   │   │   │   ├── parent-scout-service.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   └── leaderboard/          # 🏅 Classement et points
│   │       ├── screens/
│   │       ├── components/
│   │       ├── services/
│   │       │   ├── leaderboard-service.ts
│   │       │   └── index.ts
│   │       └── index.ts
│   │
│   ├── shared/                   # 🔄 Code partagé entre features
│   │   ├── components/
│   │   │   ├── ui/               # Système de design
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── primary-button.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── forms/            # Composants de formulaires
│   │   │   │   ├── avatar-uploader.tsx
│   │   │   │   ├── map-picker.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── feedback/         # Loaders, toasts, modals
│   │   │
│   │   ├── services/             # Services globaux
│   │   │   ├── storage-service.ts
│   │   │   ├── album-service.ts
│   │   │   ├── community-service.ts
│   │   │   ├── payment-service.ts
│   │   │   ├── signature-service.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── hooks/                # Custom hooks réutilisables
│   │   │   ├── use-color-scheme.ts
│   │   │   ├── use-themed-color.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/                # Fonctions utilitaires
│   │   │   └── index.ts
│   │   │
│   │   ├── types/                # Types TypeScript globaux
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts              # Export central du module shared
│   │
│   ├── core/                     # ⚙️ Cœur de l'application
│   │   ├── config/               # Configuration
│   │   │   ├── firebase.ts       # Config Firebase
│   │   │   └── index.ts
│   │   │
│   │   ├── constants/            # Constantes globales
│   │   │   ├── colors.ts
│   │   │   ├── theme.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── context/              # React Context providers
│   │   │   ├── auth-context.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── navigation/           # Configuration navigation
│   │   │
│   │   └── index.ts              # Export central du module core
│   │
│   └── assets/                   # 🎨 Assets statiques
│       ├── images/
│       ├── fonts/
│       └── icons/
│
├── components/                   # [ANCIEN] À migrer progressivement
├── services/                     # [ANCIEN] À migrer progressivement
├── config/                       # [ANCIEN] Migré vers src/core/config
├── constants/                    # [ANCIEN] Migré vers src/core/constants
├── context/                      # [ANCIEN] Migré vers src/core/context
├── hooks/                        # [ANCIEN] Migré vers src/shared/hooks
└── types/                        # [ANCIEN] Migré vers src/shared/types
```

## 🎯 Principes d'Architecture

### 1. **Feature-Based Organization**
Chaque fonctionnalité (feature) contient tout ce dont elle a besoin :
- **screens/** : Les écrans de la feature
- **components/** : Composants spécifiques à la feature
- **services/** : Logique métier et appels API
- **index.ts** : Exports publics (barrel export)

### 2. **Separation of Concerns**
- **app/** : Routing uniquement (Expo Router)
- **src/features/** : Fonctionnalités métier
- **src/shared/** : Code réutilisable
- **src/core/** : Configuration et setup

### 3. **Clean Imports avec Path Aliases**
```typescript
// ❌ Avant (imports relatifs compliqués)
import { Button } from '../../../components/ui/button';
import { eventService } from '../../../services/event-service';

// ✅ Après (imports propres)
import { Button } from '@shared/components/ui';
import { eventService } from '@features/events';
```

## 📝 Path Aliases Configurés

Dans `tsconfig.json` :
- `@/*` → Racine du projet
- `@features/*` → `src/features/*`
- `@shared/*` → `src/shared/*`
- `@core/*` → `src/core/*`
- `@assets/*` → `src/assets/*`

## 🚀 Comment Utiliser

### Importer un service
```typescript
// Import depuis une feature
import { challengeService, submissionService } from '@features/challenges';
import { eventService } from '@features/events';

// Import d'un service partagé
import { storageService } from '@shared/services';
```

### Importer un composant
```typescript
// Composants UI
import { Button, Card, Avatar } from '@shared/components/ui';

// Composants de formulaires
import { AvatarUploader, MapPicker } from '@shared/components/forms';
```

### Importer la configuration
```typescript
// Config Firebase
import { firebase } from '@core/config';

// Context
import { useAuth } from '@core/context';

// Constants
import { Colors, Theme } from '@core/constants';
```

### Importer un hook
```typescript
import { useColorScheme, useThemedColor } from '@shared/hooks';
```

## 🎨 Conventions de Nommage

### Fichiers
- Composants : `PascalCase.tsx` (ex: `AvatarUploader.tsx`)
- Services : `kebab-case.ts` (ex: `event-service.ts`)
- Hooks : `use-kebab-case.ts` (ex: `use-color-scheme.ts`)
- Types : `kebab-case.types.ts` (ex: `user.types.ts`)
- Utils : `kebab-case.ts` (ex: `date-utils.ts`)

### Exports
Toujours utiliser des **barrel exports** (`index.ts`) pour exposer l'API publique d'un module.

```typescript
// src/features/events/index.ts
export * from './services';
export * from './components';
```

## 📦 Mapping des Fonctionnalités

| Feature | Description | Services |
|---------|-------------|----------|
| **auth** | Authentification | - |
| **challenges** | Défis scouts | `challenge-service`, `challenge-submission-service` |
| **events** | Événements | `event-service`, `event-attendance-service` |
| **messaging** | Messagerie | `messaging-service` |
| **documents** | Documents | `document-service` |
| **profile** | Profils | `user-service` |
| **units** | Unités/Groupes | `unit-service`, `parent-scout-service` |
| **leaderboard** | Classement | `leaderboard-service` |

## 🔄 Migration Progressive

Les anciens dossiers (`components/`, `services/`, etc.) sont conservés temporairement.

**Plan de migration :**
1. ✅ Créer nouvelle structure
2. ✅ Copier les fichiers
3. ⏳ Mettre à jour les imports progressivement
4. ⏳ Supprimer les anciens dossiers une fois la migration terminée

## 🛠️ Bonnes Pratiques

### 1. **Colocation**
Gardez les fichiers liés proches les uns des autres.

```
features/events/
├── screens/
│   └── event-detail.tsx
├── components/
│   ├── event-card.tsx          # Utilisé uniquement dans events
│   └── event-form.tsx
└── services/
    └── event-service.ts
```

### 2. **Minimal API Surface**
N'exportez que ce qui doit être public via `index.ts`.

```typescript
// ❌ N'exposez pas tout
export * from './internal-helper';

// ✅ Exposez uniquement l'API publique
export { eventService } from './event-service';
export type { Event, CreateEventDto } from './event.types';
```

### 3. **Évitez les dépendances circulaires**
- Les features ne doivent **jamais** s'importer entre elles
- Utilisez `shared/` pour le code commun

```typescript
// ❌ Interdit
import { challengeService } from '@features/challenges';  // depuis events/

// ✅ Correct
import { commonService } from '@shared/services';
```

## 📚 Ressources

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Native Best Practices](https://reactnative.dev/docs/best-practices)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

---

**Date de création :** 20 novembre 2024
**Version :** 1.0.0
**Maintenu par :** Équipe WeCamp - Groupe 4 EPHEC
