# 📸 Upload de Photo de Profil - Guide Rapide

## ✅ Bonne nouvelle!

**La fonctionnalité d'upload de photo de profil est déjà implémentée et fonctionnelle!**

Tous les utilisateurs peuvent dès maintenant personnaliser leur photo de profil directement depuis l'application.

## 🎯 Comment ça marche?

### Étape 1: Aller sur le profil
- Ouvrir l'application
- Cliquer sur l'onglet **"Profil"** dans la barre de navigation

### Étape 2: Cliquer sur l'avatar
- L'avatar a un badge bleu avec une icône de caméra 📸
- Cliquer dessus pour ouvrir le menu

### Étape 3: Choisir une option
Un menu s'affiche avec 3 options:
1. **📸 Prendre une photo** - Utilise l'appareil photo (mobile uniquement)
2. **🖼️ Choisir depuis la galerie** - Parcourir vos photos
3. **❌ Annuler** - Fermer le menu

### Étape 4: Éditer et confirmer
- L'éditeur d'image s'ouvre automatiquement
- Recadrage carré (1:1) pour un rendu parfait
- Ajuster comme vous voulez
- Appuyer sur "Valider"

### Étape 5: Upload automatique
- ⏱️ La photo est automatiquement uploadée
- 💾 Le profil est mis à jour
- ✅ Message de confirmation affiché
- 🎉 Votre nouvelle photo apparaît immédiatement!

## 🚀 Déploiement (une seule fois)

Pour activer la fonctionnalité, il faut déployer les règles de sécurité Storage:

```bash
# Option 1: Script automatique
./scripts/deploy-storage-rules.sh

# Option 2: Commande manuelle
firebase deploy --only storage:rules
```

C'est tout! Une seule fois suffit.

## 📋 Comptes de test

Testez avec ces comptes:

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Scout | scout@test.com | test123 |
| Animateur | animator@test.com | test123 |
| Parent | parent@test.com | test123 |

## ⚙️ Fonctionnalités techniques

### Sécurité
- ✅ Upload sécurisé via Firebase Storage
- ✅ Seul le propriétaire peut modifier son avatar
- ✅ Tout le monde peut voir les avatars (public)
- ✅ Limite de taille: 5MB maximum
- ✅ Formats acceptés: JPEG, PNG, GIF, WebP

### Performance
- ✅ Compression automatique à 80% de qualité
- ✅ Recadrage carré pour consistance
- ✅ Upload asynchrone (ne bloque pas l'UI)
- ✅ Mise à jour en temps réel

### UX
- ✅ Permissions demandées automatiquement
- ✅ Messages d'erreur clairs
- ✅ Indicateur de chargement
- ✅ Confirmation visuelle du succès

## 🎨 Où est-ce implémenté?

### Composant AvatarUploader
```
components/avatar-uploader.tsx
```
Composant réutilisable pour l'upload d'avatar

### Profils utilisateurs
```
app/(scout)/profile.tsx     ← Scout
app/(animator)/profile.tsx  ← Animateur
app/(parent)/profile.tsx    ← Parent
```

Tous les profils utilisent déjà le composant!

### Service de Storage
```
services/storage-service.ts
```
Gère l'upload vers Firebase Storage

## 📱 Test sur différentes plateformes

### Web (développement)
```bash
npm start -- --web
```
⚠️ **Note**: Sur web, seule la galerie fonctionne (pas d'appareil photo)

### Mobile (Expo Go)
1. Scanner le QR code
2. Les deux options fonctionnent:
   - Appareil photo ✅
   - Galerie ✅

### Mobile (Build production)
```bash
eas build --platform android
# ou
eas build --platform ios
```

## 🔧 Personnalisation

### Changer la taille de l'avatar

Dans les fichiers de profil:

```tsx
<AvatarUploader
  currentAvatarUrl={user?.profilePicture}
  userName={`${user.firstName} ${user.lastName}`}
  size="xlarge"  // Options: small, medium, large, xlarge
/>
```

### Avatar en lecture seule

```tsx
<AvatarUploader
  currentAvatarUrl={user?.profilePicture}
  userName={`${user.firstName} ${user.lastName}`}
  editable={false}  // Désactive l'édition
/>
```

## 🐛 Problèmes courants

### "Permission denied"
**Solution**: Déployer les règles Storage
```bash
firebase deploy --only storage:rules
```

### "File too large"
**Solution**: L'image dépasse 5MB, choisir une image plus petite

### L'appareil photo ne s'ouvre pas
**Solution**:
- Web: Utiliser la galerie à la place
- Mobile: Vérifier les permissions de l'appareil photo

### La photo ne se charge pas
**Solution**:
1. Vérifier la connexion internet
2. Vérifier que Firebase Storage est activé
3. Regarder les logs: `npx expo start` (console)

## 📊 Structure des fichiers uploadés

```
Firebase Storage
└── avatars/
    ├── {userId-scout}/
    │   └── 1701234567890.jpg  ← Photo du scout
    ├── {userId-animator}/
    │   └── 1701234567891.jpg  ← Photo de l'animateur
    └── {userId-parent}/
        └── 1701234567892.jpg  ← Photo du parent
```

Chaque utilisateur a son propre dossier, seul lui peut y écrire!

## 📚 Documentation complète

Pour plus de détails, consultez: [AVATAR_UPLOAD_GUIDE.md](./AVATAR_UPLOAD_GUIDE.md)

## ✨ C'est prêt!

La fonctionnalité est **complète et fonctionnelle**. Il suffit de:

1. ✅ Déployer les règles Storage (une fois)
2. ✅ Lancer l'application
3. ✅ Se connecter
4. ✅ Cliquer sur l'avatar dans le profil
5. ✅ Choisir une photo
6. ✅ Profiter!

**Pas de code à écrire, tout est déjà là! 🎉**
