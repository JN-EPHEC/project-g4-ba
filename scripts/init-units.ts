/**
 * Script pour initialiser les unités dans Firebase
 * Usage: npx ts-node scripts/init-units.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';

// Configuration Firebase (à adapter selon votre config)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Définir les unités par fédération
// Basé sur le questionnaire MyTribe
const units = [
  {
    id: 'les-scouts',
    name: 'Les Scouts',
    category: 'scouts',
    description: 'Fédération Les Scouts',
    groupId: 'default-group',
    leaderId: 'temp-leader',
  },
  {
    id: 'les-guides',
    name: 'Les Guides',
    category: 'guides',
    description: 'Fédération Les Guides',
    groupId: 'default-group',
    leaderId: 'temp-leader',
  },
  {
    id: 'le-patro',
    name: 'Le Patro',
    category: 'patro',
    description: 'Fédération Le Patro',
    groupId: 'default-group',
    leaderId: 'temp-leader',
  },
  {
    id: 'sgp',
    name: 'Les Scouts et Guides Pluralistes',
    category: 'sgp',
    description: 'Fédération Les Scouts et Guides Pluralistes',
    groupId: 'default-group',
    leaderId: 'temp-leader',
  },
  {
    id: 'faucons-rouges',
    name: 'Faucons Rouges',
    category: 'faucons',
    description: 'Fédération Faucons Rouges',
    groupId: 'default-group',
    leaderId: 'temp-leader',
  },
];

async function initializeUnits() {
  console.log('🚀 Initialisation des unités...\n');

  try {
    // Créer d'abord le groupe par défaut
    const groupData = {
      name: 'Groupe WeCamp',
      address: '123 Rue des Scouts',
      city: 'Bruxelles',
      postalCode: '1000',
      email: 'contact@wecamp.be',
      phone: '+32 123 456 789',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const groupRef = doc(db, 'scoutGroups', 'default-group');
    await setDoc(groupRef, groupData);
    console.log('✅ Groupe par défaut créé\n');

    // Créer les unités
    for (const unit of units) {
      const unitData = {
        name: unit.name,
        category: unit.category,
        description: unit.description,
        groupId: unit.groupId,
        leaderId: unit.leaderId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const unitRef = doc(db, 'units', unit.id);
      await setDoc(unitRef, unitData);
      console.log(`✅ Unité créée: ${unit.name} (${unit.category})`);
    }

    console.log('\n✨ Toutes les unités ont été créées avec succès !');
    console.log('\n📝 Prochaine étape:');
    console.log('   1. Créez des comptes animateurs');
    console.log('   2. Assignez chaque animateur à son unité en mettant à jour le "leaderId"');
    console.log('   3. Les scouts pourront maintenant choisir leur unité lors de l\'inscription\n');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  }

  process.exit(0);
}

// Exécuter le script
initializeUnits();
