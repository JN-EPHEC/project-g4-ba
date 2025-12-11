import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Challenge, ChallengeDifficulty, ChallengeStatus } from '@/types';

/**
 * Service pour gérer les défis
 */
export class ChallengeService {
  private static readonly COLLECTION_NAME = 'challenges';

  /**
   * Convertit un document Firestore en défi
   */
  private static convertChallenge(data: DocumentData): Challenge {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      points: data.points,
      difficulty: data.difficulty as ChallengeDifficulty,
      category: data.category,
      emoji: data.emoji,
      unitId: data.unitId,
      imageUrl: data.imageUrl,
      startDate: data.startDate?.toDate() || new Date(),
      endDate: data.endDate?.toDate() || new Date(),
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate() || new Date(),
      participantsCount: data.participantsCount || 0,
      isGlobal: data.isGlobal || false,
      allowMultipleValidations: data.allowMultipleValidations || false,
      notifyMembers: data.notifyMembers !== false,
    };
  }

  /**
   * Crée un nouveau défi
   */
  static async createChallenge(
    title: string,
    description: string,
    points: number,
    difficulty: ChallengeDifficulty,
    startDate: Date,
    endDate: Date,
    createdBy: string,
    unitId?: string,
    imageUrl?: string
  ): Promise<Challenge> {
    try {
      const challengeData = {
        title,
        description,
        points,
        difficulty,
        unitId: unitId || null,
        imageUrl,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        createdBy,
        createdAt: Timestamp.fromDate(new Date()),
      };

      const challengeRef = doc(collection(db, this.COLLECTION_NAME));
      await setDoc(challengeRef, challengeData);

      return this.convertChallenge({ id: challengeRef.id, ...challengeData });
    } catch (error) {
      console.error('Erreur lors de la création du défi:', error);
      throw error;
    }
  }

  /**
   * Récupère un défi par son ID
   */
  static async getChallengeById(challengeId: string): Promise<Challenge | null> {
    try {
      const challengeDoc = await getDoc(
        doc(db, this.COLLECTION_NAME, challengeId)
      );

      if (!challengeDoc.exists()) {
        return null;
      }

      return this.convertChallenge({
        id: challengeDoc.id,
        ...challengeDoc.data(),
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du défi:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les défis disponibles
   */
  static async getChallenges(unitId?: string): Promise<Challenge[]> {
    try {
      if (unitId) {
        // Récupérer les défis de l'unité et les défis globaux séparément
        // pour éviter de nécessiter un index composite
        const q1 = query(
          collection(db, this.COLLECTION_NAME),
          where('unitId', '==', unitId)
        );
        const q2 = query(
          collection(db, this.COLLECTION_NAME),
          where('unitId', '==', null)
        );

        const [snapshot1, snapshot2] = await Promise.all([
          getDocs(q1),
          getDocs(q2),
        ]);

        const challenges = [
          ...snapshot1.docs.map((doc) =>
            this.convertChallenge({ id: doc.id, ...doc.data() })
          ),
          ...snapshot2.docs.map((doc) =>
            this.convertChallenge({ id: doc.id, ...doc.data() })
          ),
        ];

        // Trier par date de création (le plus récent en premier)
        return challenges.sort((a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime()
        );
      } else {
        // Tous les défis généraux
        const q = query(
          collection(db, this.COLLECTION_NAME),
          where('unitId', '==', null)
        );

        const querySnapshot = await getDocs(q);
        const challenges = querySnapshot.docs.map((doc) =>
          this.convertChallenge({ id: doc.id, ...doc.data() })
        );

        // Trier par date de création
        return challenges.sort((a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime()
        );
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des défis:', error);
      // Retourner un tableau vide au lieu de throw pour éviter de casser l'UI
      return [];
    }
  }

  /**
   * Récupère les défis d'une unité spécifique
   */
  static async getChallengesByUnit(unitId: string): Promise<Challenge[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('unitId', '==', unitId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) =>
        this.convertChallenge({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des défis de l\'unité:', error);
      throw error;
    }
  }

  /**
   * Récupère les défis actifs (entre startDate et endDate)
   */
  static async getActiveChallenges(unitId?: string): Promise<Challenge[]> {
    try {
      const now = Timestamp.fromDate(new Date());
      const allChallenges = await this.getChallenges(unitId);

      return allChallenges.filter((challenge) => {
        const start = Timestamp.fromDate(challenge.startDate);
        const end = Timestamp.fromDate(challenge.endDate);
        return now >= start && now <= end;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des défis actifs:', error);
      // Retourner un tableau vide au lieu de throw pour éviter de casser l'UI
      return [];
    }
  }

  /**
   * Met à jour un défi
   */
  static async updateChallenge(
    challengeId: string,
    updates: Partial<
      Omit<
        Challenge,
        'id' | 'createdAt' | 'createdBy'
      >
    >
  ): Promise<void> {
    try {
      const challengeRef = doc(db, this.COLLECTION_NAME, challengeId);
      const firestoreUpdates: any = { ...updates };

      // Convertir les dates en Timestamp
      if (firestoreUpdates.startDate instanceof Date) {
        firestoreUpdates.startDate = Timestamp.fromDate(firestoreUpdates.startDate);
      }
      if (firestoreUpdates.endDate instanceof Date) {
        firestoreUpdates.endDate = Timestamp.fromDate(firestoreUpdates.endDate);
      }

      await updateDoc(challengeRef, firestoreUpdates);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du défi:', error);
      throw error;
    }
  }

  /**
   * Supprime un défi
   */
  static async deleteChallenge(challengeId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION_NAME, challengeId));
    } catch (error) {
      console.error('Erreur lors de la suppression du défi:', error);
      throw error;
    }
  }

  /**
   * Récupère les défis créés par un utilisateur
   */
  static async getChallengesByCreator(createdBy: string): Promise<Challenge[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('createdBy', '==', createdBy),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) =>
        this.convertChallenge({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des défis du créateur:', error);
      throw error;
    }
  }
}

