# Guide de Configuration Firebase - Synchronisation Auth/Firestore

## 📋 Résumé du problème

Les utilisateurs créés dans Firebase Authentication n'ont pas de documents correspondants dans Firestore `users` collection. Cela empêche l'application de fonctionner correctement.

## 🔧 Solution 1: Créer manuellement les documents users existants

Pour les utilisateurs **déjà créés** dans Firebase Authentication:

### Étape 1: Identifier les utilisateurs
1. Allez dans [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet `wecamp-642bc`
3. Allez dans **Authentication** → **Users**
4. Notez l'**UID** de chaque utilisateur

### Étape 2: Créer les documents Firestore
1. Allez dans **Firestore Database**
2. Si la collection `users` n'existe pas, créez-la
3. Pour chaque utilisateur, cliquez sur **+ Ajouter un document**
4. **IMPORTANT**: Dans "ID du document", entrez l'**UID exact** de l'utilisateur (ne pas utiliser Auto-ID)
5. Ajoutez ces champs:

| Champ | Type | Valeur |
|-------|------|--------|
| `email` | string | Email de l'utilisateur |
| `role` | string | `scout`, `animator`, ou `parent` |
| `firstName` | string | Prénom de l'utilisateur |
| `lastName` | string | Nom de l'utilisateur |
| `unitId` | string ou null | ID de l'unité ou `null` |
| `points` | number | `0` |
| `profilePicture` | string ou null | URL de la photo ou `null` |
| `createdAt` | timestamp | Cliquez sur "timestamp" actuel |
| `updatedAt` | timestamp | Cliquez sur "timestamp" actuel |

### Exemple de document:
```
Document ID: abc123xyz456 (l'UID de l'utilisateur)

Champs:
  email: "jean.dupont@example.com"
  role: "scout"
  firstName: "Jean"
  lastName: "Dupont"
  unitId: null
  points: 0
  profilePicture: null
  createdAt: [timestamp actuel]
  updatedAt: [timestamp actuel]
```

---

## 🚀 Solution 2: Déployer les Cloud Functions (Automatique)

Les Cloud Functions vont **automatiquement** créer les documents Firestore pour tous les **nouveaux** utilisateurs qui s'inscrivent.

### Prérequis
- Node.js installé (version 18+)
- Firebase CLI installé

### Étape 1: Installer Firebase CLI
```bash
npm install -g firebase-tools
```

### Étape 2: Se connecter à Firebase
```bash
firebase login
```

### Étape 3: Vérifier la configuration du projet
```bash
# À la racine du projet
firebase use wecamp-642bc
```

### Étape 4: Déployer les Cloud Functions
```bash
cd /Users/blanchartachille/WeCamp/project-g4-ba

# Déployer les fonctions
firebase deploy --only functions
```

Cela va déployer deux Cloud Functions:
- `createUserDocument`: Crée automatiquement un document Firestore quand un utilisateur s'inscrit
- `deleteUserDocument`: Supprime le document Firestore quand un utilisateur est supprimé

### Étape 5: Déployer les règles de sécurité Firestore
```bash
firebase deploy --only firestore:rules
```

### Étape 6: Tester
1. Créez un nouvel utilisateur dans **Authentication**
2. Vérifiez que le document apparaît automatiquement dans **Firestore** → `users` collection
3. Le document doit avoir l'ID = UID de l'utilisateur

---

## 📊 Vérification que tout fonctionne

### 1. Vérifier les documents users
1. Allez dans **Firestore Database** → Collection `users`
2. Vous devriez voir un document pour chaque utilisateur authentifié
3. L'ID du document doit correspondre à l'UID dans Authentication

### 2. Vérifier les Cloud Functions
1. Allez dans **Firebase Console** → **Functions**
2. Vous devriez voir:
   - `createUserDocument` (active)
   - `deleteUserDocument` (active)

### 3. Tester l'application
1. Lancez l'application: `npm start -- --web`
2. Connectez-vous avec un utilisateur existant
3. Vous ne devriez plus voir d'erreur "Impossible de charger les défis"
4. Le dashboard devrait afficher correctement les informations de l'utilisateur

---

## 🌱 Créer des défis de test

Une fois les utilisateurs configurés, vous pouvez créer des défis:

### Option 1: Via Firebase Console
1. Allez dans **Firestore Database** → Collection `challenges`
2. Cliquez sur **+ Ajouter un document** (Auto-ID)
3. Ajoutez ces champs:

| Champ | Type | Valeur exemple |
|-------|------|----------------|
| `title` | string | "Premier Campement" |
| `description` | string | "Participe à ton premier camp..." |
| `points` | number | `50` |
| `difficulty` | string | `easy` (ou `medium`, `hard`) |
| `unitId` | null | `null` (pour tous les scouts) |
| `startDate` | timestamp | Date de début |
| `endDate` | timestamp | Date de fin |
| `createdBy` | string | "system" |
| `createdAt` | timestamp | [timestamp actuel] |

### Option 2: Via script de seed
```bash
# 1. Mettez à jour scripts/seed-challenges.ts avec vos vraies clés Firebase
# 2. Lancez le script
npx ts-node scripts/seed-challenges.ts
```

---

## 🎯 Résumé des fichiers créés

- `/functions/src/index.ts` - Cloud Functions pour sync Auth/Firestore
- `/functions/package.json` - Dépendances Cloud Functions
- `/functions/tsconfig.json` - Config TypeScript
- `/firestore.rules` - Règles de sécurité Firestore
- `/firestore.indexes.json` - Index composites
- `/firebase.json` - Configuration Firebase
- `/scripts/seed-challenges.ts` - Script pour créer des défis de test

---

## ❓ FAQ

### Q: Les Cloud Functions coûtent-elles de l'argent?
R: Oui, mais le plan gratuit (Spark) permet jusqu'à 125K invocations/mois. Les Functions `createUserDocument` et `deleteUserDocument` sont très légères et ne seront appelées que lors de l'inscription/suppression d'utilisateurs.

### Q: Dois-je faire les deux solutions?
R:
- **Solution 1 (manuelle)**: Pour les utilisateurs déjà créés ✅ OBLIGATOIRE
- **Solution 2 (Cloud Functions)**: Pour les nouveaux utilisateurs ✅ RECOMMANDÉ

### Q: Comment changer le rôle d'un utilisateur?
R: Allez dans Firestore → `users` → Sélectionnez le document → Modifiez le champ `role` (scout/animator/parent)

### Q: J'ai l'erreur "Missing or insufficient permissions"
R: Déployez les règles de sécurité: `firebase deploy --only firestore:rules`

---

## 🆘 Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs des Cloud Functions: `firebase functions:log`
2. Vérifiez la console du navigateur pour les erreurs
3. Assurez-vous que l'UID dans Authentication correspond à l'ID du document dans Firestore

