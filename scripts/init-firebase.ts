/**
 * Script d'initialisation Firebase
 * Crée des données de test pour démarrer rapidement avec l'application
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, Timestamp } from 'firebase/firestore';

// Configuration Firebase (utilisez vos vraies clés)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCWF7J1BGwbSUEtVGd-VwVgBPvQ1VqVmJw",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "wecamp-642bc.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "wecamp-642bc",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "wecamp-642bc.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1061361878999",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1061361878999:web:76d65dd2e8ccd3764e2f50",
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('🔥 Firebase initialisé');
console.log('📋 Project ID:', firebaseConfig.projectId);

// Utilisateurs de test à créer
const testUsers = [
  {
    email: 'scout@test.com',
    password: 'test123',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'scout',
    points: 150,
  },
  {
    email: 'animator@test.com',
    password: 'test123',
    firstName: 'Marie',
    lastName: 'Martin',
    role: 'animator',
    points: 0,
  },
  {
    email: 'parent@test.com',
    password: 'test123',
    firstName: 'Pierre',
    lastName: 'Durand',
    role: 'parent',
    points: 0,
  },
];

// Défis de test
const testChallenges = [
  {
    title: 'Premier Campement',
    description: 'Participe à ton premier camp de week-end et découvre la vie en plein air avec ton unité.',
    points: 50,
    difficulty: 'easy',
    unitId: null,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    createdBy: 'system',
  },
  {
    title: 'Nœuds de Base',
    description: 'Apprends et maîtrise 5 nœuds essentiels : nœud de huit, nœud de cabestan, nœud de chaise, nœud de pêcheur et nœud plat.',
    points: 30,
    difficulty: 'easy',
    unitId: null,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    createdBy: 'system',
  },
  {
    title: 'Construction de Bivouac',
    description: 'Construis un abri de fortune avec des matériaux naturels. L\'abri doit être suffisamment grand pour 2 personnes et résistant à la pluie.',
    points: 100,
    difficulty: 'medium',
    unitId: null,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    createdBy: 'system',
  },
  {
    title: 'Orientation Nocturne',
    description: 'Réalise un parcours d\'orientation de nuit en utilisant uniquement une carte et une boussole. Temps maximum : 2 heures.',
    points: 150,
    difficulty: 'hard',
    unitId: null,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    createdBy: 'system',
  },
  {
    title: 'Cuisine en Plein Air',
    description: 'Prépare un repas complet pour ton équipe en utilisant uniquement un feu de camp. Le repas doit inclure entrée, plat et dessert.',
    points: 80,
    difficulty: 'medium',
    unitId: null,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    createdBy: 'system',
  },
  {
    title: 'Secourisme d\'Urgence',
    description: 'Obtiens ton brevet de premiers secours et démontre ta capacité à gérer 3 situations d\'urgence différentes.',
    points: 120,
    difficulty: 'hard',
    unitId: null,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    createdBy: 'system',
  },
];

// Événements de test
const testEvents = [
  {
    title: 'Camp d\'Hiver',
    description: 'Week-end de camp dans les Ardennes avec activités de neige et construction d\'igloos.',
    startDate: new Date('2025-02-15'),
    endDate: new Date('2025-02-17'),
    location: 'Ardennes, Belgique',
    locationCoordinates: { latitude: 50.4108, longitude: 5.8173 },
    maxParticipants: 30,
    unitId: null,
    createdBy: 'system',
  },
  {
    title: 'Journée Nature',
    description: 'Journée de découverte de la faune et de la flore locale avec un guide naturaliste.',
    startDate: new Date('2025-03-22'),
    endDate: new Date('2025-03-22'),
    location: 'Forêt de Soignes, Bruxelles',
    locationCoordinates: { latitude: 50.7772, longitude: 4.4239 },
    maxParticipants: 20,
    unitId: null,
    createdBy: 'system',
  },
  {
    title: 'Grand Jeu Scout',
    description: 'Grand jeu inter-unités avec épreuves sportives, énigmes et défis d\'équipe.',
    startDate: new Date('2025-04-05'),
    endDate: new Date('2025-04-05'),
    location: 'Parc de Woluwe, Bruxelles',
    locationCoordinates: { latitude: 50.8467, longitude: 4.4269 },
    maxParticipants: 50,
    unitId: null,
    createdBy: 'system',
  },
];

async function createUser(userData: typeof testUsers[0]) {
  try {
    console.log(`\n👤 Création de l'utilisateur: ${userData.email}`);

    // Créer l'utilisateur dans Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );

    const uid = userCredential.user.uid;
    console.log(`✅ Auth créé avec UID: ${uid}`);

    // Créer le document Firestore correspondant
    await setDoc(doc(db, 'users', uid), {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      points: userData.points,
      unitId: null,
      profilePicture: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log(`✅ Document Firestore créé pour ${userData.email}`);
    return uid;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️  Utilisateur ${userData.email} existe déjà`);
    } else {
      console.error(`❌ Erreur lors de la création de ${userData.email}:`, error.message);
    }
    return null;
  }
}

async function createChallenge(challengeData: typeof testChallenges[0]) {
  try {
    const docRef = doc(collection(db, 'challenges'));
    await setDoc(docRef, {
      ...challengeData,
      startDate: Timestamp.fromDate(challengeData.startDate),
      endDate: Timestamp.fromDate(challengeData.endDate),
      createdAt: Timestamp.now(),
    });
    console.log(`✅ Défi créé: ${challengeData.title}`);
  } catch (error: any) {
    console.error(`❌ Erreur lors de la création du défi ${challengeData.title}:`, error.message);
  }
}

async function createEvent(eventData: typeof testEvents[0]) {
  try {
    const docRef = doc(collection(db, 'events'));
    await setDoc(docRef, {
      ...eventData,
      startDate: Timestamp.fromDate(eventData.startDate),
      endDate: Timestamp.fromDate(eventData.endDate),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`✅ Événement créé: ${eventData.title}`);
  } catch (error: any) {
    console.error(`❌ Erreur lors de la création de l'événement ${eventData.title}:`, error.message);
  }
}

async function initializeFirebase() {
  console.log('\n🚀 Début de l\'initialisation de Firebase...\n');
  console.log('=' .repeat(60));

  // 1. Créer les utilisateurs de test
  console.log('\n📝 ÉTAPE 1/3: Création des utilisateurs de test');
  console.log('=' .repeat(60));
  for (const user of testUsers) {
    await createUser(user);
  }

  // 2. Se connecter en tant qu'animator pour créer les défis et événements
  console.log('\n\n🔐 Connexion en tant qu\'animator pour créer les contenus...');
  try {
    await signInWithEmailAndPassword(auth, 'animator@test.com', 'test123');
    console.log('✅ Connecté en tant qu\'animator');
  } catch (error: any) {
    console.error('❌ Erreur de connexion:', error.message);
    console.log('⚠️  Impossible de créer les défis et événements sans être connecté en tant qu\'animator');
    return;
  }

  // 3. Créer les défis
  console.log('\n🎯 ÉTAPE 2/3: Création des défis');
  console.log('=' .repeat(60));
  for (const challenge of testChallenges) {
    await createChallenge(challenge);
  }

  // 4. Créer les événements
  console.log('\n📅 ÉTAPE 3/3: Création des événements');
  console.log('=' .repeat(60));
  for (const event of testEvents) {
    await createEvent(event);
  }

  console.log('\n\n' + '=' .repeat(60));
  console.log('🎉 Initialisation terminée!');
  console.log('=' .repeat(60));
  console.log('\n📋 Résumé:');
  console.log(`   - ${testUsers.length} utilisateurs de test créés`);
  console.log(`   - ${testChallenges.length} défis créés`);
  console.log(`   - ${testEvents.length} événements créés`);
  console.log('\n🔐 Comptes de test:');
  testUsers.forEach(user => {
    console.log(`   - ${user.email} / ${user.password} (${user.role})`);
  });
  console.log('\n🌐 Vous pouvez maintenant vous connecter sur: http://localhost:8084');
  console.log('\n');
}

// Exécuter le script
initializeFirebase()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
