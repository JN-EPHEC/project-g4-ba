/**
 * Utilitaire de test pour vérifier la connexion Firebase
 *
 * Ce fichier permet de tester la configuration Firebase et d'identifier les problèmes
 */

import { auth, db, storage } from '@/config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

/**
 * Test de connexion Firebase
 * Vérifie que Firebase est correctement configuré
 */
export const testFirebaseConnection = async (): Promise<{
  success: boolean;
  message: string;
  details: any;
}> => {
  console.log('🧪 [FIREBASE TEST] Démarrage du test de connexion Firebase...');

  const results: any = {
    auth: null,
    firestore: null,
    storage: null,
  };

  try {
    // Test 1: Vérifier que Firebase Auth est initialisé
    console.log('🧪 [FIREBASE TEST] Test 1: Vérification de Firebase Auth...');
    if (auth) {
      results.auth = {
        status: 'OK',
        currentUser: auth.currentUser?.email || 'Aucun utilisateur connecté',
      };
      console.log('✅ [FIREBASE TEST] Firebase Auth est initialisé');
    } else {
      results.auth = { status: 'ERROR', message: 'Auth non initialisé' };
      console.error('❌ [FIREBASE TEST] Firebase Auth n\'est pas initialisé');
    }

    // Test 2: Vérifier que Firestore est initialisé
    console.log('🧪 [FIREBASE TEST] Test 2: Vérification de Firestore...');
    if (db) {
      console.log('✅ [FIREBASE TEST] Firestore est initialisé');

      // Essayer d'écrire un document de test
      try {
        console.log('🧪 [FIREBASE TEST] Test 2a: Tentative d\'écriture d\'un document de test...');
        const testCollection = collection(db, 'test_connection');
        const testDoc = await addDoc(testCollection, {
          test: true,
          timestamp: new Date().toISOString(),
          message: 'Test de connexion Firebase',
        });
        console.log('✅ [FIREBASE TEST] Document de test créé avec ID:', testDoc.id);

        // Essayer de lire le document
        console.log('🧪 [FIREBASE TEST] Test 2b: Tentative de lecture du document...');
        const snapshot = await getDocs(testCollection);
        console.log('✅ [FIREBASE TEST] Documents lus:', snapshot.size);

        // Supprimer le document de test
        console.log('🧪 [FIREBASE TEST] Test 2c: Suppression du document de test...');
        await deleteDoc(doc(db, 'test_connection', testDoc.id));
        console.log('✅ [FIREBASE TEST] Document de test supprimé');

        results.firestore = {
          status: 'OK',
          message: 'Lecture/écriture fonctionnelles',
          documentsRead: snapshot.size,
        };
      } catch (firestoreError: any) {
        console.error('❌ [FIREBASE TEST] Erreur lors du test Firestore:', firestoreError);
        results.firestore = {
          status: 'ERROR',
          message: firestoreError.message,
          code: firestoreError.code,
        };
      }
    } else {
      results.firestore = { status: 'ERROR', message: 'Firestore non initialisé' };
      console.error('❌ [FIREBASE TEST] Firestore n\'est pas initialisé');
    }

    // Test 3: Vérifier que Storage est initialisé
    console.log('🧪 [FIREBASE TEST] Test 3: Vérification de Storage...');
    if (storage) {
      results.storage = { status: 'OK' };
      console.log('✅ [FIREBASE TEST] Storage est initialisé');
    } else {
      results.storage = { status: 'ERROR', message: 'Storage non initialisé' };
      console.error('❌ [FIREBASE TEST] Storage n\'est pas initialisé');
    }

    // Résumé
    const allOk =
      results.auth?.status === 'OK' &&
      results.firestore?.status === 'OK' &&
      results.storage?.status === 'OK';

    console.log('🧪 [FIREBASE TEST] Résumé des tests:', results);

    if (allOk) {
      console.log('✅ [FIREBASE TEST] Tous les tests sont passés avec succès!');
      return {
        success: true,
        message: 'Firebase est correctement configuré',
        details: results,
      };
    } else {
      console.warn('⚠️ [FIREBASE TEST] Certains tests ont échoué');
      return {
        success: false,
        message: 'Certains services Firebase ne sont pas correctement configurés',
        details: results,
      };
    }
  } catch (error: any) {
    console.error('❌ [FIREBASE TEST] Erreur lors du test de connexion:', error);
    return {
      success: false,
      message: `Erreur: ${error.message}`,
      details: { error: error.message, results },
    };
  }
};

/**
 * Test d'authentification Firebase
 * Crée un compte de test, se connecte, et se déconnecte
 */
export const testFirebaseAuth = async (
  email: string = `test-${Date.now()}@wecamp.test`,
  password: string = 'Test123456!'
): Promise<{
  success: boolean;
  message: string;
  details: any;
}> => {
  console.log('🧪 [FIREBASE TEST AUTH] Test d\'authentification avec:', email);

  const { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } = await import('firebase/auth');

  try {
    // Créer un compte de test
    console.log('🧪 [FIREBASE TEST AUTH] Création d\'un compte de test...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ [FIREBASE TEST AUTH] Compte créé avec UID:', user.uid);

    // Se déconnecter
    console.log('🧪 [FIREBASE TEST AUTH] Déconnexion...');
    await signOut(auth);
    console.log('✅ [FIREBASE TEST AUTH] Déconnexion réussie');

    // Se reconnecter
    console.log('🧪 [FIREBASE TEST AUTH] Reconnexion...');
    const loginCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ [FIREBASE TEST AUTH] Reconnexion réussie');

    // Supprimer le compte de test
    console.log('🧪 [FIREBASE TEST AUTH] Suppression du compte de test...');
    await deleteUser(loginCredential.user);
    console.log('✅ [FIREBASE TEST AUTH] Compte supprimé');

    return {
      success: true,
      message: 'Authentification Firebase fonctionne correctement',
      details: { uid: user.uid, email },
    };
  } catch (error: any) {
    console.error('❌ [FIREBASE TEST AUTH] Erreur:', error);
    return {
      success: false,
      message: `Erreur d'authentification: ${error.message}`,
      details: { code: error.code, message: error.message },
    };
  }
};
