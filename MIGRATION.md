# 🔄 Guide de Migration - Nouvelle Architecture

## 📊 État Actuel

✅ **Nouvelle structure créée**
✅ **Fichiers copiés vers la nouvelle structure**
✅ **Path aliases configurés**
✅ **Documentation complète**

⏳ **Imports à mettre à jour progressivement**
⏳ **Anciens dossiers à nettoyer après migration**

## 🗺️ Mapping des Fichiers

### Services

| Ancien Emplacement | Nouvel Emplacement | Import |
|-------------------|-------------------|---------|
| `services/challenge-service.ts` | `src/features/challenges/services/` | `@features/challenges` |
| `services/challenge-submission-service.ts` | `src/features/challenges/services/` | `@features/challenges` |
| `services/event-service.ts` | `src/features/events/services/` | `@features/events` |
| `services/event-attendance-service.ts` | `src/features/events/services/` | `@features/events` |
| `services/messaging-service.ts` | `src/features/messaging/services/` | `@features/messaging` |
| `services/document-service.ts` | `src/features/documents/services/` | `@features/documents` |
| `services/user-service.ts` | `src/features/profile/services/` | `@features/profile` |
| `services/unit-service.ts` | `src/features/units/services/` | `@features/units` |
| `services/parent-scout-service.ts` | `src/features/units/services/` | `@features/units` |
| `services/leaderboard-service.ts` | `src/features/leaderboard/services/` | `@features/leaderboard` |
| `services/storage-service.ts` | `src/shared/services/` | `@shared/services` |
| `services/album-service.ts` | `src/shared/services/` | `@shared/services` |
| `services/community-service.ts` | `src/shared/services/` | `@shared/services` |
| `services/payment-service.ts` | `src/shared/services/` | `@shared/services` |
| `services/signature-service.ts` | `src/shared/services/` | `@shared/services` |

### Composants

| Ancien Emplacement | Nouvel Emplacement | Import |
|-------------------|-------------------|---------|
| `components/ui/*` | `src/shared/components/ui/` | `@shared/components/ui` |
| `components/avatar-uploader.tsx` | `src/shared/components/forms/` | `@shared/components/forms` |
| `components/map-picker.tsx` | `src/shared/components/forms/` | `@shared/components/forms` |

### Configuration & Core

| Ancien Emplacement | Nouvel Emplacement | Import |
|-------------------|-------------------|---------|
| `config/*` | `src/core/config/` | `@core/config` |
| `constants/*` | `src/core/constants/` | `@core/constants` |
| `context/*` | `src/core/context/` | `@core/context` |
| `hooks/*` | `src/shared/hooks/` | `@shared/hooks` |
| `types/*` | `src/shared/types/` | `@shared/types` |

## 📝 Exemples de Migration d'Imports

### Avant (imports relatifs)
```typescript
// ❌ Ancien style
import { eventService } from '../../services/event-service';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/auth-context';
```

### Après (path aliases)
```typescript
// ✅ Nouveau style
import { eventService } from '@features/events';
import { Button } from '@shared/components/ui';
import { useAuth } from '@core/context';
```

## 🔧 Migration Par Étapes

### Étape 1 : Mettre à jour un fichier

**Exemple : Migrer `app/(scout)/events.tsx`**

1. **Identifier les imports**
```typescript
// Ancien fichier
import { eventService } from '../../services/event-service';
import { Card } from '../../components/ui/card';
```

2. **Remplacer par les nouveaux imports**
```typescript
// Nouveau fichier
import { eventService } from '@features/events';
import { Card } from '@shared/components/ui';
```

3. **Tester que ça fonctionne**
```bash
npm start
```

### Étape 2 : Vérifier les Imports Cassés

Utilisez TypeScript pour trouver les imports cassés :

```bash
# Vérifier les erreurs TypeScript
npx tsc --noEmit
```

### Étape 3 : Migration Progressive

**Ne migrez PAS tout d'un coup !** Procédez par feature :

1. ✅ Migrer tous les imports de `events`
2. ✅ Tester
3. ✅ Migrer tous les imports de `challenges`
4. ✅ Tester
5. ... et ainsi de suite

## 🔍 Trouver Tous les Imports à Migrer

### Chercher les imports de services
```bash
# Trouver tous les imports de services
grep -r "from.*services/" app/
```

### Chercher les imports de composants
```bash
# Trouver tous les imports de composants
grep -r "from.*components/" app/
```

### Chercher les imports relatifs
```bash
# Trouver tous les imports relatifs
grep -r "from '\.\./\.\." app/
```

## 📋 Checklist de Migration

### Par Feature

- [ ] **Events**
  - [ ] Mettre à jour les imports dans `app/(scout)/events.tsx`
  - [ ] Mettre à jour les imports dans `app/(animator)/events.tsx`
  - [ ] Tester la création d'événements
  - [ ] Tester l'inscription aux événements

- [ ] **Challenges**
  - [ ] Mettre à jour les imports dans `app/(scout)/challenges/`
  - [ ] Mettre à jour les imports dans `app/(animator)/challenges/`
  - [ ] Tester la création de défis
  - [ ] Tester la soumission de défis

- [ ] **Profile**
  - [ ] Mettre à jour les imports dans `app/(scout)/profile.tsx`
  - [ ] Mettre à jour les imports dans `app/(parent)/profile.tsx`
  - [ ] Mettre à jour les imports dans `app/(animator)/profile.tsx`
  - [ ] Tester la modification de profil

- [ ] **Units**
  - [ ] Mettre à jour les imports dans `app/(animator)/units.tsx`
  - [ ] Tester la gestion des unités

- [ ] **Documents**
  - [ ] Mettre à jour les imports dans `app/(parent)/documents.tsx`
  - [ ] Tester l'upload de documents

- [ ] **Messaging**
  - [ ] Mettre à jour les imports des écrans de messagerie
  - [ ] Tester l'envoi de messages

- [ ] **Leaderboard**
  - [ ] Mettre à jour les imports dans `app/(scout)/leaderboard.tsx`
  - [ ] Tester l'affichage du classement

### Composants Partagés

- [ ] **UI Components**
  - [ ] Vérifier tous les imports de boutons
  - [ ] Vérifier tous les imports de cards
  - [ ] Vérifier tous les imports d'avatars
  - [ ] Vérifier tous les imports de badges

- [ ] **Form Components**
  - [ ] Vérifier AvatarUploader
  - [ ] Vérifier MapPicker

### Core

- [ ] **Context**
  - [ ] Mettre à jour tous les imports de `useAuth`
  - [ ] Tester l'authentification

- [ ] **Config**
  - [ ] Mettre à jour les imports de Firebase
  - [ ] Tester la connexion Firebase

## 🧪 Tests Après Migration

### Tests Essentiels

1. **Authentification**
   - [ ] Login fonctionne
   - [ ] Logout fonctionne
   - [ ] Sélection de rôle fonctionne

2. **Navigation**
   - [ ] Toutes les tabs fonctionnent
   - [ ] Navigation entre écrans fonctionne

3. **Services**
   - [ ] Les services Firebase sont accessibles
   - [ ] Les appels API fonctionnent

4. **UI**
   - [ ] Les composants s'affichent correctement
   - [ ] Les formulaires fonctionnent

## 🗑️ Nettoyage Final

**⚠️ NE PAS FAIRE AVANT QUE TOUT SOIT MIGRÉ**

Une fois que tous les imports sont mis à jour et testés :

```bash
# Supprimer les anciens dossiers
rm -rf services/
rm -rf components/  # Garder uniquement les composants non migrés
rm -rf config/      # Si tout est dans src/core/config
rm -rf constants/   # Si tout est dans src/core/constants
rm -rf context/     # Si tout est dans src/core/context
rm -rf hooks/       # Si tout est dans src/shared/hooks
```

## 💡 Conseils

1. **Utilisez VSCode Search & Replace**
   - `Cmd+Shift+F` pour chercher
   - Remplacer les imports en masse (attention !)

2. **Commitez souvent**
   ```bash
   git add .
   git commit -m "migrate: events feature imports"
   ```

3. **Testez après chaque migration**
   - Ne passez pas à la feature suivante sans tester

4. **Gardez les anciens fichiers**
   - Ne les supprimez que quand TOUT est migré

## 🆘 En Cas de Problème

### Erreur : "Cannot find module '@features/events'"

1. Vérifiez `tsconfig.json`
2. Redémarrez TypeScript Server
3. Redémarrez Metro Bundler (`npm start`)

### Erreur : "Module not found"

1. Vérifiez que le fichier existe dans `src/`
2. Vérifiez l'export dans `index.ts`
3. Vérifiez le path alias

### Les imports ne se résolvent pas

```bash
# Nettoyer le cache
rm -rf node_modules/.cache
npm start -- --reset-cache
```

## 📞 Support

Si vous êtes bloqué :
1. Consultez [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Consultez [GUIDE_DEVELOPPEUR.md](./GUIDE_DEVELOPPEUR.md)
3. Demandez à l'équipe

---

**Bonne migration ! 🚀**

*Équipe WeCamp - Groupe 4 EPHEC*
