# Guide : Créer les unités scoutes belges dans Firebase

## 📋 Structure des unités par fédération

Le système WeCamp organise les unités par **fédération** et par **branche d'âge**.

### Les 5 fédérations belges :

1. **Les Scouts** (152 réponses au questionnaire)
2. **Les Guides** (32 réponses)
3. **Le Patro** (28 réponses)
4. **Les Scouts et Guides Pluralistes** (2 réponses)
5. **Faucons Rouges** (0 réponses)

### Les 4 branches d'âge :

1. **Baladins** (6-8 ans) - category: `castors`
2. **Louveteaux** (8-12 ans) - category: `louveteaux`
3. **Éclaireurs** (12-16 ans) - category: `eclaireurs`
4. **Pionniers** (16-18 ans) - category: `pionniers`

**Total : 20 unités** (5 fédérations × 4 branches d'âge)

---

## 🚀 Méthode 1 : Utilisation du script automatique (RECOMMANDÉE)

Si vous avez les permissions administrateur sur Firebase :

```bash
npx ts-node scripts/init-units.ts
```

Ce script créera automatiquement :
- 1 groupe scout par défaut (`default-group`)
- Les 20 unités organisées par fédération

---

## 🖱️ Méthode 2 : Création manuelle via Firebase Console

### Étape 1 : Créer le groupe scout par défaut

1. Allez sur https://console.firebase.google.com
2. Sélectionnez votre projet **WeCamp**
3. Menu gauche → **Firestore Database**
4. Cliquez sur **+ Commencer une collection**
5. ID de la collection : `scoutGroups`
6. Créez un document avec :
   - **ID du document** : `default-group`
   - **Champs** :
     - `name` (string) : `Groupe WeCamp`
     - `address` (string) : `123 Rue des Scouts`
     - `city` (string) : `Bruxelles`
     - `postalCode` (string) : `1000`
     - `email` (string) : `contact@wecamp.be`
     - `phone` (string) : `+32 123 456 789`
     - `createdAt` (timestamp) : Cliquez sur l'horloge → "Maintenant"
     - `updatedAt` (timestamp) : Cliquez sur l'horloge → "Maintenant"

### Étape 2 : Créer la collection `units`

Créez une nouvelle collection nommée `units`, puis ajoutez les 20 documents suivants.

---

## 📝 Les 20 unités à créer

### LES SCOUTS (4 unités)

#### 1. Les Scouts - Baladins
- **ID du document** : `scouts-baladins`
- **Champs** :
  - `name` (string) : `Les Scouts - Baladins`
  - `category` (string) : `castors`
  - `description` (string) : `Baladins (6-8 ans) - Les Scouts`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

#### 2. Les Scouts - Louveteaux
- **ID du document** : `scouts-louveteaux`
- **Champs** :
  - `name` (string) : `Les Scouts - Louveteaux`
  - `category` (string) : `louveteaux`
  - `description` (string) : `Louveteaux (8-12 ans) - Les Scouts`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

#### 3. Les Scouts - Éclaireurs
- **ID du document** : `scouts-eclaireurs`
- **Champs** :
  - `name` (string) : `Les Scouts - Éclaireurs`
  - `category` (string) : `eclaireurs`
  - `description` (string) : `Éclaireurs (12-16 ans) - Les Scouts`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

#### 4. Les Scouts - Pionniers
- **ID du document** : `scouts-pionniers`
- **Champs** :
  - `name` (string) : `Les Scouts - Pionniers`
  - `category` (string) : `pionniers`
  - `description` (string) : `Pionniers (16-18 ans) - Les Scouts`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

---

### LES GUIDES (4 unités)

#### 5. Les Guides - Baladins
- **ID du document** : `guides-baladins`
- **Champs** :
  - `name` (string) : `Les Guides - Baladins`
  - `category` (string) : `castors`
  - `description` (string) : `Baladins (6-8 ans) - Les Guides`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

#### 6. Les Guides - Louveteaux
- **ID du document** : `guides-louveteaux`
- **Champs** :
  - `name` (string) : `Les Guides - Louveteaux`
  - `category` (string) : `louveteaux`
  - `description` (string) : `Louveteaux (8-12 ans) - Les Guides`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

#### 7. Les Guides - Éclaireurs
- **ID du document** : `guides-eclaireurs`
- **Champs** :
  - `name` (string) : `Les Guides - Éclaireurs`
  - `category` (string) : `eclaireurs`
  - `description` (string) : `Éclaireurs (12-16 ans) - Les Guides`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

#### 8. Les Guides - Pionniers
- **ID du document** : `guides-pionniers`
- **Champs** :
  - `name` (string) : `Les Guides - Pionniers`
  - `category` (string) : `pionniers`
  - `description` (string) : `Pionniers (16-18 ans) - Les Guides`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

---

### LE PATRO (4 unités)

#### 9. Le Patro - Baladins
- **ID du document** : `patro-baladins`
- **Champs** :
  - `name` (string) : `Le Patro - Baladins`
  - `category` (string) : `castors`
  - `description` (string) : `Baladins (6-8 ans) - Le Patro`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

#### 10. Le Patro - Louveteaux
- **ID du document** : `patro-louveteaux`
- **Champs** :
  - `name` (string) : `Le Patro - Louveteaux`
  - `category` (string) : `louveteaux`
  - `description` (string) : `Louveteaux (8-12 ans) - Le Patro`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

#### 11. Le Patro - Éclaireurs
- **ID du document** : `patro-eclaireurs`
- **Champs** :
  - `name` (string) : `Le Patro - Éclaireurs`
  - `category` (string) : `eclaireurs`
  - `description` (string) : `Éclaireurs (12-16 ans) - Le Patro`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

#### 12. Le Patro - Pionniers
- **ID du document** : `patro-pionniers`
- **Champs** :
  - `name` (string) : `Le Patro - Pionniers`
  - `category` (string) : `pionniers`
  - `description` (string) : `Pionniers (16-18 ans) - Le Patro`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

---

### LES SCOUTS ET GUIDES PLURALISTES (4 unités)

#### 13. Les Scouts et Guides Pluralistes - Baladins
- **ID du document** : `sgp-baladins`
- **Champs** :
  - `name` (string) : `Les Scouts et Guides Pluralistes - Baladins`
  - `category` (string) : `castors`
  - `description` (string) : `Baladins (6-8 ans) - Les Scouts et Guides Pluralistes`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

#### 14. Les Scouts et Guides Pluralistes - Louveteaux
- **ID du document** : `sgp-louveteaux`
- **Champs** :
  - `name` (string) : `Les Scouts et Guides Pluralistes - Louveteaux`
  - `category` (string) : `louveteaux`
  - `description` (string) : `Louveteaux (8-12 ans) - Les Scouts et Guides Pluralistes`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

#### 15. Les Scouts et Guides Pluralistes - Éclaireurs
- **ID du document** : `sgp-eclaireurs`
- **Champs** :
  - `name` (string) : `Les Scouts et Guides Pluralistes - Éclaireurs`
  - `category` (string) : `eclaireurs`
  - `description` (string) : `Éclaireurs (12-16 ans) - Les Scouts et Guides Pluralistes`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

#### 16. Les Scouts et Guides Pluralistes - Pionniers
- **ID du document** : `sgp-pionniers`
- **Champs** :
  - `name` (string) : `Les Scouts et Guides Pluralistes - Pionniers`
  - `category` (string) : `pionniers`
  - `description` (string) : `Pionniers (16-18 ans) - Les Scouts et Guides Pluralistes`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

---

### FAUCONS ROUGES (4 unités)

#### 17. Faucons Rouges - Baladins
- **ID du document** : `faucons-baladins`
- **Champs** :
  - `name` (string) : `Faucons Rouges - Baladins`
  - `category` (string) : `castors`
  - `description` (string) : `Baladins (6-8 ans) - Faucons Rouges`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

#### 18. Faucons Rouges - Louveteaux
- **ID du document** : `faucons-louveteaux`
- **Champs** :
  - `name` (string) : `Faucons Rouges - Louveteaux`
  - `category` (string) : `louveteaux`
  - `description` (string) : `Louveteaux (8-12 ans) - Faucons Rouges`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

#### 19. Faucons Rouges - Éclaireurs
- **ID du document** : `faucons-eclaireurs`
- **Champs** :
  - `name` (string) : `Faucons Rouges - Éclaireurs`
  - `category` (string) : `eclaireurs`
  - `description` (string) : `Éclaireurs (12-16 ans) - Faucons Rouges`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

#### 20. Faucons Rouges - Pionniers
- **ID du document** : `faucons-pionniers`
- **Champs** :
  - `name` (string) : `Faucons Rouges - Pionniers`
  - `category` (string) : `pionniers`
  - `description` (string) : `Pionniers (16-18 ans) - Faucons Rouges`
  - `groupId` (string) : `default-group`
  - `leaderId` (string) : `temp-leader`
  - `createdAt` (timestamp) : "Maintenant"
  - `updatedAt` (timestamp) : "Maintenant"

---

## ✅ Vérification

Une fois toutes les unités créées, vous devriez voir dans Firestore Database :
- Collection `scoutGroups` avec 1 document (`default-group`)
- Collection `units` avec 20 documents
- Chaque document d'unité a 7 champs : name, category, description, groupId, leaderId, createdAt, updatedAt

## 🎯 Prochaines étapes

1. Les scouts pourront maintenant choisir leur fédération et leur branche d'âge lors de l'inscription
2. Les animateurs devront ensuite valider les inscriptions
3. Vous pourrez assigner des animateurs spécifiques à chaque unité en modifiant le champ `leaderId`

## 📊 Statistiques des fédérations

D'après le questionnaire MyTribe :
- **Les Scouts** : 152 réponses (76%)
- **Les Guides** : 32 réponses (16%)
- **Le Patro** : 28 réponses (14%)
- **Les Scouts et Guides Pluralistes** : 2 réponses (1%)
- **Faucons Rouges** : 0 réponses (0%)

## 📚 Sources

Structure basée sur les principales fédérations scoutes de Belgique et le questionnaire quantitatif MyTribe.
