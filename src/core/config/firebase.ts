import Constants from 'expo-constants';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

/**
 * Configuration Firebase
 * Les clés doivent être définies dans les variables d'environnement
 */
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.firebaseAppId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Vérifier que toutes les clés sont définies
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
  console.warn(
    '⚠️  Configuration Firebase incomplète. Les clés suivantes manquent:',
    missingKeys.join(', ')
  );
  console.warn(
    '📝 Veuillez créer un fichier .env avec vos clés Firebase ou les ajouter dans app.json'
  );
  console.warn('📖 Consultez FIREBASE_SETUP.md pour plus d\'informations');
}

// Initialiser Firebase seulement si ce n'est pas déjà fait
let app: FirebaseApp;
if (getApps().length === 0) {
  // Initialiser seulement si au moins les clés essentielles sont présentes
  if (firebaseConfig.apiKey && firebaseConfig.projectId && 
      firebaseConfig.apiKey !== 'demo-api-key' && 
      firebaseConfig.projectId !== 'demo-project') {
    console.log('✅ Initialisation de Firebase avec la configuration fournie');
    console.log('📋 Project ID:', firebaseConfig.projectId);
    app = initializeApp(firebaseConfig);
  } else {
    // Créer une configuration demo pour éviter les erreurs de compilation
    // L'application affichera des erreurs appropriées lors de l'utilisation
    console.warn('⚠️  Utilisation d\'une configuration Firebase de démonstration');
    console.warn('⚠️  Les fonctionnalités Firebase ne fonctionneront pas jusqu\'à ce que vous configuriez vos clés');
    app = initializeApp({
      apiKey: 'demo-api-key',
      authDomain: 'demo.firebaseapp.com',
      projectId: 'demo-project',
      storageBucket: 'demo-project.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:demo',
    });
    console.error('❌ Firebase n\'est pas correctement configuré. Veuillez ajouter vos clés de configuration.');
    console.error('📖 Consultez FIREBASE_SETUP.md pour plus d\'informations');
  }
} else {
  app = getApps()[0];
  console.log('✅ Firebase déjà initialisé');
}

// Initialiser les services Firebase
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

export default app;

