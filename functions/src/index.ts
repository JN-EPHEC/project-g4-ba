import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Crée automatiquement un document user dans Firestore
 * quand un nouvel utilisateur s'inscrit via Authentication
 */
export const createUserDocument = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;

  // Extraire prénom et nom du displayName si disponible
  const nameParts = displayName?.split(' ') || [];
  const firstName = nameParts[0] || 'Prénom';
  const lastName = nameParts.slice(1).join(' ') || 'Nom';

  // Créer le document dans Firestore
  const userDoc = {
    email: email || '',
    role: 'scout', // Rôle par défaut
    firstName,
    lastName,
    unitId: null,
    points: 0,
    profilePicture: user.photoURL || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await admin.firestore().collection('users').doc(uid).set(userDoc);
    console.log(`✅ Document user créé pour ${email}`);
  } catch (error) {
    console.error('❌ Erreur lors de la création du document user:', error);
  }
});

/**
 * Met à jour le document user quand l'utilisateur est supprimé
 */
export const deleteUserDocument = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;

  try {
    await admin.firestore().collection('users').doc(uid).delete();
    console.log(`✅ Document user supprimé pour ${uid}`);
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du document user:', error);
  }
});
