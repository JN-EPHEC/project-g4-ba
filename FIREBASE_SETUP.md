# Configuration Firebase pour WeCamp

Ce document explique comment configurer Firebase pour votre projet WeCamp.

## ✅ Étape 1 : Configuration déjà effectuée

Les credentials Firebase ont été intégrés dans le fichier `config/firebase.ts` avec vos informations :
- **Projet** : wecamp-642bc
- **API Key** : Configurée
- **Auth Domain** : wecamp-642bc.firebaseapp.com

## 🔥 Étape 2 : Activer Firebase Authentication

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet **wecamp-642bc**
3. Dans le menu de gauche, cliquez sur **Authentication**
4. Cliquez sur **Get started** (si ce n'est pas déjà fait)
5. Dans l'onglet **Sign-in method**, activez les fournisseurs suivants :

### Email/Password (OBLIGATOIRE)
- Cliquez sur **Email/Password**
- Activez le bouton **Enable**
- Cliquez sur **Save**

### Google Sign-In (OPTIONNEL)
- Cliquez sur **Google**
- Activez le bouton **Enable**
- Sélectionnez un email de support pour le projet
- Cliquez sur **Save**

## 📊 Étape 3 : Configurer Firestore Database

1. Dans la console Firebase, cliquez sur **Firestore Database**
2. Cliquez sur **Create database**
3. Choisissez **Start in test mode** pour commencer (ATTENTION : à changer en production)
4. Sélectionnez un emplacement (par exemple : `europe-west1`)
5. Cliquez sur **Enable**

### Règles de sécurité Firestore

Une fois la base de données créée, allez dans l'onglet **Rules** et remplacez par :

\`\`\`
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Collection users
    match /users/{userId} {
      // L'utilisateur peut lire et modifier seulement son propre document
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;

      // Les animateurs peuvent lire tous les users
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'animator';
    }

    // Collection events
    match /events/{eventId} {
      // Tout utilisateur authentifié peut lire les événements
      allow read: if request.auth != null;

      // Seuls les animateurs peuvent créer/modifier/supprimer des événements
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'animator';
    }

    // Collection challenges
    match /challenges/{challengeId} {
      // Tout utilisateur authentifié peut lire les défis
      allow read: if request.auth != null;

      // Seuls les animateurs peuvent créer/modifier/supprimer des défis
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'animator';
    }

    // Par défaut, deny all
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
\`\`\`

**Publiez** ces règles en cliquant sur **Publish**.

## 🗄️ Étape 4 : Configurer Firebase Storage (pour les photos)

1. Dans la console Firebase, cliquez sur **Storage**
2. Cliquez sur **Get started**
3. Choisissez **Start in test mode**
4. Cliquez sur **Next** puis **Done**

### Règles de sécurité Storage

Allez dans l'onglet **Rules** et remplacez par :

\`\`\`
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Images de profil
    match /profiles/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Photos d'événements
    match /events/{eventId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Photos de défis
    match /challenges/{challengeId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Par défaut, deny all
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
\`\`\`

**Publiez** ces règles.

## 📝 Étape 5 : Structure des collections Firestore

### Collection `users`
Document ID = Firebase Auth UID
\`\`\`
{
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'scout' | 'parent' | 'animator'
  createdAt: string (ISO Date)
  updatedAt: string (ISO Date)

  // Pour les scouts
  parentIds?: string[]
  unitId?: string
  points?: number
  dateOfBirth?: string (ISO Date)
  rank?: string
  profilePicture?: string

  // Pour les parents
  scoutIds?: string[]
  phone?: string

  // Pour les animateurs
  isUnitLeader?: boolean
  specialties?: string[]
}
\`\`\`

### Collection `events`
\`\`\`
{
  id: string
  title: string
  description: string
  type: 'meeting' | 'camp' | 'activity' | 'training' | 'other'
  unitId: string
  location: string
  startDate: string (ISO Date)
  endDate: string (ISO Date)
  imageUrl?: string
  createdBy: string (animator user ID)
  requiresParentConfirmation: boolean
  maxParticipants?: number
  createdAt: string (ISO Date)
  updatedAt: string (ISO Date)
}
\`\`\`

### Collection `challenges`
\`\`\`
{
  id: string
  title: string
  description: string
  points: number
  difficulty: 'easy' | 'medium' | 'hard'
  unitId?: string
  imageUrl?: string
  startDate: string (ISO Date)
  endDate: string (ISO Date)
  createdBy: string (animator user ID)
  createdAt: string (ISO Date)
}
\`\`\`

## 🧪 Tester l'authentification

Une fois Firebase configuré, vous pouvez tester l'authentification :

1. Lancez l'application : `npm run web`
2. Cliquez sur **S'inscrire**
3. Remplissez le formulaire d'inscription
4. Vérifiez dans la console Firebase > Authentication que l'utilisateur a été créé
5. Vérifiez dans Firestore > users que le document utilisateur existe

## 🔒 Sécurité

**IMPORTANT** :
- Le fichier `config/firebase.ts` contient vos credentials et est ignoré par git (.gitignore)
- **NE PARTAGEZ JAMAIS** vos credentials Firebase publiquement
- Changez les règles Firestore de "test mode" à "production mode" avant le déploiement
- Activez App Check pour protéger votre backend

## 📚 Documentation Firebase

- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Firebase Storage](https://firebase.google.com/docs/storage)
