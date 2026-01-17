# UAT - Panneau Admin WeCamp

## Vue d'ensemble

Le panneau admin WeCamp permet aux administrateurs de gérer l'ensemble de la plateforme. Il comporte 6 onglets principaux :
- **Dashboard** : Vue d'ensemble des statistiques globales
- **Défis** : Gestion des défis (CRUD)
- **Unités** : Gestion des unités et sections
- **Classement** : Classement des unités par points
- **Partenaires** : Gestion des partenaires et offres
- **Badges** : Gestion des badges

---

## 1. DASHBOARD

### UAT-ADM-001: Affichage des statistiques globales

#### Prérequis
- Être connecté en tant qu'admin WeCamp

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Accéder au panneau admin | Le dashboard s'affiche par défaut |
| 2 | Observer les statistiques | 4 cartes de stats sont visibles : Scouts, Unités, Défis actifs, Points distribués |
| 3 | Vérifier la cohérence | Les chiffres correspondent aux données réelles en base |
| 4 | Pull-to-refresh | Les données se rafraîchissent |

#### Critères d'acceptation
- [ ] Les 4 statistiques principales s'affichent
- [ ] Les données sont chargées depuis `AdminStatsService`
- [ ] Le refresh fonctionne correctement

---

## 2. DÉFIS

### UAT-ADM-002: Liste des défis

#### Prérequis
- Être connecté en tant qu'admin WeCamp
- Avoir au moins quelques défis en base

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur l'onglet "Défis" | La liste des défis s'affiche |
| 2 | Observer les filtres | Boutons "Tous", "Actifs", "Terminés" visibles |
| 3 | Filtrer par "Actifs" | Seuls les défis actifs s'affichent |
| 4 | Utiliser la recherche | Les défis correspondants au terme s'affichent |
| 5 | Observer une carte défi | Titre, catégorie, points, dates, statut visibles |

#### Critères d'acceptation
- [ ] Les filtres fonctionnent (tous/actifs/terminés)
- [ ] La recherche fonctionne
- [ ] Chaque défi affiche ses informations principales

### UAT-ADM-003: Création d'un défi

#### Prérequis
- Être sur l'onglet "Défis"

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Nouveau défi" | Redirection vers la page de création |
| 2 | Remplir le titre | Champ obligatoire validé |
| 3 | Remplir la description | Champ obligatoire validé |
| 4 | Sélectionner une catégorie | Liste déroulante avec les catégories disponibles |
| 5 | Définir les points | Valeur numérique positive |
| 6 | Définir les dates début/fin | Date picker fonctionnel |
| 7 | Ajouter une image (optionnel) | Upload vers Firebase Storage |
| 8 | Cliquer sur "Créer" | Défi créé, redirection vers la liste |
| 9 | Vérifier dans la liste | Le nouveau défi apparaît |

#### Critères d'acceptation
- [ ] Tous les champs obligatoires sont validés
- [ ] L'image est uploadée correctement
- [ ] Le défi est créé en base Firestore
- [ ] Redirection après création

### UAT-ADM-004: Modification d'un défi

#### Prérequis
- Avoir au moins un défi existant

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur un défi dans la liste | Menu contextuel ou redirection vers édition |
| 2 | Modifier le titre | Le champ se met à jour |
| 3 | Modifier les points | Le champ se met à jour |
| 4 | Cliquer sur "Enregistrer" | Modifications sauvegardées |
| 5 | Vérifier dans la liste | Les modifications sont visibles |

#### Critères d'acceptation
- [ ] Les champs sont pré-remplis avec les valeurs actuelles
- [ ] La modification est persistée en base
- [ ] Message de succès affiché

### UAT-ADM-005: Suppression d'un défi

#### Prérequis
- Avoir au moins un défi existant

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur l'icône de suppression | Confirmation demandée |
| 2 | Confirmer la suppression | Défi supprimé |
| 3 | Vérifier la liste | Le défi n'apparaît plus |

#### Critères d'acceptation
- [ ] Confirmation avant suppression
- [ ] Le défi est supprimé de Firestore
- [ ] La liste se met à jour automatiquement

---

## 3. UNITÉS

### UAT-ADM-006: Liste des unités

#### Prérequis
- Être sur l'onglet "Unités"

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Observer la liste des unités | Toutes les unités s'affichent |
| 2 | Observer une carte unité | Nom, catégorie, niveau (Bronze/Argent/Or), nombre de scouts/animateurs, points |
| 3 | Cliquer sur "Voir" | Détails de l'unité s'affichent (modal ou expansion) |
| 4 | Observer le compteur de sections | "Sections (X)" affiche le bon nombre |

#### Critères d'acceptation
- [ ] Toutes les unités sont listées
- [ ] Les informations sont correctes (nom, catégorie, stats)
- [ ] Le compteur de sections est correct

### UAT-ADM-007: Création d'une unité

#### Prérequis
- Être sur l'onglet "Unités"

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Nouvelle unité" | Formulaire de création s'affiche |
| 2 | Remplir le nom | Champ obligatoire |
| 3 | Sélectionner la catégorie | scouts/guides/patro/sgp/faucons |
| 4 | Ajouter une description | Champ optionnel |
| 5 | Ajouter un logo (optionnel) | Upload vers Firebase Storage |
| 6 | Cliquer sur "Créer" | Unité créée avec un code unique |
| 7 | Vérifier le code | Un code d'inscription est généré et affiché |
| 8 | Copier/Partager le code | Fonction de copie/partage fonctionnelle |

#### Critères d'acceptation
- [ ] L'unité est créée en base Firestore
- [ ] Un code unique est généré
- [ ] Le code peut être copié/partagé
- [ ] Le logo est uploadé si fourni

### UAT-ADM-008: Gestion des sections d'une unité

#### Prérequis
- Avoir une unité existante

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Sections (X)" d'une unité | La liste des sections s'expand |
| 2 | Cliquer sur "Ajouter section" | Formulaire de création section |
| 3 | Remplir le nom de la section | Champ obligatoire |
| 4 | Sélectionner le type | Louveteaux/Éclaireurs/Pionniers/etc. |
| 5 | Cliquer sur "Créer" | Section créée avec un code unique |
| 6 | Vérifier le code | Un code d'inscription section est généré |
| 7 | Vérifier le compteur | "Sections (X+1)" est mis à jour |

#### Critères d'acceptation
- [ ] La section est créée et liée à l'unité
- [ ] Un code unique de section est généré
- [ ] Le compteur de sections se met à jour

---

## 4. CLASSEMENT

### UAT-ADM-009: Affichage du classement des unités

#### Prérequis
- Avoir plusieurs unités avec des points différents

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur l'onglet "Classement" | Le classement s'affiche |
| 2 | Observer le podium (top 3) | Les 3 premières unités sont mises en avant (Or, Argent, Bronze) |
| 3 | Observer le reste du classement | Liste ordonnée par points décroissants |
| 4 | Filtrer par période | Options : Semaine/Mois/Année/Tout |
| 5 | Vérifier les stats de chaque unité | Points, nombre de membres, rang visibles |

#### Critères d'acceptation
- [ ] Classement trié par points décroissants
- [ ] Podium visuel pour top 3
- [ ] Filtres par période fonctionnels
- [ ] Données correctes et cohérentes

---

## 5. PARTENAIRES

### UAT-ADM-010: Liste des partenaires

#### Prérequis
- Être sur l'onglet "Partenaires"

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Observer les sous-onglets | "Partenaires" et "Offres" visibles |
| 2 | Observer la liste des partenaires | Logo, nom, catégorie, description visibles |
| 3 | Utiliser la recherche | Filtrage par nom de partenaire |

#### Critères d'acceptation
- [ ] Tous les partenaires sont listés
- [ ] Le logo s'affiche correctement
- [ ] La recherche fonctionne

### UAT-ADM-011: Création d'un partenaire

#### Prérequis
- Être sur l'onglet "Partenaires"

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Nouveau partenaire" | Formulaire de création s'affiche |
| 2 | Remplir le nom | Champ obligatoire |
| 3 | Sélectionner une catégorie | alimentation/loisirs/sport/culture/etc. |
| 4 | Ajouter une description | Champ optionnel |
| 5 | Ajouter un site web | URL optionnelle |
| 6 | Ajouter un logo | Upload vers Firebase Storage |
| 7 | Cliquer sur "Créer" | Partenaire créé |

#### Critères d'acceptation
- [ ] Le partenaire est créé en base
- [ ] Le logo est uploadé correctement
- [ ] Le partenaire apparaît dans la liste

### UAT-ADM-012: Gestion des offres

#### Prérequis
- Avoir au moins un partenaire

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur le sous-onglet "Offres" | Liste des offres s'affiche |
| 2 | Cliquer sur "Nouvelle offre" | Formulaire de création s'affiche |
| 3 | Sélectionner un partenaire | Liste déroulante des partenaires |
| 4 | Remplir le titre de l'offre | Champ obligatoire |
| 5 | Définir le type de remise | Pourcentage ou montant fixe |
| 6 | Définir la valeur de remise | Valeur numérique |
| 7 | Définir le coût en points | Points nécessaires pour réclamer |
| 8 | Définir la durée de validité | Nombre de jours |
| 9 | Cliquer sur "Créer" | Offre créée et liée au partenaire |

#### Critères d'acceptation
- [ ] L'offre est créée en base
- [ ] L'offre est liée au bon partenaire
- [ ] Les paramètres (remise, points, validité) sont corrects

### UAT-ADM-013: Modification/Suppression d'une offre

#### Prérequis
- Avoir au moins une offre existante

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur une offre | Menu contextuel ou options d'édition |
| 2 | Modifier les paramètres | Les champs se mettent à jour |
| 3 | Sauvegarder | Modifications persistées |
| 4 | Supprimer une offre | Confirmation demandée puis suppression |

#### Critères d'acceptation
- [ ] La modification est persistée
- [ ] La suppression fonctionne avec confirmation

---

## 6. BADGES

### UAT-ADM-014: Liste des badges

#### Prérequis
- Être sur l'onglet "Badges"

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Observer la liste | Tous les badges définis s'affichent |
| 2 | Observer une carte badge | Icône, nom, description, catégorie, condition visibles |
| 3 | Observer le compteur global | "X badges attribués au total" visible |
| 4 | Utiliser la recherche | Filtrage par nom de badge |

#### Critères d'acceptation
- [ ] Tous les badges sont listés
- [ ] Les informations sont correctes
- [ ] Le compteur total est correct

### UAT-ADM-015: Création d'un badge

#### Prérequis
- Être sur l'onglet "Badges"

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Nouveau badge" | Formulaire de création s'affiche |
| 2 | Remplir le nom | Champ obligatoire |
| 3 | Remplir la description | Champ obligatoire |
| 4 | Sélectionner une icône/emoji | Sélecteur d'icône |
| 5 | Sélectionner une catégorie | Nature/Sport/Culture/Social/etc. |
| 6 | Définir la condition d'obtention | Type: points/challenges/challenges_category/manual |
| 7 | Si points: définir le seuil | Nombre de points requis |
| 8 | Si challenges: définir le nombre | Nombre de défis à compléter |
| 9 | Cliquer sur "Créer" | Badge créé |

#### Critères d'acceptation
- [ ] Le badge est créé en base
- [ ] La condition est correctement enregistrée
- [ ] Le badge apparaît dans la liste

### UAT-ADM-016: Modification/Suppression d'un badge

#### Prérequis
- Avoir au moins un badge existant

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur un badge | Options d'édition visibles |
| 2 | Modifier le nom | Le champ se met à jour |
| 3 | Modifier la condition | La condition est mise à jour |
| 4 | Sauvegarder | Modifications persistées |
| 5 | Supprimer un badge | Confirmation demandée puis suppression |

#### Critères d'acceptation
- [ ] La modification est persistée
- [ ] La suppression fonctionne avec confirmation
- [ ] Les badges déjà attribués ne sont pas affectés

---

## 7. FONCTIONNALITÉS TRANSVERSALES

### UAT-ADM-017: Navigation entre onglets

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur chaque onglet | Le contenu correspondant s'affiche |
| 2 | Vérifier la mise en surbrillance | L'onglet actif est visuellement distinct |
| 3 | Rafraîchir la page | L'état de l'onglet est maintenu (ou dashboard par défaut) |

#### Critères d'acceptation
- [ ] Navigation fluide entre les 6 onglets
- [ ] Indication visuelle de l'onglet actif

### UAT-ADM-018: Déconnexion

#### Scénario
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur le bouton de profil/déconnexion | Menu ou confirmation |
| 2 | Confirmer la déconnexion | Redirection vers la page de login |
| 3 | Tenter de revenir en arrière | Impossible d'accéder au panneau admin |

#### Critères d'acceptation
- [ ] La déconnexion supprime la session
- [ ] Redirection vers login
- [ ] Protection contre l'accès non authentifié

---

## Résumé des tests

| ID | Fonctionnalité | Onglet | Statut |
|----|----------------|--------|--------|
| UAT-ADM-001 | Stats globales | Dashboard | À tester |
| UAT-ADM-002 | Liste défis | Défis | À tester |
| UAT-ADM-003 | Création défi | Défis | À tester |
| UAT-ADM-004 | Modification défi | Défis | À tester |
| UAT-ADM-005 | Suppression défi | Défis | À tester |
| UAT-ADM-006 | Liste unités | Unités | À tester |
| UAT-ADM-007 | Création unité | Unités | À tester |
| UAT-ADM-008 | Gestion sections | Unités | À tester |
| UAT-ADM-009 | Classement | Classement | À tester |
| UAT-ADM-010 | Liste partenaires | Partenaires | À tester |
| UAT-ADM-011 | Création partenaire | Partenaires | À tester |
| UAT-ADM-012 | Gestion offres | Partenaires | À tester |
| UAT-ADM-013 | Modif/Suppr offre | Partenaires | À tester |
| UAT-ADM-014 | Liste badges | Badges | À tester |
| UAT-ADM-015 | Création badge | Badges | À tester |
| UAT-ADM-016 | Modif/Suppr badge | Badges | À tester |
| UAT-ADM-017 | Navigation onglets | Transversal | À tester |
| UAT-ADM-018 | Déconnexion | Transversal | À tester |

---

## Notes techniques

### Fichiers principaux
- `app/(wecamp)/dashboard.tsx` - Dashboard admin principal
- `app/(wecamp)/create-challenge.tsx` - Création de défi
- `app/(wecamp)/edit-challenge.tsx` - Édition de défi
- `services/admin-stats-service.ts` - Service statistiques
- `services/partner-service.ts` - Service partenaires
- `services/badge-service.ts` - Service badges
- `services/unit-service.ts` - Service unités
- `services/section-service.ts` - Service sections

### Services utilisés
- **AdminStatsService** : Statistiques globales, stats défis, classement unités
- **ChallengeService** : CRUD défis
- **PartnerService** : CRUD partenaires et offres
- **BadgeService** : CRUD badges
- **UnitService** : CRUD unités
- **SectionService** : CRUD sections

### Collections Firestore
- `challenges` : Défis
- `units` : Unités
- `sections` : Sections
- `partners` : Partenaires
- `partner_offers` : Offres partenaires
- `badge_definitions` : Définitions de badges
- `user_badges` : Badges attribués aux utilisateurs

---

## Points d'attention

1. **Permissions** : Seuls les admins WeCamp ont accès à ce panneau
2. **Upload d'images** : Logos partenaires et unités uploadés vers Firebase Storage
3. **Codes uniques** : Les codes d'inscription unité/section sont générés automatiquement
4. **Cascading** : La suppression d'une unité devrait affecter ses sections et membres
5. **Validation** : Tous les formulaires doivent valider les champs obligatoires
