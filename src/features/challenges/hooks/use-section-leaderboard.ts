import { useState, useEffect, useCallback } from 'react';
import { LeaderboardService, SectionLeaderboardEntry } from '@/services/leaderboard-service';
import { useAuth } from '@/context/auth-context';
import { SECTION_EMOJIS, SectionType } from '@/types';

/**
 * Interface pour une section dans le leaderboard UI
 */
export interface SectionLeaderboardItem {
  id: string;
  name: string;
  totalPoints: number;
  scoutsCount: number;
  averagePoints: number;
  logo: string;              // URL du logo ou emoji
  logoUrl?: string;          // URL du logo si disponible
  sectionType: SectionType;
  isMySection: boolean;
}

/**
 * Convertit une SectionLeaderboardEntry en SectionLeaderboardItem pour l'UI
 */
function convertToLeaderboardItem(entry: SectionLeaderboardEntry): SectionLeaderboardItem {
  const section = entry.section;
  return {
    id: section.id,
    name: section.name,
    totalPoints: entry.totalPoints,
    scoutsCount: entry.scoutsCount,
    averagePoints: entry.averagePoints,
    logo: section.logoUrl || SECTION_EMOJIS[section.sectionType] || '🏕️',
    logoUrl: section.logoUrl,
    sectionType: section.sectionType,
    isMySection: entry.isMySection || false,
  };
}

interface UseSectionLeaderboardOptions {
  unitId?: string;
}

export function useSectionLeaderboard(options: UseSectionLeaderboardOptions = {}) {
  const { user } = useAuth();
  const [sectionLeaderboard, setSectionLeaderboard] = useState<SectionLeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get unitId and sectionId from user
  const userUnitId = user && 'unitId' in user ? user.unitId : undefined;
  const userSectionId = user && 'sectionId' in user ? (user as any).sectionId : undefined;

  const loadSectionLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const unitId = options.unitId || userUnitId;

      if (!unitId) {
        setSectionLeaderboard([]);
        return;
      }

      const entries = await LeaderboardService.getLeaderboardBySections(unitId, userSectionId);

      // Convertir les entrées pour l'UI
      const items = entries.map(entry => convertToLeaderboardItem(entry));
      setSectionLeaderboard(items);
    } catch (err) {
      console.error('Erreur lors du chargement du classement par sections:', err);
      setError('Impossible de charger le classement des sections');
    } finally {
      setLoading(false);
    }
  }, [options.unitId, userUnitId, userSectionId]);

  useEffect(() => {
    loadSectionLeaderboard();
  }, [loadSectionLeaderboard]);

  const refetch = () => {
    loadSectionLeaderboard();
  };

  // Obtenir les 3 premières sections pour le podium
  const podiumSections = sectionLeaderboard.slice(0, 3);

  // Obtenir les autres (à partir de la 4ème)
  const otherSections = sectionLeaderboard.slice(3);

  // Obtenir le rang de ma section
  const mySectionEntry = sectionLeaderboard.find(s => s.isMySection);
  const mySectionRank = mySectionEntry ? sectionLeaderboard.indexOf(mySectionEntry) + 1 : null;

  return {
    sectionLeaderboard,
    podiumSections,
    otherSections,
    mySectionRank,
    loading,
    error,
    refetch,
  };
}
