import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ChallengeSubmission, ChallengeStatus } from '@/types';
import { UserService } from './user-service';
import { UserRole, Scout } from '@/types';

/**
 * Service pour gérer les soumissions de défis
 */
export class ChallengeSubmissionService {
  private static readonly COLLECTION_NAME = 'challengeSubmissions';

  /**
   * Convertit un document Firestore en soumission
   */
  private static convertSubmission(data: DocumentData): ChallengeSubmission {
    return {
      id: data.id,
      challengeId: data.challengeId,
      scoutId: data.scoutId,
      proofImageUrl: data.proofImageUrl,
      submittedAt: data.submittedAt?.toDate() || new Date(),
      status: data.status as ChallengeStatus,
      validatedBy: data.validatedBy,
      validatedAt: data.validatedAt?.toDate(),
      comment: data.comment,
      scoutComment: data.scoutComment,
    };
  }

  /**
   * Soumet un défi avec une preuve photo et un commentaire optionnel
   */
  static async submitChallenge(
    challengeId: string,
    scoutId: string,
    proofImageUrl: string,
    scoutComment?: string
  ): Promise<ChallengeSubmission> {
    try {
      // Vérifier que le scout existe
      const scout = await UserService.getUserById(scoutId);
      if (!scout || scout.role !== UserRole.SCOUT) {
        throw new Error('L\'utilisateur n\'existe pas ou n\'est pas un scout');
      }

      // Vérifier qu'il n'y a pas déjà une soumission en attente
      const existingSubmission = await this.getSubmissionByChallengeAndScout(
        challengeId,
        scoutId
      );
      if (existingSubmission && existingSubmission.status === ChallengeStatus.PENDING_VALIDATION) {
        throw new Error('Vous avez déjà soumis ce défi et il est en attente de validation');
      }

      const submissionData: Record<string, unknown> = {
        challengeId,
        scoutId,
        proofImageUrl,
        submittedAt: Timestamp.fromDate(new Date()),
        status: ChallengeStatus.PENDING_VALIDATION,
      };

      // Ajouter le commentaire du scout s'il est fourni
      if (scoutComment && scoutComment.trim()) {
        submissionData.scoutComment = scoutComment.trim();
      }

      const submissionRef = doc(collection(db, this.COLLECTION_NAME));
      await setDoc(submissionRef, submissionData);

      return this.convertSubmission({ id: submissionRef.id, ...submissionData });
    } catch (error) {
      console.error('Erreur lors de la soumission du défi:', error);
      throw error;
    }
  }

  /**
   * Valide une soumission de défi
   */
  static async validateSubmission(
    submissionId: string,
    validatedBy: string,
    comment?: string
  ): Promise<void> {
    try {
      const submission = await this.getSubmissionById(submissionId);
      if (!submission) {
        throw new Error('La soumission n\'existe pas');
      }

      if (submission.status !== ChallengeStatus.PENDING_VALIDATION) {
        throw new Error('Cette soumission ne peut plus être validée');
      }

      // Mettre à jour le statut
      const submissionRef = doc(db, this.COLLECTION_NAME, submissionId);
      const updateData: Record<string, unknown> = {
        status: ChallengeStatus.COMPLETED,
        validatedBy,
        validatedAt: Timestamp.fromDate(new Date()),
      };
      if (comment !== undefined) {
        updateData.comment = comment;
      }
      await updateDoc(submissionRef, updateData);

      // Attribuer les points au scout
      const challenge = await import('./challenge-service').then(
        (m) => m.ChallengeService.getChallengeById(submission.challengeId)
      );
      if (challenge) {
        const scout = await UserService.getUserById(submission.scoutId) as Scout;
        if (scout) {
          const newPoints = (scout.points || 0) + challenge.points;
          await UserService.updateUser(submission.scoutId, { points: newPoints });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la validation de la soumission:', error);
      throw error;
    }
  }

  /**
   * Rejette une soumission de défi
   */
  static async rejectSubmission(
    submissionId: string,
    validatedBy: string,
    comment?: string
  ): Promise<void> {
    try {
      const submission = await this.getSubmissionById(submissionId);
      if (!submission) {
        throw new Error('La soumission n\'existe pas');
      }

      if (submission.status !== ChallengeStatus.PENDING_VALIDATION) {
        throw new Error('Cette soumission ne peut plus être rejetée');
      }

      const submissionRef = doc(db, this.COLLECTION_NAME, submissionId);
      const updateData: Record<string, unknown> = {
        status: ChallengeStatus.EXPIRED,
        validatedBy,
        validatedAt: Timestamp.fromDate(new Date()),
      };
      if (comment !== undefined) {
        updateData.comment = comment;
      }
      await updateDoc(submissionRef, updateData);
    } catch (error) {
      console.error('Erreur lors du rejet de la soumission:', error);
      throw error;
    }
  }

  /**
   * Récupère une soumission par son ID
   */
  static async getSubmissionById(
    submissionId: string
  ): Promise<ChallengeSubmission | null> {
    try {
      const submissionDoc = await getDoc(
        doc(db, this.COLLECTION_NAME, submissionId)
      );

      if (!submissionDoc.exists()) {
        return null;
      }

      return this.convertSubmission({
        id: submissionDoc.id,
        ...submissionDoc.data(),
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la soumission:', error);
      throw error;
    }
  }

  /**
   * Récupère une soumission par défi et scout
   */
  static async getSubmissionByChallengeAndScout(
    challengeId: string,
    scoutId: string
  ): Promise<ChallengeSubmission | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('challengeId', '==', challengeId),
        where('scoutId', '==', scoutId)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return this.convertSubmission({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Erreur lors de la récupération de la soumission:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les soumissions d'un scout
   */
  static async getSubmissionsByScout(
    scoutId: string
  ): Promise<ChallengeSubmission[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('scoutId', '==', scoutId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) =>
        this.convertSubmission({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des soumissions:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les soumissions d'un défi
   */
  static async getSubmissionsByChallenge(
    challengeId: string
  ): Promise<ChallengeSubmission[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('challengeId', '==', challengeId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) =>
        this.convertSubmission({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des soumissions:', error);
      throw error;
    }
  }

  /**
   * Récupère les soumissions en attente de validation
   */
  static async getPendingSubmissions(
    unitId?: string
  ): Promise<ChallengeSubmission[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', ChallengeStatus.PENDING_VALIDATION)
      );

      const querySnapshot = await getDocs(q);
      const submissions = querySnapshot.docs.map((doc) =>
        this.convertSubmission({ id: doc.id, ...doc.data() })
      );

      // Si unitId est fourni, filtrer par unité du scout
      if (unitId) {
        const filteredSubmissions = [];
        for (const submission of submissions) {
          const scout = await UserService.getUserById(submission.scoutId) as Scout;
          if (scout && scout.unitId === unitId) {
            filteredSubmissions.push(submission);
          }
        }
        return filteredSubmissions;
      }

      return submissions;
    } catch (error) {
      console.error('Erreur lors de la récupération des soumissions en attente:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les soumissions traitées (validées ou rejetées) d'une unité
   */
  static async getProcessedSubmissions(
    unitId: string
  ): Promise<ChallengeSubmission[]> {
    try {
      // Récupérer toutes les soumissions
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const allSubmissions = querySnapshot.docs.map((doc) =>
        this.convertSubmission({ id: doc.id, ...doc.data() })
      );

      // Filtrer par unité et par statut traité (completed ou expired)
      const filteredSubmissions = [];
      for (const submission of allSubmissions) {
        if (submission.status === ChallengeStatus.PENDING_VALIDATION) {
          continue; // Ignorer les soumissions en attente
        }
        const scout = await UserService.getUserById(submission.scoutId) as Scout;
        if (scout && scout.unitId === unitId) {
          filteredSubmissions.push(submission);
        }
      }

      // Trier par date de validation (plus récent en premier)
      filteredSubmissions.sort((a, b) => {
        const dateA = a.validatedAt ? a.validatedAt.getTime() : 0;
        const dateB = b.validatedAt ? b.validatedAt.getTime() : 0;
        return dateB - dateA;
      });

      return filteredSubmissions;
    } catch (error) {
      console.error('Erreur lors de la récupération des soumissions traitées:', error);
      throw error;
    }
  }
}

