import { useState, useEffect, useCallback } from 'react';
import { LeaderboardService, LeaderboardEntry } from '@/services/leaderboard-service';
import { useAuth } from '@/context/auth-context';
import { LeaderboardUser } from '../components/leaderboard-podium';

/**
 * Avatars disponibles pour les scouts
 */
const AVATARS = ['🦊', '🦁', '🦉', '🐺', '🦋', '🦌', '🐻', '🐼', '🦅', '🐬', '🦎', '🐢'];

/**
 * Génère un avatar basé sur l'ID de l'utilisateur
 */
function getAvatarForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return AVATARS[Math.abs(hash) % AVATARS.length];
}

/**
 * Convertit une LeaderboardEntry en LeaderboardUser pour les composants UI
 */
function convertToLeaderboardUser(entry: LeaderboardEntry, currentUserId?: string): LeaderboardUser {
  const scout = entry.scout;
  return {
    id: scout.id,
    name: `${scout.firstName} ${scout.lastName.charAt(0)}.`,
    points: entry.points,
    avatar: scout.totemEmoji || getAvatarForUser(scout.id),
    profilePicture: scout.profilePicture,
    streak: (scout as any).streak || 0,
    isMe: scout.id === currentUserId,
  };
}

interface UseLeaderboardOptions {
  unitId?: string;
  maxResults?: number;
}

export function useLeaderboard(options: UseLeaderboardOptions = {}) {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get unitId from user (only Scout and Animator have unitId)
  const userUnitId = user && 'unitId' in user ? user.unitId : undefined;

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const unitId = options.unitId || userUnitId;
      let entries: LeaderboardEntry[] = [];

      if (unitId) {
        entries = await LeaderboardService.getLeaderboardByUnit(unitId, options.maxResults || 50);
      } else {
        entries = await LeaderboardService.getGlobalLeaderboard(options.maxResults || 50);
      }

      // Convertir les entrées en LeaderboardUser pour les composants UI
      const users = entries.map(entry => convertToLeaderboardUser(entry, user?.id));
      setLeaderboard(users);
    } catch (err) {
      console.error('Erreur lors du chargement du classement:', err);
      setError('Impossible de charger le classement');
    } finally {
      setLoading(false);
    }
  }, [options.unitId, options.maxResults, user?.id, userUnitId]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const refetch = () => {
    loadLeaderboard();
  };

  // Obtenir le rang de l'utilisateur actuel
  const currentUserEntry = leaderboard.find(entry => entry.isMe);
  const currentUserRank = currentUserEntry ? leaderboard.indexOf(currentUserEntry) + 1 : null;

  // Obtenir les 3 premiers pour le podium
  const podiumUsers = leaderboard.slice(0, 3);

  // Obtenir les autres (à partir du 4ème)
  const otherUsers = leaderboard.slice(3);

  return {
    leaderboard,
    podiumUsers,
    otherUsers,
    currentUserRank,
    loading,
    error,
    refetch,
  };
}
