/**
 * Script pour créer des défis de test dans Firestore
 *
 * Usage: npx ts-node scripts/seed-challenges.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Configuration Firebase (copiez depuis votre config/firebase.ts)
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "wecamp-642bc",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Défis de test
const sampleChallenges = [
  {
    title: "Premier Campement",
    description: "Participe à ton premier camp de week-end et découvre la vie en plein air",
    points: 50,
    difficulty: "easy",
    unitId: null, // null = disponible pour tous
    startDate: Timestamp.fromDate(new Date('2024-01-01')),
    endDate: Timestamp.fromDate(new Date('2025-12-31')),
    createdBy: "system",
    createdAt: Timestamp.now(),
  },
  {
    title: "Maître des Nœuds",
    description: "Apprends et maîtrise 10 nœuds scouts essentiels",
    points: 30,
    difficulty: "medium",
    unitId: null,
    startDate: Timestamp.fromDate(new Date('2024-01-01')),
    endDate: Timestamp.fromDate(new Date('2025-12-31')),
    createdBy: "system",
    createdAt: Timestamp.now(),
  },
  {
    title: "Badge Secourisme",
    description: "Obtiens ton badge de premiers secours en participant à la formation",
    points: 75,
    difficulty: "hard",
    unitId: null,
    startDate: Timestamp.fromDate(new Date('2024-01-01')),
    endDate: Timestamp.fromDate(new Date('2025-12-31')),
    createdBy: "system",
    createdAt: Timestamp.now(),
  },
  {
    title: "Cuisinier en Herbe",
    description: "Prépare un repas complet pour ta patrouille en pleine nature",
    points: 40,
    difficulty: "medium",
    unitId: null,
    startDate: Timestamp.fromDate(new Date('2024-01-01')),
    endDate: Timestamp.fromDate(new Date('2025-12-31')),
    createdBy: "system",
    createdAt: Timestamp.now(),
  },
  {
    title: "Randonneur Étoile",
    description: "Complète une randonnée de 10km avec ta patrouille",
    points: 60,
    difficulty: "medium",
    unitId: null,
    startDate: Timestamp.fromDate(new Date('2024-01-01')),
    endDate: Timestamp.fromDate(new Date('2025-12-31')),
    createdBy: "system",
    createdAt: Timestamp.now(),
  },
  {
    title: "Recyclage Créatif",
    description: "Crée un objet utile à partir de matériaux recyclés",
    points: 25,
    difficulty: "easy",
    unitId: null,
    startDate: Timestamp.fromDate(new Date('2024-01-01')),
    endDate: Timestamp.fromDate(new Date('2025-12-31')),
    createdBy: "system",
    createdAt: Timestamp.now(),
  },
];

async function seedChallenges() {
  console.log('🌱 Création des défis de test...\n');

  try {
    for (const challenge of sampleChallenges) {
      const docRef = await addDoc(collection(db, 'challenges'), challenge);
      console.log(`✅ Défi créé: ${challenge.title} (ID: ${docRef.id})`);
    }

    console.log('\n🎉 Tous les défis ont été créés avec succès!');
    console.log('📱 Rechargez votre application pour les voir apparaître');

  } catch (error) {
    console.error('❌ Erreur lors de la création des défis:', error);
  }
}

// Exécuter le script
seedChallenges().then(() => {
  console.log('\n✨ Script terminé');
  process.exit(0);
});
