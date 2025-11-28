# Guide de configuration des unités WeCamp

## Vue d'ensemble du système

Le système WeCamp organise les scouts en **unités** (troupes). Chaque unité a :
- Un ID unique
- Un nom (ex: "Les Louveteaux")
- Une catégorie d'âge (castors, louveteaux, éclaireurs, pionniers, compagnons)
- Un animateur responsable

## 📋 Étapes de configuration

### 1. Initialiser les unités dans Firebase

Exécutez le script d'initialisation pour créer les unités de base :

```bash
npx ts-node scripts/init-units.ts
```

Ce script crée :
- Un groupe scout par défaut
- 5 unités (une pour chaque catégorie d'âge)

### 2. Créer des comptes animateurs

1. Utilisez l'interface d'inscription de l'application
2. Choisissez le rôle "Animateur"
3. Répétez pour chaque unité (vous aurez besoin d'un animateur par unité)

### 3. Assigner les animateurs aux unités

Pour chaque animateur créé :

1. Trouvez l'ID de l'animateur dans Firestore (collection `users`)
2. Mettez à jour le champ `leaderId` de l'unité correspondante
3. Mettez à jour le champ `unitId` de l'animateur

**Exemple dans Firestore :**

```
Collection: units
Document ID: louveteaux-unit
Champs:
  - leaderId: "abc123..." (ID de l'animateur)
  - name: "Les Louveteaux"
  - category: "louveteaux"
  ...

Collection: users
Document ID: abc123... (L'animateur)
Champs:
  - unitId: "louveteaux-unit"
  - role: "animator"
  - isUnitLeader: true
  ...
```

### 4. Processus d'inscription des scouts

Lorsqu'un scout s'inscrit :

1. Il remplit le formulaire d'inscription (nom, email, mot de passe)
2. Il choisit son rôle "Scout"
3. **Il sélectionne son unité** parmi la liste disponible
4. Son compte est créé avec `validated: false`
5. Il reçoit un message lui indiquant d'attendre la validation

### 5. Validation des scouts par l'animateur

L'animateur peut :

1. Se connecter à son compte
2. Aller dans **Gestion → Valider les inscriptions**
3. Voir la liste des scouts en attente
4. **Valider** ou **Rejeter** chaque inscription

Une fois validé, le scout peut se connecter normalement.

## 🔧 Personnalisation des unités

Vous pouvez modifier le fichier `scripts/init-units.ts` pour :
- Changer les noms des unités
- Ajouter/supprimer des unités
- Modifier les descriptions

Exemple :

```typescript
const units = [
  {
    id: 'louveteaux-bruxelles',
    name: 'Louveteaux de Bruxelles',
    category: 'louveteaux',
    description: 'Unité pour les 8-12 ans à Bruxelles',
    groupId: 'default-group',
    leaderId: 'temp-leader',
  },
  // Ajoutez vos unités ici...
];
```

## 🎯 Architecture du système

```
ScoutGroup (Groupe WeCamp)
  └── Unit (Louveteaux)
        ├── Animator (leaderId)
        └── Scouts (unitId = Unit ID)
              ├── Scout 1 (validated: true)
              ├── Scout 2 (validated: false) ← En attente
              └── Scout 3 (validated: true)
```

## 📝 Notes importantes

- **Un scout ne peut appartenir qu'à une seule unité**
- **Les scouts non validés ne peuvent pas se connecter** (à implémenter dans la logique de connexion)
- **Les animateurs voient uniquement les scouts de leur unité**
- **Le système supporte plusieurs groupes scouts** (utile pour les grandes organisations)

## 🚀 Prochaines étapes

Après la configuration :
1. Testez le processus d'inscription
2. Vérifiez que les animateurs peuvent valider les scouts
3. Assurez-vous que les scouts validés apparaissent dans la liste des scouts de l'unité
