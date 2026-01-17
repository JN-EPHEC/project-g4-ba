import { db } from '@/config/firebase';
import { Parent, Scout } from '@/types';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    Timestamp,
    where,
    type DocumentData,
} from 'firebase/firestore';
import { UserService } from './user-service';

/**
 * Interface pour une relation parent-scout
 */
export interface ParentScoutRelation {
  id: string;
  parentId: string;
  scoutId: string;
  createdAt: Date;
  verified: boolean; // Si la relation a été vérifiée par un admin/animateur
  verifiedBy?: string;
  verifiedAt?: Date;
}

/**
 * Service pour gérer les relations parent-scout
 */
export class ParentScoutService {
  private static readonly COLLECTION_NAME = 'parentScoutRelations';

  /**
   * Convertit un document Firestore en relation
   */
  private static convertRelation(data: DocumentData): ParentScoutRelation {
    return {
      id: data.id,
      parentId: data.parentId,
      scoutId: data.scoutId,
      createdAt: data.createdAt?.toDate() || new Date(),
      verified: data.verified || false,
      verifiedBy: data.verifiedBy,
      verifiedAt: data.verifiedAt?.toDate(),
    };
  }

  /**
   * Lie un parent à un scout
   */
  static async linkParentToScout(
    parentId: string,
    scoutId: string,
    verified: boolean = false
  ): Promise<ParentScoutRelation> {
    try {
      // Vérifier que le parent existe et est bien un parent
      const parent = await UserService.getUserById(parentId);
      if (!parent || parent.role !== 'parent') {
        throw new Error('L\'utilisateur parent n\'existe pas ou n\'est pas un parent');
      }

      // Vérifier que le scout existe et est bien un scout
      const scout = await UserService.getUserById(scoutId);
      if (!scout || scout.role !== 'scout') {
        throw new Error('L\'utilisateur scout n\'existe pas ou n\'est pas un scout');
      }

      // Vérifier si la relation existe déjà
      const existingRelation = await this.getRelation(parentId, scoutId);
      if (existingRelation) {
        throw new Error('Cette relation existe déjà');
      }

      // Créer la relation
      const relationId = `${parentId}_${scoutId}`;
      const relationData = {
        parentId,
        scoutId,
        createdAt: Timestamp.fromDate(new Date()),
        verified,
      };

      await setDoc(doc(db, this.COLLECTION_NAME, relationId), relationData);

      // Mettre à jour les arrays dans les documents utilisateur
      await this.updateUserRelations(parentId, scoutId, 'add');

      return this.convertRelation({ id: relationId, ...relationData });
    } catch (error) {
      console.error('Erreur lors de la liaison parent-scout:', error);
      throw error;
    }
  }

  /**
   * Supprime la relation entre un parent et un scout
   */
  static async unlinkParentFromScout(
    parentId: string,
    scoutId: string
  ): Promise<void> {
    try {
      const relationId = `${parentId}_${scoutId}`;
      const relationRef = doc(db, this.COLLECTION_NAME, relationId);

      // Vérifier que la relation existe
      const relationDoc = await getDoc(relationRef);
      if (!relationDoc.exists()) {
        throw new Error('Cette relation n\'existe pas');
      }

      // Supprimer la relation
      await deleteDoc(relationRef);

      // Mettre à jour les arrays dans les documents utilisateur
      await this.updateUserRelations(parentId, scoutId, 'remove');
    } catch (error) {
      console.error('Erreur lors de la suppression de la relation:', error);
      throw error;
    }
  }

  /**
   * Met à jour les relations dans les documents utilisateur
   */
  private static async updateUserRelations(
    parentId: string,
    scoutId: string,
    action: 'add' | 'remove'
  ): Promise<void> {
    try {
      // Mettre à jour le parent
      const parent = await UserService.getUserById(parentId) as Parent;
      if (parent) {
        const updatedScoutIds =
          action === 'add'
            ? [...(parent.scoutIds || []), scoutId]
            : (parent.scoutIds || []).filter((id) => id !== scoutId);

        await UserService.updateUser(parentId, { scoutIds: updatedScoutIds });
      }

      // Mettre à jour le scout
      const scout = await UserService.getUserById(scoutId) as Scout;
      if (scout) {
        const updatedParentIds =
          action === 'add'
            ? [...(scout.parentIds || []), parentId]
            : (scout.parentIds || []).filter((id) => id !== parentId);

        await UserService.updateUser(scoutId, { parentIds: updatedParentIds });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des relations utilisateur:', error);
      throw error;
    }
  }

  /**
   * Récupère une relation spécifique
   */
  static async getRelation(
    parentId: string,
    scoutId: string
  ): Promise<ParentScoutRelation | null> {
    try {
      const relationId = `${parentId}_${scoutId}`;
      const relationDoc = await getDoc(doc(db, this.COLLECTION_NAME, relationId));

      if (!relationDoc.exists()) {
        return null;
      }

      return this.convertRelation({ id: relationDoc.id, ...relationDoc.data() });
    } catch (error) {
      console.error('Erreur lors de la récupération de la relation:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les scouts d'un parent
   */
  static async getScoutsByParent(parentId: string): Promise<Scout[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('parentId', '==', parentId)
      );

      const querySnapshot = await getDocs(q);
      const scoutIds = querySnapshot.docs.map((doc) => doc.data().scoutId);

      // Récupérer les données des scouts
      const scouts = await Promise.all(
        scoutIds.map((scoutId) => UserService.getUserById(scoutId))
      );

      return scouts.filter((scout) => scout !== null && scout.role === 'scout') as Scout[];
    } catch (error) {
      console.error('Erreur lors de la récupération des scouts:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les parents d'un scout
   */
  static async getParentsByScout(scoutId: string): Promise<Parent[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('scoutId', '==', scoutId)
      );

      const querySnapshot = await getDocs(q);
      const parentIds = querySnapshot.docs.map((doc) => doc.data().parentId);

      // Récupérer les données des parents
      const parents = await Promise.all(
        parentIds.map((parentId) => UserService.getUserById(parentId))
      );

      return parents.filter((parent) => parent !== null && parent.role === 'parent') as Parent[];
    } catch (error) {
      console.error('Erreur lors de la récupération des parents:', error);
      throw error;
    }
  }

  /**
   * Vérifie une relation (par un admin ou animateur)
   */
  static async verifyRelation(
    parentId: string,
    scoutId: string,
    verifiedBy: string
  ): Promise<void> {
    try {
      const relationId = `${parentId}_${scoutId}`;
      const relationRef = doc(db, this.COLLECTION_NAME, relationId);

      await setDoc(
        relationRef,
        {
          verified: true,
          verifiedBy,
          verifiedAt: Timestamp.fromDate(new Date()),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Erreur lors de la vérification de la relation:', error);
      throw error;
    }
  }

  /**
   * Lie un parent à un scout via le code de liaison sécurisé
   * C'est la méthode recommandée pour la liaison parent-scout
   */
  static async linkParentToScoutByCode(
    parentId: string,
    linkCode: string
  ): Promise<{ success: boolean; scout?: Scout; error?: string }> {
    try {
      // Normaliser le code (majuscules, supprimer espaces)
      const normalizedCode = linkCode.toUpperCase().trim();

      // Valider le format du code (ABC-123-XYZ)
      const codePattern = /^[A-Z]{3}-\d{3}-[A-Z]{3}$/;
      if (!codePattern.test(normalizedCode)) {
        return {
          success: false,
          error: 'Format de code invalide. Le code doit être au format ABC-123-XYZ',
        };
      }

      // Rechercher le scout avec ce code
      const scout = await UserService.getScoutByLinkCode(normalizedCode);

      if (!scout) {
        return {
          success: false,
          error: 'Code de liaison invalide. Vérifiez le code et réessayez.',
        };
      }

      // Vérifier si la relation existe déjà
      const existingRelation = await this.getRelation(parentId, scout.id);
      if (existingRelation) {
        return {
          success: false,
          error: 'Vous êtes déjà lié(e) à ce scout.',
        };
      }

      // Créer la liaison
      await this.linkParentToScout(parentId, scout.id, true); // verified: true car code valide

      return {
        success: true,
        scout,
      };
    } catch (error: any) {
      console.error('Erreur linkParentToScoutByCode:', error);
      return {
        success: false,
        error: error?.message || 'Une erreur est survenue lors de la liaison.',
      };
    }
  }

  /**
   * @deprecated Utilisez linkParentToScoutByCode à la place pour plus de sécurité.
   * Cette méthode expose les données des scouts à n'importe quel parent.
   *
   * Recherche des scouts par nom/prénom (pour la liaison parent)
   * Exclut les scouts déjà liés au parent
   */
  static async searchScouts(
    searchQuery: string,
    parentId: string
  ): Promise<Scout[]> {
    // Méthode dépréciée - retourne toujours un tableau vide
    console.warn('searchScouts est déprécié. Utilisez linkParentToScoutByCode.');
    return [];
  }
}

