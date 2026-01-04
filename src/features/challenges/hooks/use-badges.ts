import { useState, useEffect, useCallback } from 'react';
import { BadgeService } from '@/services/badge-service';
import { BadgeWithDetails, Scout, UserRole } from '@/types';
import { useAuth } from '@/context/auth-context';
import { ChallengeSubmissionService } from '../services/challenge-submission-service';
import { ChallengeStatus } from '@/types';

interface UseBadgesOptions {
  scoutId?: string;
  autoRefresh?: boolean;
}

export function useBadges(options: UseBadgesOptions = {}) {
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Déterminer le scout ID et les infos
  const targetScoutId = options.scoutId || user?.id;
  const isScout = user?.role === UserRole.SCOUT;
  const scoutPoints = isScout ? (user as Scout).points || 0 : 0;

  const loadBadges = useCallback(async () => {
    if (!targetScoutId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Récupérer le nombre de défis complétés
      let completedChallengesCount = 0;
      try {
        const submissions = await ChallengeSubmissionService.getSubmissionsByScout(targetScoutId);
        completedChallengesCount = submissions.filter(s => s.status === ChallengeStatus.COMPLETED).length;
      } catch (err) {
        console.log('Could not fetch submissions count');
      }

      // Vérifier et attribuer les badges automatiques
      if (isScout) {
        await BadgeService.checkAndAwardAutomaticBadges(
          targetScoutId,
          scoutPoints,
          completedChallengesCount
        );
      }

      // Récupérer les badges avec détails
      const badgesWithDetails = await BadgeService.getBadgesWithDetailsForScout(
        targetScoutId,
        scoutPoints,
        completedChallengesCount
      );

      setBadges(badgesWithDetails);
    } catch (err) {
      console.error('Erreur lors du chargement des badges:', err);
      setError('Impossible de charger les badges');
    } finally {
      setLoading(false);
    }
  }, [targetScoutId, scoutPoints, isScout]);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const refetch = () => {
    loadBadges();
  };

  // Stats sur les badges
  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalCount = badges.length;

  // Convertir en format pour le composant BadgesGrid
  const badgesForGrid = badges.map(badge => ({
    id: badge.id,
    name: badge.name,
    icon: badge.icon,
    description: badge.description,
    unlocked: badge.unlocked,
    date: badge.unlockedAt
      ? badge.unlockedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      : undefined,
    progress: badge.progress,
  }));

  return {
    badges,
    badgesForGrid,
    unlockedCount,
    totalCount,
    loading,
    error,
    refetch,
  };
}
