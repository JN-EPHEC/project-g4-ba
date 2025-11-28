/**
 * Script de vérification Firebase
 * Vérifie que tous les utilisateurs Auth ont un document Firestore correspondant
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Configuration Firebase
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
console.log('\n' + '='.repeat(80));

async function verifyFirebaseSetup() {
  try {
    // S'authentifier d'abord pour avoir accès aux données
    console.log('\n🔐 Authentification en tant qu\'animator...');
    await signInWithEmailAndPassword(auth, 'animator@test.com', 'test123');
    console.log('✅ Authentifié avec succès\n');

    console.log('\n📝 Vérification de la configuration Firebase...\n');

    // 1. Vérifier les utilisateurs dans Firestore
    console.log('1️⃣  Vérification de la collection "users"');
    console.log('-'.repeat(80));
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`✅ ${usersSnapshot.size} utilisateur(s) trouvé(s) dans Firestore\n`);

    if (usersSnapshot.size > 0) {
      console.log('📋 Liste des utilisateurs:');
      usersSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n   ${index + 1}. ${data.firstName} ${data.lastName}`);
        console.log(`      - Email: ${data.email}`);
        console.log(`      - Rôle: ${data.role}`);
        console.log(`      - Points: ${data.points || 0}`);
        console.log(`      - UID: ${doc.id}`);
      });
    } else {
      console.log('⚠️  Aucun utilisateur trouvé dans Firestore!');
    }

    // 2. Vérifier les défis
    console.log('\n\n2️⃣  Vérification de la collection "challenges"');
    console.log('-'.repeat(80));
    const challengesSnapshot = await getDocs(collection(db, 'challenges'));
    console.log(`✅ ${challengesSnapshot.size} défi(s) trouvé(s)\n`);

    if (challengesSnapshot.size > 0) {
      console.log('📋 Liste des défis:');
      challengesSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n   ${index + 1}. ${data.title}`);
        console.log(`      - Points: ${data.points}`);
        console.log(`      - Difficulté: ${data.difficulty}`);
        console.log(`      - Créé par: ${data.createdBy}`);
      });
    } else {
      console.log('⚠️  Aucun défi trouvé!');
      console.log('💡 Exécutez: npx ts-node scripts/init-firebase.ts');
    }

    // 3. Vérifier les événements
    console.log('\n\n3️⃣  Vérification de la collection "events"');
    console.log('-'.repeat(80));
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    console.log(`✅ ${eventsSnapshot.size} événement(s) trouvé(s)\n`);

    if (eventsSnapshot.size > 0) {
      console.log('📋 Liste des événements:');
      eventsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n   ${index + 1}. ${data.title}`);
        console.log(`      - Lieu: ${data.location}`);
        console.log(`      - Date: ${data.startDate.toDate().toLocaleDateString('fr-FR')}`);
      });
    } else {
      console.log('⚠️  Aucun événement trouvé!');
      console.log('💡 Exécutez: npx ts-node scripts/init-firebase.ts');
    }

    // 4. Vérifier les soumissions de défis
    console.log('\n\n4️⃣  Vérification de la collection "challengeSubmissions"');
    console.log('-'.repeat(80));
    const submissionsSnapshot = await getDocs(collection(db, 'challengeSubmissions'));
    console.log(`✅ ${submissionsSnapshot.size} soumission(s) trouvée(s)\n`);

    if (submissionsSnapshot.size > 0) {
      console.log('📋 Liste des soumissions:');
      submissionsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n   ${index + 1}. Soumission par scout: ${data.scoutId}`);
        console.log(`      - Défi: ${data.challengeId}`);
        console.log(`      - Status: ${data.status}`);
      });
    }

    // Résumé final
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ DE LA CONFIGURATION');
    console.log('='.repeat(80));
    console.log(`\n✅ Utilisateurs: ${usersSnapshot.size}`);
    console.log(`✅ Défis: ${challengesSnapshot.size}`);
    console.log(`✅ Événements: ${eventsSnapshot.size}`);
    console.log(`✅ Soumissions: ${submissionsSnapshot.size}`);

    // Recommandations
    console.log('\n\n💡 RECOMMANDATIONS');
    console.log('-'.repeat(80));

    if (usersSnapshot.size === 0) {
      console.log('❌ Aucun utilisateur trouvé!');
      console.log('   → Exécutez: npx ts-node scripts/init-firebase.ts');
    } else {
      console.log('✅ La base de données utilisateurs est configurée');
    }

    if (challengesSnapshot.size === 0) {
      console.log('⚠️  Aucun défi trouvé!');
      console.log('   → Exécutez: npx ts-node scripts/init-firebase.ts');
    } else {
      console.log('✅ Les défis sont configurés');
    }

    if (eventsSnapshot.size === 0) {
      console.log('⚠️  Aucun événement trouvé!');
      console.log('   → Exécutez: npx ts-node scripts/init-firebase.ts');
    } else {
      console.log('✅ Les événements sont configurés');
    }

    console.log('\n\n🎉 Vérification terminée!\n');

  } catch (error: any) {
    console.error('\n❌ ERREUR lors de la vérification:', error.message);
    console.error('Code:', error.code);

    if (error.code === 'permission-denied') {
      console.log('\n💡 Solution:');
      console.log('   → Vérifiez les règles de sécurité Firestore');
      console.log('   → Assurez-vous d\'être authentifié');
    }
  }
}

// Exécuter la vérification
verifyFirebaseSetup()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
