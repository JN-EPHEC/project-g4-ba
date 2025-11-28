# Guide: Upload de Photos de Profil

## 📋 Fonctionnalité

La fonctionnalité d'upload de photo de profil est **déjà implémentée** et fonctionnelle dans l'application!

Chaque utilisateur (Scout, Animateur, Parent) peut personnaliser sa photo de profil directement depuis son écran de profil.

## ✅ Ce qui est déjà en place

### 1. **Composant AvatarUploader**
- Situé dans: `components/avatar-uploader.tsx`
- Permet de:
  - 📸 Prendre une photo avec l'appareil photo
  - 🖼️ Choisir une photo depuis la galerie
  - ☁️ Upload automatique vers Firebase Storage
  - 🔄 Mise à jour automatique du profil

### 2. **Service de Storage**
- Situé dans: `services/storage-service.ts`
- Gère l'upload vers Firebase Storage
- Crée des chemins uniques: `avatars/{userId}/{timestamp}.jpg`
- Compression et optimisation des images

### 3. **Intégration dans les Profils**
Le composant est déjà utilisé dans:
- ✅ `app/(scout)/profile.tsx` - Profil Scout
- ✅ `app/(animator)/profile.tsx` - Profil Animateur
- ✅ `app/(parent)/profile.tsx` - Profil Parent

## 🚀 Comment utiliser

### Pour les utilisateurs de l'application:

1. **Ouvrir le profil**
   - Naviguer vers l'onglet "Profil" dans la barre de navigation

2. **Cliquer sur l'avatar**
   - Un badge avec une icône de caméra apparaît sur l'avatar
   - Cliquer sur l'avatar pour ouvrir le menu

3. **Choisir une option**
   - **Prendre une photo** : Utilise l'appareil photo
   - **Choisir depuis la galerie** : Parcourir les photos existantes
   - **Annuler** : Fermer le menu

4. **Confirmer et éditer**
   - L'éditeur d'image s'ouvre (recadrage carré 1:1)
   - Ajuster la photo comme souhaité
   - Confirmer

5. **Upload automatique**
   - La photo est automatiquement uploadée vers Firebase Storage
   - Le profil est mis à jour dans Firestore
   - Un message de succès s'affiche

## 🔐 Déployer les règles de sécurité Storage

Les règles de sécurité ont été créées dans `storage.rules`. Pour les déployer:

```bash
# Se connecter à Firebase (si pas encore fait)
firebase login

# Déployer uniquement les règles Storage
firebase deploy --only storage:rules
```

### Règles de sécurité configurées:

```
✅ Avatars:
  - Lecture: Public (tout le monde peut voir)
  - Écriture: Propriétaire uniquement
  - Limite: 5MB maximum, images uniquement

✅ Photos de défis:
  - Lecture: Utilisateurs authentifiés
  - Écriture: Utilisateurs authentifiés
  - Limite: 5MB maximum, images uniquement

✅ Photos d'albums:
  - Lecture: Utilisateurs authentifiés
  - Écriture: Utilisateurs authentifiés
  - Limite: 5MB maximum, images uniquement

✅ Documents PDF:
  - Lecture: Utilisateurs authentifiés
  - Écriture: Utilisateurs authentifiés
  - Limite: 10MB maximum, PDF uniquement
```

## 🧪 Tester la fonctionnalité

### Test sur Web (développement):

⚠️ **Note importante**: Sur le web en développement, l'appareil photo n'est pas disponible. Utilisez uniquement "Choisir depuis la galerie".

```bash
# Démarrer l'application
npm start -- --web

# Se connecter avec un compte test
# Scout: scout@test.com / test123
# Animateur: animator@test.com / test123
# Parent: parent@test.com / test123

# Naviguer vers Profil > Cliquer sur l'avatar > Choisir une photo
```

### Test sur Mobile (Expo Go):

1. Scanner le QR code avec Expo Go
2. Se connecter avec un compte
3. Aller sur le profil
4. Tester les deux options:
   - 📸 Prendre une photo
   - 🖼️ Choisir depuis la galerie

## 📱 Permissions requises

L'application demande automatiquement les permissions nécessaires:

- **Galerie photos**: Pour choisir une photo existante
- **Appareil photo**: Pour prendre une nouvelle photo

Si les permissions sont refusées, un message explicatif s'affiche.

## 🐛 Dépannage

### L'upload ne fonctionne pas

1. **Vérifier Firebase Storage**
   ```bash
   # Dans Firebase Console > Storage
   # Vérifier que le bucket est créé
   ```

2. **Vérifier les règles de sécurité**
   ```bash
   firebase deploy --only storage:rules
   ```

3. **Vérifier les logs**
   - Console navigateur: F12 > Console
   - Expo: Logs dans le terminal

### Erreur "Permission denied"

- Les règles Storage ne sont pas déployées
- Solution: `firebase deploy --only storage:rules`

### Erreur "File too large"

- Limite: 5MB pour les images
- Solution: Utiliser une image plus petite ou compresser

## 🎨 Personnalisation

### Modifier la taille de l'avatar

Dans les fichiers de profil, ajuster la prop `size`:

```tsx
<AvatarUploader
  currentAvatarUrl={user?.profilePicture}
  userName={`${user.firstName} ${user.lastName}`}
  size="xlarge"  // Options: small, medium, large, xlarge
/>
```

### Désactiver l'édition

```tsx
<AvatarUploader
  currentAvatarUrl={user?.profilePicture}
  userName={`${user.firstName} ${user.lastName}`}
  editable={false}  // Avatar en lecture seule
/>
```

## 📊 Structure des fichiers dans Storage

```
avatars/
  ├── {userId1}/
  │   ├── 1234567890123.jpg
  │   └── 1234567890456.jpg
  ├── {userId2}/
  │   └── 1234567890789.jpg
  └── ...

challenges/
  ├── {challengeId}/
  │   └── submissions/
  │       └── {submissionId}/
  │           └── 1234567890123.jpg
  └── ...
```

## ✨ Fonctionnalités avancées

### Supprimer l'ancienne photo (optionnel)

Actuellement, les anciennes photos restent dans Storage. Pour les supprimer automatiquement:

```typescript
// Dans avatar-uploader.tsx, avant uploadImage():
if (avatarUrl) {
  // Extraire le path de l'ancienne URL
  const oldPath = extractPathFromUrl(avatarUrl);
  await StorageService.deleteFile(oldPath);
}
```

### Ajouter des filtres/effets (optionnel)

Intégrer une bibliothèque comme `expo-image-manipulator` pour:
- Filtres (noir & blanc, sépia, etc.)
- Rotation
- Redimensionnement automatique

## 📝 Notes importantes

1. **Sécurité**: Les avatars sont publiquement lisibles (pour affichage dans l'app), mais seul le propriétaire peut modifier
2. **Stockage**: Les anciennes photos ne sont pas automatiquement supprimées (pour éviter la perte de données)
3. **Performance**: Les images sont compressées à 80% de qualité pour optimiser le stockage
4. **Format**: Toutes les images sont converties en JPEG pour la cohérence

## 🎯 Prochaines étapes (optionnel)

Pour améliorer encore plus:

1. **Compression automatique côté client** avant upload
2. **Génération de thumbnails** via Cloud Functions
3. **Support des GIF** pour les avatars animés
4. **Cadre de profil personnalisé** (comme sur Facebook)
5. **Historique des avatars** pour revenir à une ancienne photo
