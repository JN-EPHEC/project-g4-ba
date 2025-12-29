import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Challenge, ChallengeSubmission, ChallengeStatus } from '@/types';
import { ChallengeService } from './challenge-service';
import { UnitService } from '@/services/unit-service';

export interface ChallengeKPI {
  totalChallenges: number;
  activeChallenges: number;
  totalParticipants: number;
  totalValidations: number;
  averageCompletionRate: number;
}

export interface ChallengeStats {
  challengeId: string;
  title: string;
  emoji: string;
  points: number;
  totalScouts: number;
  completedCount: number;
  pendingCount: number;
  completionRate: number;
  isActive: boolean;
}

export class ChallengeKPIService {
  private static readonly SUBMISSIONS_COLLECTION = 'challengeSubmissions';

  /**
   * Obtenir les stats globales pour une unité
   */
  static async getGlobalStats(unitId: string): Promise<ChallengeKPI> {
    try {
      // Récupérer tous les défis de l'unité
      const challenges = await ChallengeService.getChallengesByUnit(unitId);

      // Récupérer le nombre de scouts dans l'unité
      const scouts = await UnitService.getScoutsByUnit(unitId);
      const totalScouts = scouts.length;

      // Récupérer toutes les soumissions pour ces défis
      const challengeIds = challenges.map(c => c.id);
      let totalValidations = 0;
      let totalPending = 0;

      if (challengeIds.length > 0) {
        // Firestore limite les requêtes 'in' à 30 éléments
        const chunks = this.chunkArray(challengeIds, 30);

        for (const chunk of chunks) {
          const submissionsQuery = query(
            collection(db, this.SUBMISSIONS_COLLECTION),
            where('challengeId', 'in', chunk)
          );
          const snapshot = await getDocs(submissionsQuery);

          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === ChallengeStatus.COMPLETED) {
              totalValidations++;
            } else if (data.status === ChallengeStatus.PENDING_VALIDATION) {
              totalPending++;
            }
          });
        }
      }

      // Calculer les défis actifs
      const now = new Date();
      const activeChallenges = challenges.filter(c => {
        const start = new Date(c.startDate);
        const end = new Date(c.endDate);
        return now >= start && now <= end;
      });

      // Calculer le taux de complétion moyen
      const maxPossibleCompletions = challenges.length * totalScouts;
      const averageCompletionRate = maxPossibleCompletions > 0
        ? Math.round((totalValidations / maxPossibleCompletions) * 100)
        : 0;

      return {
        totalChallenges: challenges.length,
        activeChallenges: activeChallenges.length,
        totalParticipants: totalScouts,
        totalValidations,
        averageCompletionRate,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des stats globales:', error);
      throw error;
    }
  }

  /**
   * Obtenir les stats par défi
   */
  static async getChallengeStats(unitId: string): Promise<ChallengeStats[]> {
    try {
      const challenges = await ChallengeService.getChallengesByUnit(unitId);
      const scouts = await UnitService.getScoutsByUnit(unitId);
      const totalScouts = scouts.length;

      const statsPromises = challenges.map(async (challenge) => {
        // Récupérer les soumissions pour ce défi
        const submissionsQuery = query(
          collection(db, this.SUBMISSIONS_COLLECTION),
          where('challengeId', '==', challenge.id)
        );
        const snapshot = await getDocs(submissionsQuery);

        let completedCount = 0;
        let pendingCount = 0;

        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === ChallengeStatus.COMPLETED) {
            completedCount++;
          } else if (data.status === ChallengeStatus.PENDING_VALIDATION) {
            pendingCount++;
          }
        });

        const completionRate = totalScouts > 0
          ? Math.round((completedCount / totalScouts) * 100)
          : 0;

        const now = new Date();
        const start = new Date(challenge.startDate);
        const end = new Date(challenge.endDate);
        const isActive = now >= start && now <= end;

        return {
          challengeId: challenge.id,
          title: challenge.title,
          emoji: challenge.emoji || '🎯',
          points: challenge.points,
          totalScouts,
          completedCount,
          pendingCount,
          completionRate,
          isActive,
        };
      });

      return Promise.all(statsPromises);
    } catch (error) {
      console.error('Erreur lors de la récupération des stats par défi:', error);
      throw error;
    }
  }

  /**
   * Obtenir les défis les plus populaires
   */
  static async getPopularChallenges(unitId: string, limit: number = 5): Promise<ChallengeStats[]> {
    try {
      const stats = await this.getChallengeStats(unitId);

      // Trier par nombre de complétions (décroissant)
      return stats
        .sort((a, b) => b.completedCount - a.completedCount)
        .slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la récupération des défis populaires:', error);
      throw error;
    }
  }

  /**
   * Utilitaire pour diviser un tableau en chunks
   */
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
