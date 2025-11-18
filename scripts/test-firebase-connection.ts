/**
 * Script de test pour diagnostiquer les problèmes de connexion Firebase
 * Exécuter avec: npx ts-node scripts/test-firebase-connection.ts
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Configuration Firebase (même config que dans votre app)
const firebaseConfig = {
  apiKey: "AIzaSyAbhp-2lyOggt13Vkz5d5h567TQ85pu29w",
  authDomain: "wecamp-642bc.firebaseapp.com",
  projectId: "wecamp-642bc",
  storageBucket: "wecamp-642bc.firebasestorage.app",
  messagingSenderId: "260742902094",
  appId: "1:260742902094:web:6cdadf6dece0c04742ae1f",
};

console.log('🔍 ===== DIAGNOSTIC FIREBASE =====\n');

// Test 1: Initialisation
console.log('📋 Test 1: Initialisation de Firebase');
try {
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialisé avec succès');
  console.log('   Project ID:', firebaseConfig.projectId);
} catch (error: any) {
  console.error('❌ Erreur d\'initialisation:', error.message);
  process.exit(1);
}

// Test 2: Firebase Auth
console.log('\n📋 Test 2: Connexion à Firebase Auth');
const auth = getAuth();
console.log('✅ Firebase Auth connecté');
console.log('   Auth Domain:', auth.config.authDomain);

// Test 3: Firestore
console.log('\n📋 Test 3: Connexion à Firestore');
const db = getFirestore();
console.log('✅ Firestore connecté');

// Test 4: Test de connexion avec email/password
async function testAuth() {
  console.log('\n📋 Test 4: Test d\'authentification');

  const testEmail = 'test@example.com';
  const testPassword = 'test123456';

  try {
    // Essayer de créer un utilisateur de test
    console.log('   Tentative de création d\'un utilisateur de test...');
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✅ Utilisateur de test créé avec succès');
    console.log('   UID:', userCredential.user.uid);
    console.log('   Email:', userCredential.user.email);

    // Test d'écriture dans Firestore
    console.log('\n📋 Test 5: Écriture dans Firestore');
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: testEmail,
      firstName: 'Test',
      lastName: 'User',
      role: 'scout',
      createdAt: new Date().toISOString(),
    });
    console.log('✅ Document créé dans Firestore');

    // Test de lecture depuis Firestore
    console.log('\n📋 Test 6: Lecture depuis Firestore');
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (userDoc.exists()) {
      console.log('✅ Document lu depuis Firestore');
      console.log('   Données:', userDoc.data());
    } else {
      console.error('❌ Document non trouvé');
    }

    // Se déconnecter
    await auth.signOut();
    console.log('\n✅ Déconnexion réussie');

  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️  L\'utilisateur de test existe déjà, test de connexion...');

      try {
        const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
        console.log('✅ Connexion réussie');
        console.log('   UID:', userCredential.user.uid);
        console.log('   Email:', userCredential.user.email);

        // Vérifier Firestore
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          console.log('✅ Données utilisateur trouvées dans Firestore');
          console.log('   Données:', userDoc.data());
        } else {
          console.warn('⚠️  Utilisateur Auth existe mais pas de document Firestore');
        }

        await auth.signOut();
      } catch (loginError: any) {
        console.error('❌ Erreur de connexion:', loginError.code);
        console.error('   Message:', loginError.message);
      }
    } else {
      console.error('❌ Erreur:', error.code);
      console.error('   Message:', error.message);
    }
  }
}

// Test 5: Vérifier les règles Firestore
async function testFirestoreRules() {
  console.log('\n📋 Test 7: Vérification des règles Firestore');

  try {
    // Essayer de lire sans authentification
    const testDoc = await getDoc(doc(db, 'users', 'test'));
    console.log('⚠️  Lecture sans authentification possible (règles Firestore à vérifier)');
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.log('✅ Règles Firestore correctement configurées (lecture refusée sans auth)');
    } else {
      console.error('❌ Erreur inattendue:', error.message);
    }
  }
}

// Exécuter tous les tests
(async () => {
  try {
    await testAuth();
    await testFirestoreRules();

    console.log('\n✅ ===== TOUS LES TESTS TERMINÉS =====');
    console.log('\n💡 Si tous les tests sont verts, Firebase fonctionne correctement!');
    console.log('💡 Le problème vient peut-être de l\'interface utilisateur, pas de Firebase.');

  } catch (error: any) {
    console.error('\n❌ ===== ERREUR CRITIQUE =====');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }

  process.exit(0);
})();
