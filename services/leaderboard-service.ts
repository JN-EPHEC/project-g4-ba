import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { UserService } from './user-service';
import { Scout, UserRole } from '@/types';

/**
 * Interface pour une entrée du classement
 */
export interface LeaderboardEntry {
  rank: number;
  scout: Scout;
  points: number;
}

/**
 * Service pour gérer le classement des scouts
 */
export class LeaderboardService {
  /**
   * Récupère le classement d'une unité
   */
  static async getLeaderboardByUnit(
    unitId: string,
    limitCount: number = 50
  ): Promise<LeaderboardEntry[]> {
    try {
      // Récupérer tous les scouts de l'unité
      const q = query(
        collection(db, 'users'),
        where('unitId', '==', unitId),
        where('role', '==', UserRole.SCOUT),
        orderBy('points', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const entries: LeaderboardEntry[] = [];

      querySnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        const scout = UserService.convertFirestoreUser({ id: doc.id, ...data });

        if (scout && scout.role === UserRole.SCOUT) {
          entries.push({
            rank: index + 1,
            scout: scout as Scout,
            points: scout.points || 0,
          });
        }
      });

      return entries;
    } catch (error) {
      console.error('Erreur lors de la récupération du classement:', error);
      throw error;
    }
  }

  /**
   * Récupère le classement global (toutes unités confondues)
   */
  static async getGlobalLeaderboard(
    limitCount: number = 50
  ): Promise<LeaderboardEntry[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', UserRole.SCOUT),
        orderBy('points', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const entries: LeaderboardEntry[] = [];

      querySnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        const scout = UserService.convertFirestoreUser({ id: doc.id, ...data });

        if (scout && scout.role === UserRole.SCOUT) {
          entries.push({
            rank: index + 1,
            scout: scout as Scout,
            points: scout.points || 0,
          });
        }
      });

      return entries;
    } catch (error) {
      console.error('Erreur lors de la récupération du classement global:', error);
      throw error;
    }
  }

  /**
   * Récupère le rang d'un scout dans son unité
   */
  static async getScoutRank(scoutId: string, unitId: string): Promise<number> {
    try {
      const leaderboard = await this.getLeaderboardByUnit(unitId, 1000);
      const scoutIndex = leaderboard.findIndex((entry) => entry.scout.id === scoutId);
      return scoutIndex >= 0 ? scoutIndex + 1 : 0;
    } catch (error) {
      console.error('Erreur lors de la récupération du rang:', error);
      throw error;
    }
  }

  /**
   * Calcule et met à jour les rangs de tous les scouts d'une unité
   */
  static async calculateRankings(unitId: string): Promise<void> {
    try {
      const leaderboard = await this.getLeaderboardByUnit(unitId, 1000);
      
      // Mettre à jour les rangs dans Firestore
      // Note: Cette opération peut être coûteuse, à utiliser avec modération
      for (const entry of leaderboard) {
        await UserService.updateUser(entry.scout.id, { rank: entry.rank.toString() });
      }
    } catch (error) {
      console.error('Erreur lors du calcul des rangs:', error);
      throw error;
    }
  }
}

