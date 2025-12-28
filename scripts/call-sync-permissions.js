/**
 * Script pour appeler la Cloud Function syncChannelPermissions
 *
 * Exécuter avec: node scripts/call-sync-permissions.js <email> <password>
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Configuration Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyD2S3lsORWvM-SYvqsYncjp2A-0qO-5H3g',
  authDomain: 'wecamp-642bc.firebaseapp.com',
  projectId: 'wecamp-642bc',
  storageBucket: 'wecamp-642bc.firebasestorage.app',
  messagingSenderId: '779754921651',
  appId: '1:779754921651:web:4e3b8ad107253d24d2e97f',
};

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.log('Usage: node scripts/call-sync-permissions.js <email> <password>');
    console.log('Note: L\'utilisateur doit être un animateur');
    process.exit(1);
  }

  console.log('Initialisation Firebase...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const functions = getFunctions(app, 'europe-west1');

  try {
    console.log(`Connexion avec ${email}...`);
    await signInWithEmailAndPassword(auth, email, password);
    console.log('Connecté!');

    console.log('Appel de syncChannelPermissions...');
    const syncChannelPermissions = httpsCallable(functions, 'syncChannelPermissions');
    const result = await syncChannelPermissions();

    console.log('Résultat:', result.data);
    console.log(`✅ ${result.data.updatedCount} canal(aux) mis à jour!`);
    process.exit(0);

  } catch (error) {
    console.error('Erreur:', error.message || error);
    process.exit(1);
  }
}

main();
