import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ChallengeStatus, UserRole } from '@/types';

export interface ChallengeStats {
  challengeId: string;
  title: string;
  emoji: string;
  totalParticipants: number;
  completed: number;
  pending: number;
  started: number;
}

export interface UnitStats {
  unitId: string;
  unitName: string;
  category: string;
  accessCode?: string;
  totalScouts: number;
  totalAnimators: number;
  totalMembers: number;
  totalChallengesCompleted: number;
  totalChallengesStarted: number;
  totalPoints: number;
  activeScouts: number;
  createdAt?: Date;
}

export interface GlobalStats {
  totalUnits: number;
  totalScouts: number;
  totalAnimators: number;
  totalMembers: number;
  totalChallengesCompleted: number;
  totalChallengesStarted: number;
  totalPendingValidations: number;
}

/**
 * Service pour récupérer les statistiques admin WeCamp
 */
export class AdminStatsService {
  /**
   * Récupère les statistiques globales
   */
  static async getGlobalStats(): Promise<GlobalStats> {
    try {
      // Compter les unités
      const unitsSnapshot = await getDocs(collection(db, 'units'));
      const totalUnits = unitsSnapshot.size;

      // Compter les scouts
      const scoutsQuery = query(
        collection(db, 'users'),
        where('role', '==', UserRole.SCOUT)
      );
      const scoutsSnapshot = await getDocs(scoutsQuery);
      const totalScouts = scoutsSnapshot.size;

      // Compter les animateurs
      const animatorsQuery = query(
        collection(db, 'users'),
        where('role', '==', UserRole.ANIMATOR)
      );
      const animatorsSnapshot = await getDocs(animatorsQuery);
      const totalAnimators = animatorsSnapshot.size;

      // Compter les soumissions par statut
      const submissionsSnapshot = await getDocs(collection(db, 'challengeSubmissions'));
      let totalChallengesCompleted = 0;
      let totalChallengesStarted = 0;
      let totalPendingValidations = 0;

      submissionsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        switch (data.status) {
          case ChallengeStatus.COMPLETED:
            totalChallengesCompleted++;
            break;
          case ChallengeStatus.STARTED:
            totalChallengesStarted++;
            break;
          case ChallengeStatus.PENDING_VALIDATION:
            totalPendingValidations++;
            break;
        }
      });

      return {
        totalUnits,
        totalScouts,
        totalAnimators,
        totalMembers: totalScouts + totalAnimators,
        totalChallengesCompleted,
        totalChallengesStarted,
        totalPendingValidations,
      };
    } catch (error) {
      console.error('Erreur getGlobalStats:', error);
      return {
        totalUnits: 0,
        totalScouts: 0,
        totalAnimators: 0,
        totalMembers: 0,
        totalChallengesCompleted: 0,
        totalChallengesStarted: 0,
        totalPendingValidations: 0,
      };
    }
  }

  /**
   * Récupère les stats de participation par défi
   */
  static async getChallengeStats(): Promise<ChallengeStats[]> {
    try {
      // Récupérer les défis globaux
      const challengesQuery = query(
        collection(db, 'challenges'),
        where('unitId', '==', null)
      );
      const challengesSnapshot = await getDocs(challengesQuery);

      // Récupérer toutes les soumissions
      const submissionsSnapshot = await getDocs(collection(db, 'challengeSubmissions'));
      const submissionsByChallenge = new Map<string, { completed: number; pending: number; started: number }>();

      submissionsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const challengeId = data.challengeId;

        if (!submissionsByChallenge.has(challengeId)) {
          submissionsByChallenge.set(challengeId, { completed: 0, pending: 0, started: 0 });
        }

        const stats = submissionsByChallenge.get(challengeId)!;
        switch (data.status) {
          case ChallengeStatus.COMPLETED:
            stats.completed++;
            break;
          case ChallengeStatus.PENDING_VALIDATION:
            stats.pending++;
            break;
          case ChallengeStatus.STARTED:
            stats.started++;
            break;
        }
      });

      return challengesSnapshot.docs.map((doc) => {
        const data = doc.data();
        const stats = submissionsByChallenge.get(doc.id) || { completed: 0, pending: 0, started: 0 };

        return {
          challengeId: doc.id,
          title: data.title,
          emoji: data.emoji || '🎯',
          totalParticipants: stats.completed + stats.pending + stats.started,
          completed: stats.completed,
          pending: stats.pending,
          started: stats.started,
        };
      }).sort((a, b) => b.totalParticipants - a.totalParticipants);
    } catch (error) {
      console.error('Erreur getChallengeStats:', error);
      return [];
    }
  }

  /**
   * Récupère le classement des unités les plus actives
   */
  static async getUnitRanking(): Promise<UnitStats[]> {
    try {
      // Récupérer toutes les unités
      const unitsSnapshot = await getDocs(collection(db, 'units'));
      const units = new Map<string, { name: string; category: string; accessCode?: string; createdAt?: Date }>();

      unitsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        units.set(doc.id, {
          name: data.name,
          category: data.category || 'Autre',
          accessCode: data.accessCode,
          createdAt: data.createdAt?.toDate(),
        });
      });

      // Récupérer tous les utilisateurs (scouts et animateurs)
      const usersSnapshot = await getDocs(collection(db, 'users'));

      const membersByUnit = new Map<string, {
        scouts: number;
        animators: number;
        totalPoints: number;
        scoutIds: string[];
      }>();

      // Initialiser toutes les unités avec des valeurs par défaut
      units.forEach((_, unitId) => {
        membersByUnit.set(unitId, { scouts: 0, animators: 0, totalPoints: 0, scoutIds: [] });
      });

      usersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const unitId = data.unitId;
        const role = data.role;

        if (unitId && units.has(unitId)) {
          const unitStats = membersByUnit.get(unitId)!;

          if (role === UserRole.SCOUT || role === 'scout') {
            unitStats.scouts++;
            unitStats.totalPoints += data.points || 0;
            unitStats.scoutIds.push(doc.id);
          } else if (role === UserRole.ANIMATOR || role === 'animator') {
            unitStats.animators++;
          }
        }
      });

      // Récupérer toutes les soumissions
      const submissionsSnapshot = await getDocs(collection(db, 'challengeSubmissions'));
      const submissionsByScout = new Map<string, { completed: number; started: number }>();

      submissionsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const scoutId = data.scoutId;

        if (!submissionsByScout.has(scoutId)) {
          submissionsByScout.set(scoutId, { completed: 0, started: 0 });
        }

        const stats = submissionsByScout.get(scoutId)!;
        if (data.status === ChallengeStatus.COMPLETED) {
          stats.completed++;
        } else if (data.status === ChallengeStatus.STARTED || data.status === ChallengeStatus.PENDING_VALIDATION) {
          stats.started++;
        }
      });

      // Construire les stats par unité
      const unitStats: UnitStats[] = [];

      units.forEach((unitInfo, unitId) => {
        const memberInfo = membersByUnit.get(unitId) || { scouts: 0, animators: 0, totalPoints: 0, scoutIds: [] };

        let totalCompleted = 0;
        let totalStarted = 0;
        let activeScouts = 0;

        memberInfo.scoutIds.forEach((scoutId) => {
          const scoutStats = submissionsByScout.get(scoutId);
          if (scoutStats) {
            totalCompleted += scoutStats.completed;
            totalStarted += scoutStats.started;
            if (scoutStats.completed > 0 || scoutStats.started > 0) {
              activeScouts++;
            }
          }
        });

        unitStats.push({
          unitId,
          unitName: unitInfo.name,
          category: unitInfo.category,
          accessCode: unitInfo.accessCode,
          totalScouts: memberInfo.scouts,
          totalAnimators: memberInfo.animators,
          totalMembers: memberInfo.scouts + memberInfo.animators,
          totalChallengesCompleted: totalCompleted,
          totalChallengesStarted: totalStarted,
          totalPoints: memberInfo.totalPoints,
          activeScouts,
          createdAt: unitInfo.createdAt,
        });
      });

      // Trier par défis complétés, puis par points, puis par membres
      return unitStats.sort((a, b) => {
        if (b.totalChallengesCompleted !== a.totalChallengesCompleted) {
          return b.totalChallengesCompleted - a.totalChallengesCompleted;
        }
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        return b.totalMembers - a.totalMembers;
      });
    } catch (error) {
      console.error('Erreur getUnitRanking:', error);
      return [];
    }
  }
}
