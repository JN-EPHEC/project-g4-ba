# UAT - Système de Récompenses Partenaires

## Vue d'ensemble

Le système de récompenses permet aux animateurs d'échanger les points collectifs de leur unité contre des offres partenaires. Les scouts peuvent consulter les offres disponibles mais ne peuvent pas effectuer d'échanges.

### Points clés
- Les points sont cumulés par tous les scouts de l'unité (défis complétés)
- Seuls les animateurs peuvent échanger les points
- Un code promo unique est généré lors de chaque échange
- Les points sont déduits proportionnellement du solde des scouts

---

## ANIMATEUR

### UAT-RWD-001: Consulter le solde de points de l'unité

#### Prérequis
- Être connecté en tant qu'animateur
- L'unité doit avoir au moins un scout avec des points

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Accéder à l'onglet "Partenaires" depuis le dashboard | La page partenaires s'affiche |
| 2 | Observer le header | Le solde total de l'unité est affiché (ex: "1250 points") |
| 3 | Vérifier le calcul | Le solde = somme des points de tous les scouts de l'unité |

#### Critères d'acceptation
- [ ] Le solde s'affiche dans le header de la page
- [ ] Le solde correspond à la somme des points des scouts (`users.points` où `role == scout` et `unitId == unitId animateur`)
- [ ] Le solde se rafraîchit à chaque visite de la page

---

### UAT-RWD-002: Voir la liste des partenaires et offres

#### Prérequis
- Être connecté en tant qu'animateur
- Des partenaires et offres existent en base

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Accéder à l'onglet "Partenaires" | La liste des partenaires s'affiche |
| 2 | Observer un partenaire | Logo, nom, nombre d'offres visibles |
| 3 | Cliquer sur un partenaire | Les offres du partenaire s'affichent |
| 4 | Observer une offre | Titre, réduction, coût en points, validité visibles |
| 5 | Filtrer par catégorie (si disponible) | Les offres correspondantes s'affichent |

#### Critères d'acceptation
- [ ] Les partenaires actifs s'affichent avec leur logo
- [ ] Chaque offre affiche : titre, type de réduction (% ou €), coût en points
- [ ] Les offres inactives ou expirées ne s'affichent pas
- [ ] Le logo s'affiche correctement (URL ou emoji)

---

### UAT-RWD-003: Échanger des points contre une offre

#### Prérequis
- Être connecté en tant qu'animateur
- L'unité a suffisamment de points pour l'offre choisie
- L'offre est active et disponible

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Sélectionner une offre | La page de détail de l'offre s'affiche |
| 2 | Observer les informations | Partenaire, réduction, description, coût, solde actuel visibles |
| 3 | Vérifier le bouton | Si solde >= coût : bouton "Échanger maintenant" actif |
| 4 | Cliquer sur "Échanger maintenant" | Une modal de confirmation s'affiche |
| 5 | Confirmer l'échange | Le spinner s'affiche pendant le traitement |
| 6 | Échange réussi | Écran de succès avec le code promo généré |

#### Critères d'acceptation
- [ ] Le bouton est désactivé si solde insuffisant (affiche "Encore X pts")
- [ ] Une confirmation est demandée avant l'échange
- [ ] L'échange crée une entrée dans la collection `redemptions`
- [ ] Les points sont déduits de l'unité
- [ ] Un code promo unique est généré (format: XXXX-XXXX-XXXX)
- [ ] Le compteur `currentRedemptions` de l'offre est incrémenté

---

### UAT-RWD-004: Voir le code promo généré

#### Prérequis
- Avoir effectué un échange avec succès

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Après un échange réussi | L'écran de succès s'affiche |
| 2 | Observer le code | Le code promo est affiché en grand (ex: WECP-A1B2-C3D4) |
| 3 | Observer les détails | Partenaire, réduction, date d'expiration visibles |
| 4 | Voir les instructions | "Comment utiliser ?" avec les étapes |
| 5 | Cliquer sur "Terminé" | Retour à la liste des partenaires |

#### Critères d'acceptation
- [ ] Le code promo est clairement visible et lisible
- [ ] La date d'expiration est calculée (createdAt + validityDays)
- [ ] Les instructions d'utilisation sont affichées
- [ ] Le bouton "Terminé" redirige vers la liste des partenaires

---

### UAT-RWD-005: Consulter l'historique des échanges

#### Prérequis
- Être connecté en tant qu'animateur
- Des échanges ont été effectués pour l'unité

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Accéder à l'historique des échanges | La liste des redemptions s'affiche |
| 2 | Observer un échange | Partenaire, offre, code, date, statut visibles |
| 3 | Filtrer par statut | "Actifs", "Utilisés", "Expirés" |
| 4 | Cliquer sur un échange | Les détails complets s'affichent |

#### Critères d'acceptation
- [ ] Tous les échanges de l'unité sont listés
- [ ] Le statut est clairement indiqué (actif/utilisé/expiré)
- [ ] Les filtres par statut fonctionnent
- [ ] Les échanges sont triés par date (plus récent en premier)

---

### UAT-RWD-006: Marquer un code comme utilisé

#### Prérequis
- Être connecté en tant qu'animateur
- Un code promo actif existe

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Accéder aux détails d'un code actif | Les détails du code s'affichent |
| 2 | Cliquer sur "Marquer comme utilisé" | Une confirmation est demandée |
| 3 | Confirmer | Le statut passe à "utilisé" |
| 4 | Vérifier l'affichage | Le code apparaît maintenant comme utilisé |

#### Critères d'acceptation
- [ ] Le bouton n'est visible que pour les codes actifs
- [ ] Une confirmation est demandée
- [ ] Le statut `status` passe de "active" à "used"
- [ ] La date d'utilisation `usedAt` est enregistrée
- [ ] L'ID de l'animateur `usedBy` est enregistré

---

### UAT-RWD-007: Solde insuffisant pour une offre

#### Prérequis
- Être connecté en tant qu'animateur
- Le solde de l'unité est inférieur au coût de l'offre

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Sélectionner une offre coûtant plus que le solde | La page de détail s'affiche |
| 2 | Observer le bouton | Bouton grisé avec "Encore X pts" |
| 3 | Observer l'alerte | Message "Il vous manque X points pour cette offre" |
| 4 | Tenter de cliquer | Le bouton est désactivé, rien ne se passe |

#### Critères d'acceptation
- [ ] Le bouton indique les points manquants
- [ ] Un message d'alerte en jaune est affiché
- [ ] L'échange est impossible (bouton disabled)
- [ ] Le solde actuel et le coût sont clairement comparés

---

### UAT-RWD-008: Offre ayant atteint sa limite d'échanges

#### Prérequis
- Une offre avec `maxRedemptions` défini
- `currentRedemptions >= maxRedemptions`

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Accéder à une offre épuisée | L'offre s'affiche |
| 2 | Observer le statut | Badge "Épuisé" ou "Plus disponible" affiché |
| 3 | Tenter l'échange | Message d'erreur "Cette offre a atteint sa limite d'échanges" |

#### Critères d'acceptation
- [ ] Les offres épuisées sont marquées visuellement
- [ ] L'échange retourne une erreur appropriée
- [ ] L'offre reste visible mais non échangeable

---

## Modèle de données

### Collection `redemptions`

```typescript
{
  id: string;
  offerId: string;
  partnerId: string;
  requestedBy: string;      // ID de l'animateur
  requesterName: string;    // Nom de l'animateur
  unitId: string;
  pointsSpent: number;
  status: 'active' | 'used' | 'expired';
  code: string;             // Code promo généré
  expiresAt: Timestamp;
  createdAt: Timestamp;
  usedAt?: Timestamp;
  usedBy?: string;
}
```

### Calcul du solde de l'unité

```typescript
// Somme des points de tous les scouts de l'unité
const balance = await getDocs(
  query(
    collection(db, 'users'),
    where('unitId', '==', unitId),
    where('role', '==', 'scout')
  )
).then(snapshot =>
  snapshot.docs.reduce((sum, doc) => sum + (doc.data().points || 0), 0)
);
```

### Déduction des points

Les points sont déduits proportionnellement du solde de chaque scout :
1. Récupérer tous les scouts de l'unité avec leurs points
2. Calculer le pourcentage de chaque scout dans le total
3. Déduire proportionnellement (arrondi, excédent sur le premier scout)

---

## Règles Firestore

```javascript
// Redemptions
match /redemptions/{redemptionId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth != null && (
    request.auth.uid == resource.data.usedBy ||
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['animator', 'wecamp_admin']
  );
}

// Offres partenaires (mise à jour currentRedemptions)
match /partnerOffers/{offerId} {
  allow update: if request.auth != null && (
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'wecamp_admin' ||
    (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'animator' &&
     request.resource.data.diff(resource.data).affectedKeys().hasOnly(['currentRedemptions']))
  );
}
```

---

## Fichiers concernés

| Fichier | Description |
|---------|-------------|
| `app/(animator)/partners/index.tsx` | Liste des partenaires |
| `app/(animator)/partners/[partnerId].tsx` | Détail d'un partenaire et ses offres |
| `app/(animator)/partners/offer/[offerId].tsx` | Détail d'une offre et échange |
| `app/(animator)/partners/history.tsx` | Historique des échanges |
| `services/partner-service.ts` | Service de gestion des partenaires |
| `types/partners.ts` | Types TypeScript |
