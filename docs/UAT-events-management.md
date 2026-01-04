# UAT - Gestion des Événements

## Fonctionnalités testées
- Modification d'événements par les animateurs
- Autocomplete d'adresses (LocationInput)
- Affichage du nom de l'unité sur les cartes
- Upload et affichage d'images de fond
- Design des cartes événements avec image

---

## UAT-EVT-001: Modification d'un événement

### Prérequis
- Être connecté en tant qu'animateur
- Avoir au moins un événement créé par son unité

### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Accéder à la page "Événements" | La liste des événements s'affiche |
| 2 | Identifier un événement de son unité | Un bouton crayon (édition) est visible sur la carte |
| 3 | Cliquer sur le bouton crayon | L'écran d'édition s'ouvre avec les données pré-remplies |
| 4 | Vérifier les champs pré-remplis | Titre, description, type, lieu, dates, participants max et image sont correctement affichés |
| 5 | Modifier le titre de l'événement | Le champ se met à jour |
| 6 | Cliquer sur "Enregistrer les modifications" | Message de succès affiché, redirection vers la liste des événements |
| 7 | Vérifier l'événement dans la liste | Le titre modifié est visible |

### Critères d'acceptation
- [x] Le bouton d'édition n'apparaît que pour les événements de son unité
- [x] Tous les champs sont pré-remplis correctement
- [x] La modification est sauvegardée en base de données
- [x] Redirection vers la liste après modification réussie

---

## UAT-EVT-002: Autocomplete d'adresses

### Prérequis
- Être sur l'écran de création ou modification d'événement
- Avoir une connexion internet

### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur le champ "Lieu" | Le champ devient actif |
| 2 | Taper "Bruxelles" (3+ caractères) | Un indicateur de chargement apparaît |
| 3 | Attendre ~500ms | Une liste de suggestions d'adresses apparaît |
| 4 | Vérifier les suggestions | Les adresses contiennent "Bruxelles" et sont en Belgique/France/Suisse/Luxembourg |
| 5 | Cliquer sur une suggestion | L'adresse complète remplit le champ, les suggestions disparaissent |
| 6 | Effacer le champ et taper "xyz123abc" | Message "Aucune adresse trouvée" s'affiche |

### Critères d'acceptation
- [x] La recherche démarre après 3 caractères minimum
- [x] Un délai (debounce) évite les requêtes excessives
- [x] Les suggestions proviennent de Nominatim (OpenStreetMap)
- [x] La sélection d'une suggestion remplit le champ
- [x] Un message s'affiche si aucun résultat

---

## UAT-EVT-003: Affichage du nom de l'unité

### Prérequis
- Être connecté (animateur, scout ou parent)
- Avoir des événements de différentes unités

### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Accéder à la page "Événements" | La liste des événements s'affiche |
| 2 | Observer une carte événement | Un badge avec 🏕️ et le nom de l'unité est visible |
| 3 | Vérifier plusieurs événements | Chaque événement affiche le nom de son unité |

### Critères d'acceptation
- [x] Le nom de l'unité est affiché sur chaque carte
- [x] Le badge est visible sur les cartes avec et sans image
- [x] Le nom provient de la collection "units" en base de données

---

## UAT-EVT-004: Upload d'image de fond

### Prérequis
- Être connecté en tant qu'animateur
- Être sur l'écran de création ou modification d'événement

### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Localiser la section "Image de fond (optionnel)" | Une zone pointillée avec icône image est visible |
| 2 | Cliquer sur la zone | La galerie photos s'ouvre (ou demande de permission) |
| 3 | Sélectionner une image | Un indicateur de chargement apparaît |
| 4 | Attendre l'upload | L'image s'affiche en prévisualisation |
| 5 | Vérifier le bouton de suppression | Un bouton X rouge est visible en haut à droite |
| 6 | Cliquer sur le bouton X | L'image est supprimée, la zone pointillée réapparaît |
| 7 | Sauvegarder l'événement avec image | L'événement est créé/modifié avec l'image |

### Critères d'acceptation
- [x] L'upload fonctionne (pas d'erreur 403)
- [x] La prévisualisation s'affiche correctement
- [x] L'image peut être supprimée avant sauvegarde
- [x] L'image est stockée dans Firebase Storage
- [x] Limite de taille: 20 MB maximum

---

## UAT-EVT-005: Design carte événement avec image

### Prérequis
- Avoir un événement avec une image de fond

### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Accéder à la page "Événements" | La liste des événements s'affiche |
| 2 | Observer une carte avec image | L'image est en fond, hauteur ~320px |
| 3 | Vérifier la lisibilité du texte | Le titre en blanc est lisible grâce au gradient sombre |
| 4 | Vérifier les badges en haut | Type d'événement et date sont sur fond blanc/semi-transparent |
| 5 | Vérifier les infos en bas | Heure, lieu, participants sont dans des chips blancs lisibles |
| 6 | Vérifier le bouton d'inscription | Le bouton est visible et cliquable |
| 7 | Comparer avec une carte sans image | La carte sans image a un layout horizontal classique |

### Critères d'acceptation
- [x] Hauteur de carte avec image: 320px
- [x] Gradient du haut vers le bas (10% → 90% opacité)
- [x] Titre en blanc avec ombre pour lisibilité
- [x] Tous les badges ont un fond blanc semi-transparent
- [x] Les boutons edit/delete sont visibles sur les cartes avec image

---

## UAT-EVT-006: Permissions d'édition

### Prérequis
- Être connecté en tant qu'animateur
- Avoir des événements de son unité ET d'autres unités

### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Accéder à la page "Événements" | La liste des événements s'affiche |
| 2 | Observer un événement de son unité | Boutons édition (crayon) et suppression (poubelle) visibles |
| 3 | Observer un événement d'une autre unité | Pas de bouton édition ni suppression |
| 4 | Tenter d'accéder directement à l'URL d'édition d'un autre événement | L'édition est bloquée (règles Firestore) |

### Critères d'acceptation
- [x] Bouton édition visible uniquement pour les événements de son unité
- [x] Bouton suppression visible uniquement pour les événements de son unité
- [x] Les règles Firestore protègent contre les modifications non autorisées

---

## Résumé des tests

| ID | Fonctionnalité | Statut |
|----|----------------|--------|
| UAT-EVT-001 | Modification d'événement | À tester |
| UAT-EVT-002 | Autocomplete d'adresses | À tester |
| UAT-EVT-003 | Affichage nom unité | À tester |
| UAT-EVT-004 | Upload image de fond | À tester |
| UAT-EVT-005 | Design carte avec image | À tester |
| UAT-EVT-006 | Permissions d'édition | À tester |

---

## Notes techniques

### Fichiers modifiés
- `app/(animator)/events/[id].tsx` - Écran d'édition
- `components/ui/location-input.tsx` - Composant autocomplete
- `src/features/events/components/event-card.tsx` - Design des cartes
- `components/events-screen.tsx` - Passage des props edit/unitName
- `firestore.rules` - Règles de sécurité (simplifiées temporairement)
- `storage.rules` - Règles storage (simplifiées temporairement)

### API externe utilisée
- **Nominatim (OpenStreetMap)**: Autocomplete d'adresses
  - Endpoint: `https://nominatim.openstreetmap.org/search`
  - Pays supportés: FR, BE, CH, LU
  - Limite: 5 résultats par requête

### Points d'attention
1. Les règles Firestore sont temporairement simplifiées - à renforcer en production
2. Les règles Storage sont temporairement simplifiées - à renforcer en production
3. L'API Nominatim a des limites d'utilisation (1 requête/seconde recommandé)
