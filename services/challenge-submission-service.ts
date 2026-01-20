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
   * Helper pour convertir un champ date (Timestamp Firestore ou Date)
   */
  private static toDate(value: any): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value?.toDate === 'function') return value.toDate();
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    return undefined;
  }

  /**
   * Convertit un document Firestore en soumission
   */
  private static convertSubmission(data: DocumentData): ChallengeSubmission {
    return {
      id: data.id,
      challengeId: data.challengeId,
      scoutId: data.scoutId,
      proofImageUrl: data.proofImageUrl,
      startedAt: this.toDate(data.startedAt),
      submittedAt: this.toDate(data.submittedAt),
      status: data.status as ChallengeStatus,
      validatedBy: data.validatedBy,
      validatedAt: this.toDate(data.validatedAt),
      comment: data.comment,
      scoutComment: data.scoutComment,
    };
  }

  /**
   * Commence un défi (crée une soumission avec status STARTED)
   */
  static async startChallenge(
    challengeId: string,
    scoutId: string
  ): Promise<ChallengeSubmission> {
    try {
      // Vérifier que le scout existe
      const scout = await UserService.getUserById(scoutId);
      if (!scout || scout.role !== UserRole.SCOUT) {
        throw new Error('L\'utilisateur n\'existe pas ou n\'est pas un scout');
      }

      // Vérifier qu'il n'y a pas déjà une soumission
      const existingSubmission = await this.getSubmissionByChallengeAndScout(
        challengeId,
        scoutId
      );
      if (existingSubmission) {
        if (existingSubmission.status === ChallengeStatus.STARTED) {
          throw new Error('Tu as déjà commencé ce défi');
        }
        if (existingSubmission.status === ChallengeStatus.PENDING_VALIDATION) {
          throw new Error('Tu as déjà soumis ce défi et il est en attente de validation');
        }
        if (existingSubmission.status === ChallengeStatus.COMPLETED) {
          throw new Error('Tu as déjà complété ce défi');
        }
      }

      const now = Timestamp.fromDate(new Date());
      const submissionData: Record<string, unknown> = {
        challengeId,
        scoutId,
        startedAt: now,
        status: ChallengeStatus.STARTED,
      };

      const submissionRef = doc(collection(db, this.COLLECTION_NAME));
      await setDoc(submissionRef, submissionData);

      return this.convertSubmission({ id: submissionRef.id, ...submissionData });
    } catch (error) {
      console.error('Erreur lors du démarrage du défi:', error);
      throw error;
    }
  }

  /**
   * Soumet un défi avec une preuve photo optionnelle et un commentaire obligatoire
   * Peut être utilisé pour une nouvelle soumission ou pour compléter un défi déjà commencé
   */
  static async submitChallenge(
    challengeId: string,
    scoutId: string,
    scoutComment: string,
    proofImageUrl?: string
  ): Promise<ChallengeSubmission> {
    try {
      // Vérifier que le commentaire est fourni
      if (!scoutComment || !scoutComment.trim()) {
        throw new Error('Un commentaire est requis pour soumettre le défi');
      }

      // Vérifier que le scout existe
      const scout = await UserService.getUserById(scoutId);
      if (!scout || scout.role !== UserRole.SCOUT) {
        throw new Error('L\'utilisateur n\'existe pas ou n\'est pas un scout');
      }

      // Vérifier s'il y a déjà une soumission
      const existingSubmission = await this.getSubmissionByChallengeAndScout(
        challengeId,
        scoutId
      );

      if (existingSubmission) {
        if (existingSubmission.status === ChallengeStatus.PENDING_VALIDATION) {
          throw new Error('Tu as déjà soumis ce défi et il est en attente de validation');
        }
        if (existingSubmission.status === ChallengeStatus.COMPLETED) {
          throw new Error('Tu as déjà complété ce défi');
        }

        // Si le défi a été commencé, on met à jour la soumission existante
        if (existingSubmission.status === ChallengeStatus.STARTED) {
          const submissionRef = doc(db, this.COLLECTION_NAME, existingSubmission.id);
          const updateData: Record<string, unknown> = {
            scoutComment: scoutComment.trim(),
            submittedAt: Timestamp.fromDate(new Date()),
            status: ChallengeStatus.PENDING_VALIDATION,
          };

          if (proofImageUrl) {
            updateData.proofImageUrl = proofImageUrl;
          }

          await updateDoc(submissionRef, updateData);

          return this.convertSubmission({
            ...existingSubmission,
            ...updateData,
            id: existingSubmission.id,
          });
        }
      }

      // Nouvelle soumission (défi pas encore commencé ou précédemment rejeté)
      const now = Timestamp.fromDate(new Date());
      const submissionData: Record<string, unknown> = {
        challengeId,
        scoutId,
        scoutComment: scoutComment.trim(),
        startedAt: now, // Commence et soumet en même temps
        submittedAt: now,
        status: ChallengeStatus.PENDING_VALIDATION,
      };

      // Ajouter la photo seulement si fournie
      if (proofImageUrl) {
        submissionData.proofImageUrl = proofImageUrl;
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

      // Récupérer le challenge AVANT de modifier quoi que ce soit
      const { ChallengeService } = await import('./challenge-service');
      const challenge = await ChallengeService.getChallengeById(submission.challengeId);

      if (!challenge) {
        throw new Error('Le défi associé n\'existe pas');
      }

      // Mettre à jour le statut de la soumission
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
      const scout = await UserService.getUserById(submission.scoutId) as Scout;
      if (scout) {
        const newPoints = (scout.points || 0) + challenge.points;
        await UserService.updateUser(submission.scoutId, { points: newPoints });
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
   * Récupère les soumissions en attente pour un animateur
   * EXCLUT les défis globaux (WeCamp) - seuls les défis de l'unité
   */
  static async getPendingSubmissionsForAnimator(
    unitId: string
  ): Promise<ChallengeSubmission[]> {
    try {
      // Récupérer toutes les soumissions en attente de l'unité
      const allSubmissions = await this.getPendingSubmissions(unitId);

      // Importer dynamiquement ChallengeService pour éviter les imports circulaires
      const { ChallengeService } = await import('./challenge-service');

      // Filtrer pour exclure les défis globaux
      const filteredSubmissions = [];
      for (const submission of allSubmissions) {
        const challenge = await ChallengeService.getChallengeById(submission.challengeId);

        // Un défi est global si unitId est null, undefined, ou chaîne vide
        const isGlobalChallenge = !challenge?.unitId || challenge.unitId === '';

        if (challenge && !isGlobalChallenge) {
          filteredSubmissions.push(submission);
        }
      }

      return filteredSubmissions;
    } catch (error) {
      console.error('Erreur lors de la récupération des soumissions pour animateur:', error);
      throw error;
    }
  }

  /**
   * Récupère les soumissions en attente pour WeCamp Admin
   * SEULEMENT les défis globaux (unitId null/undefined)
   */
  static async getPendingSubmissionsForWeCamp(): Promise<ChallengeSubmission[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', ChallengeStatus.PENDING_VALIDATION)
      );

      const querySnapshot = await getDocs(q);
      const submissions = querySnapshot.docs.map((doc) =>
        this.convertSubmission({ id: doc.id, ...doc.data() })
      );

      // Importer dynamiquement ChallengeService pour éviter les imports circulaires
      const { ChallengeService } = await import('./challenge-service');

      // Filtrer pour garder seulement les défis globaux
      const globalSubmissions = [];
      for (const submission of submissions) {
        const challenge = await ChallengeService.getChallengeById(submission.challengeId);

        // Un défi est global si unitId est null, undefined, ou chaîne vide
        const isGlobalChallenge = !challenge?.unitId || challenge.unitId === '';

        if (challenge && isGlobalChallenge) {
          globalSubmissions.push(submission);
        }
      }

      return globalSubmissions;
    } catch (error) {
      console.error('Erreur lors de la récupération des soumissions WeCamp:', error);
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

  /**
   * Récupère les défis commencés (status STARTED) d'une unité
   * Pour les animateurs
   */
  static async getStartedSubmissions(
    unitId?: string
  ): Promise<ChallengeSubmission[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', ChallengeStatus.STARTED)
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
        // Trier par date de début (plus récent en premier)
        filteredSubmissions.sort((a, b) => {
          const dateA = a.startedAt ? a.startedAt.getTime() : 0;
          const dateB = b.startedAt ? b.startedAt.getTime() : 0;
          return dateB - dateA;
        });
        return filteredSubmissions;
      }

      // Trier par date de début (plus récent en premier)
      submissions.sort((a, b) => {
        const dateA = a.startedAt ? a.startedAt.getTime() : 0;
        const dateB = b.startedAt ? b.startedAt.getTime() : 0;
        return dateB - dateA;
      });

      return submissions;
    } catch (error) {
      console.error('Erreur lors de la récupération des défis commencés:', error);
      throw error;
    }
  }
}

