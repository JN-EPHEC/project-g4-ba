import {
  collection,
  query,
  where,
  getDocs,
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
      // Récupérer tous les scouts de l'unité (sans orderBy pour éviter index composite)
      const q = query(
        collection(db, 'users'),
        where('unitId', '==', unitId),
        where('role', '==', UserRole.SCOUT)
      );

      const querySnapshot = await getDocs(q);
      const entries: LeaderboardEntry[] = [];

      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const scout = UserService.convertFirestoreUser({ id: doc.id, ...data });

        if (scout && scout.role === UserRole.SCOUT) {
          entries.push({
            rank: 0, // Will be set after sorting
            scout: scout as Scout,
            points: (scout as Scout).points || 0,
          });
        }
      });

      // Trier par points (plus élevé d'abord) côté client
      entries.sort((a, b) => b.points - a.points);

      // Assigner les rangs après le tri
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      // Appliquer la limite
      return entries.slice(0, limitCount);
    } catch (error) {
      console.error('Erreur lors de la récupération du classement:', error);
      return [];
    }
  }

  /**
   * Récupère le classement global (toutes unités confondues)
   */
  static async getGlobalLeaderboard(
    limitCount: number = 50
  ): Promise<LeaderboardEntry[]> {
    try {
      // Récupérer tous les scouts (sans orderBy pour éviter index composite)
      const q = query(
        collection(db, 'users'),
        where('role', '==', UserRole.SCOUT)
      );

      const querySnapshot = await getDocs(q);
      const entries: LeaderboardEntry[] = [];

      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const scout = UserService.convertFirestoreUser({ id: doc.id, ...data });

        if (scout && scout.role === UserRole.SCOUT) {
          entries.push({
            rank: 0, // Will be set after sorting
            scout: scout as Scout,
            points: (scout as Scout).points || 0,
          });
        }
      });

      // Trier par points (plus élevé d'abord) côté client
      entries.sort((a, b) => b.points - a.points);

      // Assigner les rangs après le tri
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      // Appliquer la limite
      return entries.slice(0, limitCount);
    } catch (error) {
      console.error('Erreur lors de la récupération du classement global:', error);
      return [];
    }
  }

  /**
   * Récupère le rang d'un scout dans son unité
   */
  static async getScoutRank(scoutId: string, unitId: string): Promise<number> {
    try {
      const leaderboard = await this.getLeaderboardByUnit(unitId, 1000);

      if (leaderboard.length === 0) {
        return 1; // Si pas de classement, le scout est premier
      }

      const entry = leaderboard.find((e) => e.scout.id === scoutId);
      return entry?.rank || 1; // Retourne le rang ou 1 par défaut
    } catch (error) {
      console.error('Erreur lors de la récupération du rang:', error);
      return 1; // En cas d'erreur, retourne 1
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

