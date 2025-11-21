# 🏕️ WeCamp Scout Hub - Application Mobile

> Application de gestion pour groupes scouts - MVP (Minimum Viable Product)

**Équipe :** Groupe 4 EPHEC | **Année :** 2024-2025

## 🎯 Qu'est-ce que WeCamp ?

WeCamp Scout Hub est une application mobile qui permet aux groupes scouts de :
- ✅ Gérer des événements et activités
- ✅ Communiquer via une messagerie de groupe
- ✅ Partager des documents et photos
- ✅ Suivre les défis et le classement des scouts
- ✅ Gérer les profils et unités

## 🚀 Démarrage Rapide

### Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer l'application
npm start
```

### Options de développement

- **i** - Ouvrir dans iOS Simulator
- **a** - Ouvrir dans Android Emulator
- **w** - Ouvrir dans le navigateur web

## 📂 Structure du Projet

```
project-g4-ba/
├── app/                    # 🧭 Navigation (Expo Router)
├── src/                    # 📦 Code source
│   ├── features/          # 🎯 Fonctionnalités par module
│   ├── shared/            # 🔄 Code partagé
│   ├── core/              # ⚙️ Configuration
│   └── assets/            # 🎨 Images, fonts, icons
└── docs/                  # 📚 Documentation
```

### Organisation par Fonctionnalités

| Module | Description |
|--------|-------------|
| `features/auth` | 🔐 Authentification (login, register) |
| `features/events` | 📅 Événements et activités |
| `features/challenges` | 🏆 Défis scouts |
| `features/messaging` | 💬 Messagerie de groupe |
| `features/documents` | 📄 Gestion de documents |
| `features/profile` | 👤 Profils utilisateurs |
| `features/units` | 👥 Unités et groupes |
| `features/leaderboard` | 🏅 Classement et points |

## 📖 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture complète du projet
- **[GUIDE_DEVELOPPEUR.md](./GUIDE_DEVELOPPEUR.md)** - Guide pour les développeurs
- **[MIGRATION.md](./MIGRATION.md)** - Guide de migration vers la nouvelle structure

## 🛠️ Stack Technique

- **Framework :** React Native + Expo
- **Navigation :** Expo Router (file-based routing)
- **Language :** TypeScript
- **Backend :** Firebase (Auth, Firestore, Storage)
- **State :** React Context API
- **Styling :** StyleSheet (React Native)

## 🎨 Imports Simplifiés

Nous utilisons des **path aliases** pour des imports propres :

```typescript
// ✅ Nouveau style (propre)
import { eventService } from '@features/events';
import { Button } from '@shared/components/ui';
import { useAuth } from '@core/context';

// ❌ Ancien style (à éviter)
import { eventService } from '../../services/event-service';
```

## 🧑‍💻 Pour les Débutants

### Je veux modifier une fonctionnalité...

1. **Trouvez le bon dossier** dans `src/features/`
2. **Consultez le service** dans le sous-dossier `services/`
3. **Modifiez l'écran** correspondant dans `app/`

**Exemple :** Pour modifier les événements :
- Service : `src/features/events/services/event-service.ts`
- Écran Scout : `app/(scout)/events.tsx`
- Écran Animateur : `app/(animator)/activities.tsx`

### Je veux créer un composant...

1. **Composant réutilisable ?** → `src/shared/components/ui/`
2. **Composant spécifique ?** → `src/features/[feature]/components/`

### Je veux ajouter une feature...

Consultez le [GUIDE_DEVELOPPEUR.md](./GUIDE_DEVELOPPEUR.md) pour un tutoriel complet.

## 📱 Rôles Utilisateurs

L'application supporte 3 rôles :

| Rôle | Description | Accès |
|------|-------------|-------|
| **Scout** | Jeune participant | Événements, défis, messagerie, profil |
| **Animateur** | Chef de groupe | Tout + création d'événements, gestion unités |
| **Parent** | Parent de scout | Événements enfants, documents, messagerie limitée |

## 🔥 Firebase Setup

1. Créer un projet Firebase
2. Activer Authentication, Firestore, Storage
3. Copier la configuration dans `src/core/config/firebase.ts`

Voir [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) pour les détails.

## 🧪 Tests

```bash
# Lancer les tests (si configurés)
npm test

# Vérifier les erreurs TypeScript
npx tsc --noEmit
```

## 📦 Build

```bash
# Build pour iOS
npm run ios

# Build pour Android
npm run android
```

## 🗺️ Roadmap

Consultez [WeCamp_Roadmap_MVP.md](./WeCamp_Roadmap_MVP.md) pour la roadmap complète.

### Phase 1 : MVP (Actuel)
- ✅ Authentification
- ✅ Gestion des événements
- ✅ Messagerie de base
- ✅ Profils utilisateurs
- ⏳ Documents
- ⏳ Défis

### Phase 2 : V1.0
- Notifications push
- Recherche avancée
- Événements récurrents
- Sondages

### Phase 3 : V2.0+
- Analytics
- Gamification avancée
- Intégrations tierces

## 🤝 Contribution

1. Créer une branche : `git checkout -b feature/ma-feature`
2. Commiter : `git commit -m "feat: ajouter ma feature"`
3. Pusher : `git push origin feature/ma-feature`
4. Créer une Pull Request

## 📄 License

Ce projet est développé dans le cadre d'un TFE à l'EPHEC.

## 🆘 Support

- **Questions ?** Consultez [GUIDE_DEVELOPPEUR.md](./GUIDE_DEVELOPPEUR.md)
- **Bugs ?** Ouvrez une issue sur GitHub
- **Architecture ?** Lisez [ARCHITECTURE.md](./ARCHITECTURE.md)

## 🌟 Ressources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

**Développé avec ❤️ par l'équipe Groupe 4 EPHEC**

*Bonne Aventure Scoute ! 🏕️*
