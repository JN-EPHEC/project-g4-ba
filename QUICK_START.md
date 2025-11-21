# ⚡ Quick Start - Guide Rapide

## 🎯 En 30 Secondes

```bash
# 1. Installer
npm install

# 2. Lancer
npm start

# 3. Ouvrir dans votre simulateur
# Appuyez sur 'i' pour iOS ou 'a' pour Android
```

## 🗺️ Trouver ce que Vous Cherchez

### Je veux modifier une fonctionnalité

| Quoi | Où |
|------|-----|
| 📅 Événements | `src/features/events/` |
| 🏆 Défis | `src/features/challenges/` |
| 💬 Messages | `src/features/messaging/` |
| 📄 Documents | `src/features/documents/` |
| 👤 Profils | `src/features/profile/` |
| 👥 Unités | `src/features/units/` |

### Je veux utiliser un composant

| Quoi | Import |
|------|--------|
| Bouton | `import { Button } from '@shared/components/ui'` |
| Carte | `import { Card } from '@shared/components/ui'` |
| Avatar | `import { Avatar } from '@shared/components/ui'` |
| Formulaire Avatar | `import { AvatarUploader } from '@shared/components/forms'` |

### Je veux accéder à...

| Quoi | Import |
|------|--------|
| Auth Context | `import { useAuth } from '@core/context'` |
| Config Firebase | `import { firebase } from '@core/config'` |
| Service Storage | `import { storageService } from '@shared/services'` |

## 📝 Exemples Rapides

### Récupérer des événements
```typescript
import { eventService } from '@features/events';

const events = await eventService.getEvents();
```

### Afficher un bouton
```typescript
import { Button } from '@shared/components/ui';

<Button title="Cliquez-moi" onPress={handlePress} />
```

### Utiliser l'authentification
```typescript
import { useAuth } from '@core/context';

const { user, signOut } = useAuth();
```

### Uploader une image
```typescript
import { storageService } from '@shared/services';

const url = await storageService.uploadImage(uri, 'path');
```

## 🎨 Nouvelle Structure

```
src/
├── features/        # Code par fonctionnalité
├── shared/          # Code partagé
├── core/            # Configuration
└── assets/          # Images, fonts
```

## 📖 Besoin de Plus ?

- **Architecture complète** → [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Guide développeur** → [GUIDE_DEVELOPPEUR.md](./GUIDE_DEVELOPPEUR.md)
- **Avant/Après** → [AVANT_APRES.md](./AVANT_APRES.md)
- **Migration** → [MIGRATION.md](./MIGRATION.md)

---

**C'est tout ! Bon développement ! 🚀**
