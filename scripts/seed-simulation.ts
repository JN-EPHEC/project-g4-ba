/**
 * Script de simulation de vie scout pour WeCamp
 * Génère des données réalistes : scouts, parents, animateurs, événements, messages, défis
 *
 * Usage:
 *   npx ts-node scripts/seed-simulation.ts          # Créer les données
 *   npx ts-node scripts/seed-simulation.ts --clean  # Nettoyer les données de démo
 *
 * Configuration:
 *   Option 1: Service Account (recommandé)
 *     - Téléchargez votre service account depuis Firebase Console
 *     - Définissez: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 *
 *   Option 2: Firebase CLI Token
 *     - Connectez-vous avec: firebase login
 *     - Le script utilisera automatiquement le token
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require('firebase-admin');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

// Chercher un fichier de service account
function findServiceAccount(): string | null {
  const possiblePaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(__dirname, 'serviceAccount.json'),
    path.join(__dirname, '../serviceAccount.json'),
    path.join(__dirname, 'firebase-service-account.json'),
    path.join(__dirname, '../firebase-service-account.json'),
  ].filter(Boolean);

  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

// Initialiser Firebase Admin
if (!admin.apps.length) {
  const serviceAccountPath = findServiceAccount();

  if (serviceAccountPath) {
    console.log(`📁 Utilisation du service account: ${serviceAccountPath}`);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      projectId: 'wecamp-642bc',
    });
  } else {
    console.log('⚠️  Pas de service account trouvé, utilisation des credentials par défaut...');
    console.log('   Pour configurer: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json');
    console.log('   Ou placez le fichier serviceAccount.json dans le dossier scripts/');
    console.log('');
    admin.initializeApp({
      projectId: 'wecamp-642bc',
    });
  }
}

const db = admin.firestore();

// ============================================================================
// CONSTANTES ET DONNÉES DE SIMULATION
// ============================================================================

const DEMO_PREFIX = 'demo-';
const DEMO_GROUP_ID = `${DEMO_PREFIX}group`;
const DEMO_UNIT_ID = `${DEMO_PREFIX}unit`;

// Scouts simulés
const SCOUTS_DATA = [
  { firstName: 'Lucas', lastName: 'Martin', totemAnimal: 'Loup', totemName: 'Loup Rusé', totemEmoji: '🐺', points: 280, dateOfBirth: '2012-03-15' },
  { firstName: 'Emma', lastName: 'Bernard', totemAnimal: 'Renard', totemName: 'Renard Malin', totemEmoji: '🦊', points: 450, dateOfBirth: '2011-07-22' },
  { firstName: 'Hugo', lastName: 'Dubois', totemAnimal: 'Aigle', totemName: 'Aigle Vif', totemEmoji: '🦅', points: 120, dateOfBirth: '2013-01-08' },
  { firstName: 'Léa', lastName: 'Thomas', totemAnimal: 'Hibou', totemName: 'Hibou Sage', totemEmoji: '🦉', points: 680, dateOfBirth: '2010-11-30' },
  { firstName: 'Louis', lastName: 'Robert', totemAnimal: 'Ours', totemName: 'Ours Courageux', totemEmoji: '🐻', points: 95, dateOfBirth: '2013-05-18' },
  { firstName: 'Chloé', lastName: 'Richard', totemAnimal: 'Loutre', totemName: 'Loutre Joyeuse', totemEmoji: '🦦', points: 320, dateOfBirth: '2012-09-03' },
  { firstName: 'Nathan', lastName: 'Petit', totemAnimal: 'Cerf', totemName: 'Cerf Noble', totemEmoji: '🦌', points: 510, dateOfBirth: '2011-04-25' },
  { firstName: 'Manon', lastName: 'Durand', totemAnimal: 'Faucon', totemName: 'Faucon Rapide', totemEmoji: '🦅', points: 175, dateOfBirth: '2012-12-10' },
  { firstName: 'Théo', lastName: 'Leroy', totemAnimal: 'Castor', totemName: 'Castor Bâtisseur', totemEmoji: '🦫', points: 390, dateOfBirth: '2011-08-14' },
  { firstName: 'Camille', lastName: 'Moreau', totemAnimal: 'Écureuil', totemName: 'Écureuil Agile', totemEmoji: '🐿️', points: 245, dateOfBirth: '2012-06-27' },
];

// Parents simulés (liés aux scouts)
const PARENTS_DATA = [
  { firstName: 'Sophie', lastName: 'Martin', phone: '+33 6 12 34 56 78', scoutIndices: [0] },
  { firstName: 'Pierre', lastName: 'Martin', phone: '+33 6 98 76 54 32', scoutIndices: [0] },
  { firstName: 'Marie', lastName: 'Bernard', phone: '+33 6 11 22 33 44', scoutIndices: [1] },
  { firstName: 'Jean', lastName: 'Dubois', phone: '+33 6 55 66 77 88', scoutIndices: [2] },
  { firstName: 'Claire', lastName: 'Dubois', phone: '+33 6 44 55 66 77', scoutIndices: [2] },
  { firstName: 'Anne', lastName: 'Thomas', phone: '+33 6 33 44 55 66', scoutIndices: [3] },
  { firstName: 'Michel', lastName: 'Robert', phone: '+33 6 22 33 44 55', scoutIndices: [4, 5] }, // 2 enfants
  { firstName: 'Isabelle', lastName: 'Richard', phone: '+33 6 77 88 99 00', scoutIndices: [5] },
];

// Animateurs simulés
const ANIMATORS_DATA = [
  { firstName: 'Alexandre', lastName: 'Dupont', totemAnimal: 'Lion', totemName: 'Lion Brave', totemEmoji: '🦁', isUnitLeader: true, specialties: ['Premiers secours', 'Orientation'] },
  { firstName: 'Julie', lastName: 'Lemaire', totemAnimal: 'Panthère', totemName: 'Panthère Agile', totemEmoji: '🐆', isUnitLeader: false, specialties: ['Cuisine', 'Nature'] },
  { firstName: 'Thomas', lastName: 'Garcia', totemAnimal: 'Tigre', totemName: 'Tigre Fort', totemEmoji: '🐯', isUnitLeader: false, specialties: ['Bivouac', 'Nœuds'] },
];

// Événements simulés
const EVENTS_DATA = [
  {
    title: 'Camp d\'hiver aux Vosges',
    description: 'Un super camp de 3 jours dans les Vosges ! Au programme : randonnée, construction d\'igloos, veillée autour du feu. Pensez aux vêtements chauds !',
    type: 'camp',
    location: 'Refuge du Tanet, Vosges',
    startDate: daysFromNow(14),
    endDate: daysFromNow(17),
    requiresParentConfirmation: true,
    maxParticipants: 20,
  },
  {
    title: 'Réunion du samedi',
    description: 'Réunion hebdomadaire de la troupe. Activités : progression personnelle, jeux, préparation du prochain camp.',
    type: 'meeting',
    location: 'Local scout, 15 rue des Acacias',
    startDate: daysFromNow(2),
    endDate: daysFromNow(2, 3), // +3 heures
    requiresParentConfirmation: false,
  },
  {
    title: 'Grand Jeu "La Quête du Graal"',
    description: 'Grand jeu d\'aventure ! Par équipes, partez à la recherche du Graal légendaire à travers la forêt. Énigmes, épreuves et surprises garanties !',
    type: 'activity',
    location: 'Forêt de Fontainebleau',
    startDate: daysFromNow(9),
    endDate: daysFromNow(9, 6),
    requiresParentConfirmation: true,
  },
  {
    title: 'Formation Premiers Secours',
    description: 'Formation PSC1 pour les scouts de plus de 12 ans. Apprenez les gestes qui sauvent ! Attestation délivrée à la fin.',
    type: 'training',
    location: 'Salle communale Jean Moulin',
    startDate: daysFromNow(21),
    endDate: daysFromNow(21, 8),
    requiresParentConfirmation: true,
    maxParticipants: 15,
  },
  {
    title: 'Sortie Kayak',
    description: 'Descente en kayak sur la Marne ! Niveau débutant accepté. Prévoir maillot de bain et vêtements de rechange.',
    type: 'activity',
    location: 'Base nautique de Lagny-sur-Marne',
    startDate: daysFromNow(30),
    endDate: daysFromNow(30, 5),
    requiresParentConfirmation: true,
    maxParticipants: 12,
  },
  {
    title: 'Veillée Astronomie',
    description: 'Observation des étoiles avec un télescope ! Un passionné d\'astronomie nous guidera à travers les constellations.',
    type: 'activity',
    location: 'Terrain de camping, Les Molières',
    startDate: daysFromNow(16),
    endDate: daysFromNow(16, 4),
    requiresParentConfirmation: false,
  },
  {
    title: 'Week-end Pionnier',
    description: 'Week-end dédié aux constructions ! Tables, bancs, ponts de singe... Venez avec votre créativité et votre énergie !',
    type: 'camp',
    location: 'Camp scout du Plessis',
    startDate: daysFromNow(45),
    endDate: daysFromNow(47),
    requiresParentConfirmation: true,
  },
];

// Messages simulés pour les canaux
const MESSAGES_DATA = {
  announcements: [
    { content: '📢 Rappel : le camp d\'hiver approche ! N\'oubliez pas de rendre les fiches d\'inscription avant vendredi.', daysAgo: 5 },
    { content: '🎉 Bravo à Emma et Nathan qui ont validé leur badge Secourisme ce week-end !', daysAgo: 3 },
    { content: '📸 Les photos du dernier grand jeu sont disponibles sur le Drive. Le lien a été envoyé par email.', daysAgo: 7 },
    { content: '⚠️ Changement d\'horaire pour samedi : rendez-vous à 14h au lieu de 14h30.', daysAgo: 1 },
    { content: '🏕️ Liste du matériel pour le camp d\'hiver mise à jour ! Consultez la section Documents.', daysAgo: 2 },
  ],
  general: [
    { content: 'Salut tout le monde ! Qui a encore des bouts de corde pour les nœuds samedi ?', authorType: 'scout', authorIndex: 0, daysAgo: 2 },
    { content: 'Moi j\'en ai ! Je les apporte 👍', authorType: 'scout', authorIndex: 1, daysAgo: 2 },
    { content: 'Super journée hier ! Le grand jeu était trop bien 🎮', authorType: 'scout', authorIndex: 3, daysAgo: 1 },
    { content: 'Trop d\'accord ! On refait quand ?', authorType: 'scout', authorIndex: 5, daysAgo: 1 },
    { content: 'Qui vient au camp d\'hiver ? On sera combien ?', authorType: 'scout', authorIndex: 2, daysAgo: 3 },
    { content: 'Moi je viens ! 🏔️', authorType: 'scout', authorIndex: 4, daysAgo: 3 },
    { content: 'Pareil ! Trop hâte !', authorType: 'scout', authorIndex: 6, daysAgo: 3 },
    { content: 'On sera une quinzaine normalement 😊', authorType: 'animator', authorIndex: 0, daysAgo: 3 },
    { content: 'Question : est-ce qu\'il faut des raquettes pour le camp ?', authorType: 'scout', authorIndex: 7, daysAgo: 4 },
    { content: 'Non pas besoin, on restera sur les sentiers damés !', authorType: 'animator', authorIndex: 1, daysAgo: 4 },
  ],
  parents: [
    { content: 'Bonjour, est-il possible d\'avoir plus de détails sur le camp d\'hiver ?', authorIndex: 0, daysAgo: 6 },
    { content: 'Bien sûr ! Je vous envoie le dossier complet par email ce soir.', authorType: 'animator', authorIndex: 0, daysAgo: 6 },
    { content: 'Merci beaucoup ! Et pour le covoiturage, comment ça s\'organise ?', authorIndex: 2, daysAgo: 5 },
    { content: 'On fait un tableau partagé, je vous l\'envoie dès qu\'on aura toutes les inscriptions.', authorType: 'animator', authorIndex: 0, daysAgo: 5 },
    { content: 'Proposition de covoiturage : je peux prendre 3 enfants depuis Paris 15e, aller-retour.', authorIndex: 4, daysAgo: 4 },
    { content: 'Parfait ! Je note ça dans le tableau. Merci !', authorType: 'animator', authorIndex: 1, daysAgo: 4 },
    { content: 'Mon fils a oublié sa gourde samedi dernier, quelqu\'un l\'a vue ?', authorIndex: 1, daysAgo: 2 },
    { content: 'Je l\'ai récupérée, elle est au local. On vous la rend samedi !', authorType: 'animator', authorIndex: 2, daysAgo: 2 },
  ],
};

// Défis simulés
const CHALLENGES_DATA = [
  {
    title: 'Premier Feu de Camp',
    description: 'Allume un feu de camp en utilisant uniquement des allumettes et du bois trouvé dans la nature. Prends une photo de ton feu !',
    points: 20,
    difficulty: 'easy',
    category: 'nature',
    emoji: '🔥',
  },
  {
    title: 'Nœuds Experts',
    description: 'Maîtrise 5 nœuds différents : nœud de chaise, nœud de cabestan, nœud de huit, nœud plat et nœud de pêcheur. Démontre-les à un animateur.',
    points: 40,
    difficulty: 'medium',
    category: 'technique',
    emoji: '🪢',
  },
  {
    title: 'Orientation Nocturne',
    description: 'Participe à une randonnée nocturne et utilise une carte et une boussole pour t\'orienter. Bonus si tu repères la Grande Ourse !',
    points: 80,
    difficulty: 'hard',
    category: 'nature',
    emoji: '🌙',
  },
  {
    title: 'Cuisine Nature',
    description: 'Prépare un repas complet pour ta patrouille en utilisant uniquement un feu de camp. Le menu doit inclure une entrée, un plat et un dessert.',
    points: 50,
    difficulty: 'medium',
    category: 'cuisine',
    emoji: '🍳',
  },
  {
    title: 'Construction d\'Abri',
    description: 'Construis un abri naturel qui peut protéger 2 personnes de la pluie. L\'abri doit tenir debout pendant au moins 1 heure.',
    points: 100,
    difficulty: 'hard',
    category: 'technique',
    emoji: '🏕️',
  },
  {
    title: 'Badge Secouriste',
    description: 'Apprends les gestes de premiers secours : position latérale de sécurité, massage cardiaque, et utilisation d\'un défibrillateur.',
    points: 60,
    difficulty: 'medium',
    category: 'technique',
    emoji: '🩹',
  },
];

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function daysFromNow(days: number, additionalHours: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9 + additionalHours, 0, 0, 0);
  return date;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
  return date;
}

function generateId(prefix: string, index: number): string {
  return `${DEMO_PREFIX}${prefix}-${String(index).padStart(3, '0')}`;
}

// ============================================================================
// FONCTIONS DE CRÉATION
// ============================================================================

async function createGroup() {
  console.log('\n📋 Création du groupe scout de démo...');

  const groupData = {
    name: 'Groupe Scout Démo WeCamp',
    address: '123 Rue de la Nature',
    city: 'Paris',
    postalCode: '75001',
    email: 'demo@wecamp.scout',
    phone: '+33 1 23 45 67 89',
    website: 'https://wecamp.demo',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection('scoutGroups').doc(DEMO_GROUP_ID).set(groupData);
  console.log(`   ✅ Groupe créé: ${groupData.name}`);

  return DEMO_GROUP_ID;
}

async function createUnit(leaderId: string) {
  console.log('\n🏕️ Création de l\'unité de démo...');

  const unitData = {
    name: 'Troupe Démo - Les Explorateurs',
    category: 'scouts',
    description: 'Unité de démonstration pour WeCamp. Bienvenue dans l\'aventure !',
    groupId: DEMO_GROUP_ID,
    leaderId: leaderId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection('units').doc(DEMO_UNIT_ID).set(unitData);
  console.log(`   ✅ Unité créée: ${unitData.name}`);

  // Créer les canaux par défaut
  await createDefaultChannels();

  return DEMO_UNIT_ID;
}

async function createDefaultChannels() {
  console.log('\n💬 Création des canaux par défaut...');

  const channels = [
    {
      id: `${DEMO_PREFIX}channel-announcements`,
      name: 'Annonces',
      type: 'announcements',
      icon: '📢',
      isDefault: true,
      permissions: {
        canRead: ['scout', 'parent', 'animator'],
        canWrite: ['animator'],
      },
    },
    {
      id: `${DEMO_PREFIX}channel-general`,
      name: 'Général',
      type: 'general',
      icon: '💬',
      isDefault: true,
      permissions: {
        canRead: ['scout', 'parent', 'animator'],
        canWrite: ['scout', 'parent', 'animator'],
      },
    },
    {
      id: `${DEMO_PREFIX}channel-parents`,
      name: 'Parents',
      type: 'parents',
      icon: '👨‍👩‍👧',
      isDefault: true,
      permissions: {
        canRead: ['parent', 'animator'],
        canWrite: ['parent', 'animator'],
      },
    },
  ];

  for (const channel of channels) {
    const channelData = {
      ...channel,
      unitId: DEMO_UNIT_ID,
      createdBy: `${DEMO_PREFIX}animator-000`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection('channels').doc(channel.id).set(channelData);
    console.log(`   ✅ Canal créé: ${channel.name}`);
  }
}

async function createAnimators(): Promise<string[]> {
  console.log('\n👨‍🏫 Création des animateurs...');

  const animatorIds: string[] = [];

  for (let i = 0; i < ANIMATORS_DATA.length; i++) {
    const animator = ANIMATORS_DATA[i];
    const id = generateId('animator', i);

    const animatorData = {
      email: `${animator.firstName.toLowerCase()}.${animator.lastName.toLowerCase()}@demo.wecamp`,
      firstName: animator.firstName,
      lastName: animator.lastName,
      role: 'animator',
      unitId: DEMO_UNIT_ID,
      isUnitLeader: animator.isUnitLeader,
      specialties: animator.specialties,
      totemAnimal: animator.totemAnimal,
      totemName: animator.totemName,
      totemEmoji: animator.totemEmoji,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('users').doc(id).set(animatorData);
    animatorIds.push(id);
    console.log(`   ✅ Animateur: ${animator.firstName} ${animator.lastName} (${animator.totemName})`);
  }

  return animatorIds;
}

async function createScouts(): Promise<string[]> {
  console.log('\n🧒 Création des scouts...');

  const scoutIds: string[] = [];

  for (let i = 0; i < SCOUTS_DATA.length; i++) {
    const scout = SCOUTS_DATA[i];
    const id = generateId('scout', i);

    const scoutData = {
      email: `${scout.firstName.toLowerCase()}.${scout.lastName.toLowerCase()}@demo.wecamp`,
      firstName: scout.firstName,
      lastName: scout.lastName,
      role: 'scout',
      unitId: DEMO_UNIT_ID,
      parentIds: [], // Sera mis à jour après création des parents
      points: scout.points,
      dateOfBirth: admin.firestore.Timestamp.fromDate(new Date(scout.dateOfBirth)),
      totemAnimal: scout.totemAnimal,
      totemName: scout.totemName,
      totemEmoji: scout.totemEmoji,
      validated: true,
      validatedAt: admin.firestore.FieldValue.serverTimestamp(),
      validatedBy: `${DEMO_PREFIX}animator-000`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('users').doc(id).set(scoutData);
    scoutIds.push(id);
    console.log(`   ✅ Scout: ${scout.firstName} ${scout.lastName} (${scout.totemName}) - ${scout.points} pts`);
  }

  return scoutIds;
}

async function createParents(scoutIds: string[]): Promise<string[]> {
  console.log('\n👨‍👩‍👧 Création des parents...');

  const parentIds: string[] = [];

  for (let i = 0; i < PARENTS_DATA.length; i++) {
    const parent = PARENTS_DATA[i];
    const id = generateId('parent', i);

    const linkedScoutIds = parent.scoutIndices.map((idx) => scoutIds[idx]);

    const parentData = {
      email: `${parent.firstName.toLowerCase()}.${parent.lastName.toLowerCase()}@demo.wecamp`,
      firstName: parent.firstName,
      lastName: parent.lastName,
      role: 'parent',
      phone: parent.phone,
      scoutIds: linkedScoutIds,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('users').doc(id).set(parentData);
    parentIds.push(id);
    console.log(`   ✅ Parent: ${parent.firstName} ${parent.lastName} (${linkedScoutIds.length} enfant(s))`);
  }

  // Mettre à jour les parentIds des scouts
  console.log('\n   🔗 Liaison parents-scouts...');
  for (let i = 0; i < SCOUTS_DATA.length; i++) {
    const scoutId = scoutIds[i];
    const scoutParentIds = PARENTS_DATA
      .map((p, idx) => ({ ...p, id: parentIds[idx] }))
      .filter((p) => p.scoutIndices.includes(i))
      .map((p) => p.id);

    if (scoutParentIds.length > 0) {
      await db.collection('users').doc(scoutId).update({ parentIds: scoutParentIds });
    }
  }

  return parentIds;
}

async function createEvents(animatorIds: string[]) {
  console.log('\n📅 Création des événements...');

  for (let i = 0; i < EVENTS_DATA.length; i++) {
    const event = EVENTS_DATA[i];
    const id = generateId('event', i);

    const eventData = {
      title: event.title,
      description: event.description,
      type: event.type,
      location: event.location,
      unitId: DEMO_UNIT_ID,
      startDate: admin.firestore.Timestamp.fromDate(event.startDate),
      endDate: admin.firestore.Timestamp.fromDate(event.endDate),
      createdBy: animatorIds[i % animatorIds.length],
      requiresParentConfirmation: event.requiresParentConfirmation,
      maxParticipants: event.maxParticipants || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('events').doc(id).set(eventData);
    console.log(`   ✅ Événement: ${event.title}`);
  }
}

async function createMessages(animatorIds: string[], scoutIds: string[], parentIds: string[]) {
  console.log('\n💬 Création des messages...');

  // Messages du canal Annonces
  console.log('   📢 Canal Annonces:');
  for (let i = 0; i < MESSAGES_DATA.announcements.length; i++) {
    const msg = MESSAGES_DATA.announcements[i];
    const id = generateId('msg-ann', i);

    const messageData = {
      channelId: `${DEMO_PREFIX}channel-announcements`,
      authorId: animatorIds[i % animatorIds.length],
      content: msg.content,
      isPinned: i === 0,
      createdAt: admin.firestore.Timestamp.fromDate(daysAgo(msg.daysAgo)),
    };

    await db.collection('channelMessages').doc(id).set(messageData);
    console.log(`      ✅ Message créé`);
  }

  // Messages du canal Général
  console.log('   💬 Canal Général:');
  for (let i = 0; i < MESSAGES_DATA.general.length; i++) {
    const msg = MESSAGES_DATA.general[i] as any;
    const id = generateId('msg-gen', i);

    let authorId: string;
    if (msg.authorType === 'scout') {
      authorId = scoutIds[msg.authorIndex];
    } else {
      authorId = animatorIds[msg.authorIndex];
    }

    const messageData = {
      channelId: `${DEMO_PREFIX}channel-general`,
      authorId,
      content: msg.content,
      isPinned: false,
      createdAt: admin.firestore.Timestamp.fromDate(daysAgo(msg.daysAgo)),
    };

    await db.collection('channelMessages').doc(id).set(messageData);
    console.log(`      ✅ Message créé`);
  }

  // Messages du canal Parents
  console.log('   👨‍👩‍👧 Canal Parents:');
  for (let i = 0; i < MESSAGES_DATA.parents.length; i++) {
    const msg = MESSAGES_DATA.parents[i] as any;
    const id = generateId('msg-par', i);

    let authorId: string;
    if (msg.authorType === 'animator') {
      authorId = animatorIds[msg.authorIndex];
    } else {
      authorId = parentIds[msg.authorIndex];
    }

    const messageData = {
      channelId: `${DEMO_PREFIX}channel-parents`,
      authorId,
      content: msg.content,
      isPinned: false,
      createdAt: admin.firestore.Timestamp.fromDate(daysAgo(msg.daysAgo)),
    };

    await db.collection('channelMessages').doc(id).set(messageData);
    console.log(`      ✅ Message créé`);
  }
}

async function createChallenges(animatorIds: string[]) {
  console.log('\n🎯 Création des défis...');

  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 3);

  for (let i = 0; i < CHALLENGES_DATA.length; i++) {
    const challenge = CHALLENGES_DATA[i];
    const id = generateId('challenge', i);

    const challengeData = {
      title: challenge.title,
      description: challenge.description,
      points: challenge.points,
      difficulty: challenge.difficulty,
      category: challenge.category,
      emoji: challenge.emoji,
      unitId: DEMO_UNIT_ID,
      startDate: admin.firestore.Timestamp.fromDate(now),
      endDate: admin.firestore.Timestamp.fromDate(endDate),
      createdBy: animatorIds[i % animatorIds.length],
      isGlobal: false,
      allowMultipleValidations: false,
      notifyMembers: true,
      participantsCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('challenges').doc(id).set(challengeData);
    console.log(`   ✅ Défi: ${challenge.title} (${challenge.difficulty}, ${challenge.points} pts)`);
  }
}

// ============================================================================
// FONCTION DE NETTOYAGE
// ============================================================================

async function cleanupDemo() {
  console.log('\n🧹 Nettoyage des données de démonstration...\n');

  const collections = [
    'users',
    'scoutGroups',
    'units',
    'channels',
    'channelMessages',
    'events',
    'eventAttendances',
    'challenges',
    'challengeSubmissions',
    'healthRecords',
    'documents',
    'documentSignatures',
  ];

  for (const collectionName of collections) {
    console.log(`   Nettoyage de ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();

    let deletedCount = 0;
    const batch = db.batch();

    for (const docSnap of snapshot.docs) {
      if (docSnap.id.startsWith(DEMO_PREFIX)) {
        batch.delete(docSnap.ref);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      await batch.commit();
      console.log(`      ✅ ${deletedCount} document(s) supprimé(s)`);
    }
  }

  console.log('\n✨ Nettoyage terminé !');
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

async function seedSimulation() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   🏕️  WECAMP - Simulation de vie scout');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // 1. Créer les animateurs d'abord (nécessaire pour le leader de l'unité)
    const animatorIds = await createAnimators();

    // 2. Créer le groupe et l'unité
    await createGroup();
    await createUnit(animatorIds[0]);

    // 3. Créer les scouts
    const scoutIds = await createScouts();

    // 4. Créer les parents et les lier aux scouts
    const parentIds = await createParents(scoutIds);

    // 5. Créer les événements
    await createEvents(animatorIds);

    // 6. Créer les messages dans les canaux
    await createMessages(animatorIds, scoutIds, parentIds);

    // 7. Créer les défis
    await createChallenges(animatorIds);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('   ✅ Simulation créée avec succès !');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n📊 Résumé:');
    console.log(`   • ${animatorIds.length} animateurs`);
    console.log(`   • ${scoutIds.length} scouts`);
    console.log(`   • ${parentIds.length} parents`);
    console.log(`   • ${EVENTS_DATA.length} événements`);
    console.log(`   • ${MESSAGES_DATA.announcements.length + MESSAGES_DATA.general.length + MESSAGES_DATA.parents.length} messages`);
    console.log(`   • ${CHALLENGES_DATA.length} défis`);
    console.log('\n📱 Rechargez l\'application pour voir les données !');
    console.log('\n🧹 Pour supprimer: npx ts-node scripts/seed-simulation.ts --clean');

  } catch (error) {
    console.error('\n❌ Erreur lors de la création:', error);
    throw error;
  }
}

// ============================================================================
// EXÉCUTION
// ============================================================================

const args = process.argv.slice(2);

if (args.includes('--clean')) {
  cleanupDemo()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else {
  seedSimulation()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
