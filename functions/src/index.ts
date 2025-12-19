import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * DÉSACTIVÉ : Cette fonction créait automatiquement un document user
 * mais elle écrasait les données envoyées par le client (notamment le rôle).
 * La création du document est maintenant gérée côté client dans UserService.createUser()
 *
 * Si vous avez besoin de réactiver cette fonction, utilisez setDoc avec { merge: true }
 * ou vérifiez d'abord si le document existe.
 */
export const createUserDocument = functions.auth.user().onCreate(async (user) => {
  const { uid, email } = user;

  try {
    // Vérifier si le document existe déjà (créé par le client)
    const existingDoc = await admin.firestore().collection('users').doc(uid).get();

    if (existingDoc.exists) {
      console.log(`ℹ️ Document user existe déjà pour ${email} (UID: ${uid}), skip de la création automatique`);
      return;
    }

    // Le document n'existe pas encore - cela ne devrait pas arriver si le client fonctionne correctement
    // On ne crée PAS de document par défaut pour éviter d'écraser les données du client
    console.warn(`⚠️ Document user non trouvé pour ${email} (UID: ${uid}) - le client devrait le créer`);

    // NE PAS créer de document ici - laisser le client le faire avec les bonnes données

  } catch (error) {
    console.error('❌ Erreur dans createUserDocument:', error);
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
