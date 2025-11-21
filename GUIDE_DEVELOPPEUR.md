# 👨‍💻 Guide du Développeur - WeCamp Scout Hub

## 🎯 Pour les Débutants

Bienvenue ! Ce guide va vous aider à comprendre comment fonctionne l'application et où trouver ce que vous cherchez.

## 📂 Où Trouver Quoi ?

### 🔍 "Je veux ajouter/modifier une fonctionnalité..."

| Fonctionnalité | Dossier | Fichiers clés |
|----------------|---------|---------------|
| **Connexion / Inscription** | `src/features/auth/` | - |
| **Défis / Challenges** | `src/features/challenges/` | `challenge-service.ts`, `challenge-submission-service.ts` |
| **Événements / Activités** | `src/features/events/` | `event-service.ts`, `event-attendance-service.ts` |
| **Messages / Fil d'actualité** | `src/features/messaging/` | `messaging-service.ts` |
| **Documents / PDF** | `src/features/documents/` | `document-service.ts` |
| **Profil utilisateur** | `src/features/profile/` | `user-service.ts` |
| **Groupes / Unités** | `src/features/units/` | `unit-service.ts`, `parent-scout-service.ts` |
| **Classement / Points** | `src/features/leaderboard/` | `leaderboard-service.ts` |

### 🧩 "Je veux utiliser un composant..."

| Type de composant | Dossier |
|-------------------|---------|
| **Boutons, cartes, badges** | `src/shared/components/ui/` |
| **Upload d'avatar, sélection de carte** | `src/shared/components/forms/` |
| **Loaders, toasts, modals** | `src/shared/components/feedback/` |

### ⚙️ "Je veux modifier la configuration..."

| Configuration | Fichier |
|---------------|---------|
| **Firebase** | `src/core/config/firebase.ts` |
| **Couleurs** | `src/core/constants/colors.ts` |
| **Thème** | `src/core/constants/theme.ts` |
| **Authentification** | `src/core/context/auth-context.tsx` |

## 🚀 Ajouter une Nouvelle Fonctionnalité

### Exemple : Ajouter une fonctionnalité "Badges"

**Étape 1 : Créer la structure**
```bash
mkdir -p src/features/badges/{screens,components,services}
```

**Étape 2 : Créer le service**
```typescript
// src/features/badges/services/badge-service.ts
import { db } from '@core/config';

export const badgeService = {
  async getBadges(userId: string) {
    // Votre logique ici
  },

  async awardBadge(userId: string, badgeId: string) {
    // Votre logique ici
  }
};
```

**Étape 3 : Créer l'index des services**
```typescript
// src/features/badges/services/index.ts
export * from './badge-service';
```

**Étape 4 : Créer l'index de la feature**
```typescript
// src/features/badges/index.ts
export * from './services';
```

**Étape 5 : Utiliser dans un composant**
```typescript
import { badgeService } from '@features/badges';

export default function BadgesScreen() {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    badgeService.getBadges(userId).then(setBadges);
  }, []);

  return <View>{/* Votre UI */}</View>;
}
```

## 🎨 Créer un Nouveau Composant UI

### Exemple : Créer un composant "Badge"

**Étape 1 : Créer le composant**
```typescript
// src/shared/components/ui/badge.tsx
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  color?: string;
}

export function Badge({ label, color = '#007AFF' }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
```

**Étape 2 : L'exporter**
```typescript
// src/shared/components/ui/index.ts
export * from './badge';
export * from './button';
export * from './card';
// ... autres exports
```

**Étape 3 : L'utiliser**
```typescript
import { Badge } from '@shared/components/ui';

<Badge label="Nouveau" color="#FF3B30" />
```

## 📱 Ajouter un Nouvel Écran

### Exemple : Ajouter un écran "Badges" pour les scouts

**Étape 1 : Créer le fichier dans app/**
```typescript
// app/(scout)/badges.tsx
import { View, Text } from 'react-native';
import { badgeService } from '@features/badges';

export default function BadgesScreen() {
  return (
    <View>
      <Text>Mes Badges</Text>
    </View>
  );
}
```

**Étape 2 : Ajouter dans le layout**
```typescript
// app/(scout)/_layout.tsx
<Tabs.Screen
  name="badges"
  options={{
    title: 'Badges',
    tabBarIcon: ({ color }) => <TabBarIcon name="medal" color={color} />,
  }}
/>
```

## 🔧 Bonnes Pratiques

### ✅ DO (À Faire)

```typescript
// ✅ Utiliser les path aliases
import { Button } from '@shared/components/ui';
import { eventService } from '@features/events';

// ✅ Exporter via index.ts
// src/features/events/index.ts
export * from './services';

// ✅ Typer vos fonctions
export async function getEvent(id: string): Promise<Event> {
  // ...
}

// ✅ Nommer clairement vos fichiers
avatar-uploader.tsx
event-service.ts
use-color-scheme.ts
```

### ❌ DON'T (À Éviter)

```typescript
// ❌ N'utilisez pas d'imports relatifs compliqués
import { Button } from '../../../components/ui/button';

// ❌ N'importez pas une feature depuis une autre feature
import { challengeService } from '@features/challenges'; // depuis events/

// ❌ N'utilisez pas any
function getEvent(id: any): any { }

// ❌ Ne mettez pas tout dans un seul fichier
// Un fichier = une responsabilité
```

## 🐛 Debugging

### Où sont les services ?
- **Ancienne structure** : `services/event-service.ts`
- **Nouvelle structure** : `src/features/events/services/event-service.ts`
- **Import** : `import { eventService } from '@features/events';`

### Erreur d'import ?
```typescript
// ❌ Si ça ne marche pas
import { eventService } from 'src/features/events/services/event-service';

// ✅ Utilisez les path aliases
import { eventService } from '@features/events';
```

### TypeScript ne trouve pas le module ?
1. Vérifiez que `tsconfig.json` a le `baseUrl` et les `paths`
2. Redémarrez TypeScript Server dans VSCode (`Cmd+Shift+P` → "Restart TS Server")

## 📖 Structure Type d'une Feature

```
src/features/ma-feature/
├── screens/              # 📱 Écrans
│   └── detail.tsx
├── components/           # 🧩 Composants spécifiques
│   ├── card.tsx
│   └── form.tsx
├── services/            # ⚙️ Logique métier
│   ├── ma-feature-service.ts
│   └── index.ts
├── types/               # 📝 Types TypeScript (optionnel)
│   └── ma-feature.types.ts
└── index.ts            # 📦 Export public
```

## 🎓 Exemples Pratiques

### Récupérer des données
```typescript
import { useEffect, useState } from 'react';
import { eventService } from '@features/events';

export default function EventsScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await eventService.getEvents();
        setEvents(data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  if (loading) return <Text>Chargement...</Text>;

  return (
    <View>
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </View>
  );
}
```

### Utiliser l'authentification
```typescript
import { useAuth } from '@core/context';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <View>
      <Text>Bonjour {user?.displayName}</Text>
      <Button title="Déconnexion" onPress={signOut} />
    </View>
  );
}
```

### Uploader une image
```typescript
import { AvatarUploader } from '@shared/components/forms';
import { storageService } from '@shared/services';

export default function EditProfileScreen() {
  const handleUpload = async (uri: string) => {
    const url = await storageService.uploadImage(uri, 'avatars');
    // Mettre à jour le profil avec url
  };

  return (
    <AvatarUploader
      currentImage={user?.photoURL}
      onImageSelected={handleUpload}
    />
  );
}
```

## 🆘 Besoin d'Aide ?

1. **Consultez ARCHITECTURE.md** pour comprendre la structure
2. **Regardez le code existant** dans les features similaires
3. **Suivez les conventions** de nommage et d'organisation
4. **Demandez à l'équipe** si vous êtes bloqué

## 📚 Ressources Utiles

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Hooks](https://react.dev/reference/react)

---

**Bon développement ! 🚀**

*Équipe WeCamp - Groupe 4 EPHEC*
