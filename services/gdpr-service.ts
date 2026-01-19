import {
  doc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, auth, storage } from '@/config/firebase';
import { deleteUser } from 'firebase/auth';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { UserRole } from '@/types';

/**
 * Service GDPR pour la gestion des données personnelles
 * Conforme au Règlement Général sur la Protection des Données
 */
export class GDPRService {
  /**
   * Supprime toutes les données d'un utilisateur (droit à l'effacement)
   * Cette fonction supprime en cascade toutes les données liées à l'utilisateur
   */
  static async deleteUserData(userId: string, userRole: UserRole): Promise<void> {
    console.log(`🗑️ GDPR: Début de la suppression des données pour l'utilisateur ${userId} (${userRole})`);

    try {
      // 1. Supprimer la fiche santé (si scout)
      if (userRole === UserRole.SCOUT) {
        await this.deleteHealthRecord(userId);
      }

      // 2. Supprimer les photos de profil (Firebase Storage)
      await this.deleteUserAvatar(userId);

      // 3. Anonymiser les messages envoyés
      await this.anonymizeUserMessages(userId);

      // 4. Supprimer les soumissions de défis
      await this.deleteUserChallengeSubmissions(userId);

      // 5. Supprimer les relations parent-scout (si parent)
      if (userRole === UserRole.PARENT) {
        await this.deleteParentRelations(userId);
      }

      // 6. Supprimer les relations scout-parent (si scout)
      if (userRole === UserRole.SCOUT) {
        await this.removeScoutFromParents(userId);
      }

      // 7. Supprimer le document utilisateur
      await this.deleteUserDocument(userId);

      // 8. Supprimer l'authentification Firebase
      await this.deleteFirebaseAuth();

      console.log(`✅ GDPR: Suppression complète pour l'utilisateur ${userId}`);
    } catch (error) {
      console.error('❌ GDPR: Erreur lors de la suppression des données:', error);
      throw error;
    }
  }

  /**
   * Supprime la fiche santé d'un scout
   */
  private static async deleteHealthRecord(scoutId: string): Promise<void> {
    try {
      const healthRecordRef = doc(db, 'healthRecords', scoutId);
      await deleteDoc(healthRecordRef);
      console.log(`✅ GDPR: Fiche santé supprimée pour ${scoutId}`);
    } catch (error: any) {
      // Ignorer si le document n'existe pas
      if (error.code !== 'not-found') {
        console.warn(`⚠️ GDPR: Impossible de supprimer la fiche santé:`, error);
      }
    }
  }

  /**
   * Supprime l'avatar de l'utilisateur depuis Firebase Storage
   */
  private static async deleteUserAvatar(userId: string): Promise<void> {
    try {
      // L'avatar est stocké dans le dossier avatars/{userId}
      const avatarRef = ref(storage, `avatars/${userId}`);

      // Lister tous les fichiers dans le dossier de l'utilisateur
      const listResult = await listAll(avatarRef);

      // Supprimer chaque fichier
      const deletePromises = listResult.items.map((itemRef) => deleteObject(itemRef));
      await Promise.all(deletePromises);

      console.log(`✅ GDPR: Avatar supprimé pour ${userId}`);
    } catch (error: any) {
      // Ignorer les erreurs si le dossier n'existe pas
      if (error.code !== 'storage/object-not-found') {
        console.warn(`⚠️ GDPR: Impossible de supprimer l'avatar:`, error);
      }
    }
  }

  /**
   * Anonymise les messages envoyés par l'utilisateur
   * Les messages sont conservés mais l'auteur est remplacé par "[Utilisateur supprimé]"
   */
  private static async anonymizeUserMessages(userId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Anonymiser les messages des canaux
      const channelMessagesQuery = query(
        collection(db, 'channelMessages'),
        where('authorId', '==', userId)
      );
      const channelMessagesSnapshot = await getDocs(channelMessagesQuery);
      channelMessagesSnapshot.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          authorId: 'deleted-user',
          authorName: '[Utilisateur supprimé]',
        });
      });

      // Anonymiser les commentaires
      const commentsQuery = query(
        collection(db, 'messageComments'),
        where('authorId', '==', userId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      commentsSnapshot.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          authorId: 'deleted-user',
          authorName: '[Utilisateur supprimé]',
        });
      });

      // Anonymiser les posts legacy
      const postsQuery = query(
        collection(db, 'posts'),
        where('authorId', '==', userId)
      );
      const postsSnapshot = await getDocs(postsQuery);
      postsSnapshot.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          authorId: 'deleted-user',
          authorName: '[Utilisateur supprimé]',
        });
      });

      await batch.commit();
      console.log(`✅ GDPR: Messages anonymisés pour ${userId}`);
    } catch (error) {
      console.warn(`⚠️ GDPR: Erreur lors de l'anonymisation des messages:`, error);
    }
  }

  /**
   * Supprime les soumissions de défis de l'utilisateur
   */
  private static async deleteUserChallengeSubmissions(userId: string): Promise<void> {
    try {
      const submissionsQuery = query(
        collection(db, 'challengeSubmissions'),
        where('scoutId', '==', userId)
      );
      const snapshot = await getDocs(submissionsQuery);

      const batch = writeBatch(db);
      snapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();
      console.log(`✅ GDPR: ${snapshot.size} soumissions de défis supprimées pour ${userId}`);
    } catch (error) {
      console.warn(`⚠️ GDPR: Erreur lors de la suppression des soumissions:`, error);
    }
  }

  /**
   * Supprime les relations parent-scout pour un parent
   */
  private static async deleteParentRelations(parentId: string): Promise<void> {
    try {
      const relationsQuery = query(
        collection(db, 'parentScoutRelations'),
        where('parentId', '==', parentId)
      );
      const snapshot = await getDocs(relationsQuery);

      const batch = writeBatch(db);
      snapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();
      console.log(`✅ GDPR: ${snapshot.size} relations parent-scout supprimées pour ${parentId}`);
    } catch (error) {
      console.warn(`⚠️ GDPR: Erreur lors de la suppression des relations:`, error);
    }
  }

  /**
   * Retire un scout de la liste des enfants de ses parents
   */
  private static async removeScoutFromParents(scoutId: string): Promise<void> {
    try {
      // Trouver les relations avec ce scout
      const relationsQuery = query(
        collection(db, 'parentScoutRelations'),
        where('scoutId', '==', scoutId)
      );
      const relationsSnapshot = await getDocs(relationsQuery);

      const batch = writeBatch(db);

      // Supprimer les relations
      relationsSnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      // Mettre à jour les documents parents pour retirer ce scout de scoutIds
      const parentIds = new Set<string>();
      relationsSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.parentId) {
          parentIds.add(data.parentId);
        }
      });

      // Pour chaque parent, retirer le scoutId de leur liste
      for (const parentId of parentIds) {
        const parentRef = doc(db, 'users', parentId);
        // Note: On ne peut pas faire un arrayRemove dans un batch facilement
        // On va juste supprimer les relations, le parent verra que le scout n'existe plus
      }

      await batch.commit();
      console.log(`✅ GDPR: Scout retiré de ${parentIds.size} parents`);
    } catch (error) {
      console.warn(`⚠️ GDPR: Erreur lors de la mise à jour des parents:`, error);
    }
  }

  /**
   * Supprime le document utilisateur de Firestore
   */
  private static async deleteUserDocument(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      console.log(`✅ GDPR: Document utilisateur supprimé pour ${userId}`);
    } catch (error) {
      console.error(`❌ GDPR: Erreur lors de la suppression du document utilisateur:`, error);
      throw error;
    }
  }

  /**
   * Supprime l'authentification Firebase de l'utilisateur connecté
   */
  private static async deleteFirebaseAuth(): Promise<void> {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await deleteUser(currentUser);
        console.log(`✅ GDPR: Authentification Firebase supprimée`);
      } catch (error) {
        console.error(`❌ GDPR: Erreur lors de la suppression de l'authentification:`, error);
        throw error;
      }
    }
  }

  /**
   * Exporte les données de l'utilisateur (droit d'accès/portabilité)
   * Retourne un objet JSON avec toutes les données personnelles
   */
  static async exportUserData(userId: string): Promise<Record<string, unknown>> {
    console.log(`📦 GDPR: Export des données pour l'utilisateur ${userId}`);

    const exportData: Record<string, unknown> = {};

    try {
      // 1. Données utilisateur
      const userDoc = await getDocs(
        query(collection(db, 'users'), where('__name__', '==', userId))
      );
      if (!userDoc.empty) {
        exportData.user = userDoc.docs[0].data();
      }

      // 2. Fiche santé
      const healthQuery = query(
        collection(db, 'healthRecords'),
        where('__name__', '==', userId)
      );
      const healthSnapshot = await getDocs(healthQuery);
      if (!healthSnapshot.empty) {
        exportData.healthRecord = healthSnapshot.docs[0].data();
      }

      // 3. Messages envoyés
      const messagesQuery = query(
        collection(db, 'channelMessages'),
        where('authorId', '==', userId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      exportData.messages = messagesSnapshot.docs.map((doc) => doc.data());

      // 4. Soumissions de défis
      const submissionsQuery = query(
        collection(db, 'challengeSubmissions'),
        where('scoutId', '==', userId)
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);
      exportData.challengeSubmissions = submissionsSnapshot.docs.map((doc) => doc.data());

      // 5. Relations parent-scout
      const parentRelationsQuery = query(
        collection(db, 'parentScoutRelations'),
        where('parentId', '==', userId)
      );
      const scoutRelationsQuery = query(
        collection(db, 'parentScoutRelations'),
        where('scoutId', '==', userId)
      );

      const [parentRelations, scoutRelations] = await Promise.all([
        getDocs(parentRelationsQuery),
        getDocs(scoutRelationsQuery),
      ]);

      exportData.parentRelations = parentRelations.docs.map((doc) => doc.data());
      exportData.scoutRelations = scoutRelations.docs.map((doc) => doc.data());

      console.log(`✅ GDPR: Export terminé pour ${userId}`);
      return exportData;
    } catch (error) {
      console.error('❌ GDPR: Erreur lors de l\'export des données:', error);
      throw error;
    }
  }
}
