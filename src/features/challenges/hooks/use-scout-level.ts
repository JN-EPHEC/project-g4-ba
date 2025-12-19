import { useState, useEffect, useCallback } from 'react';
import { LevelService } from '@/services/level-service';
import { ScoutLevelInfo } from '@/types';

interface UseScoutLevelOptions {
  points: number;
  autoRefresh?: boolean;
}

export function useScoutLevel(options: UseScoutLevelOptions) {
  const { points, autoRefresh = false } = options;
  const [levelInfo, setLevelInfo] = useState<ScoutLevelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLevelInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const info = await LevelService.getScoutLevelInfo(points);
      setLevelInfo(info);
    } catch (err) {
      console.error('Erreur lors du chargement du niveau:', err);
      setError('Impossible de charger les informations de niveau');

      // Fallback sur la version synchrone
      const syncInfo = LevelService.getScoutLevelInfoSync(points);
      setLevelInfo(syncInfo);
    } finally {
      setLoading(false);
    }
  }, [points]);

  useEffect(() => {
    loadLevelInfo();
  }, [loadLevelInfo]);

  const refetch = () => {
    LevelService.invalidateCache();
    loadLevelInfo();
  };

  // Valeurs par défaut pour le rendu pendant le chargement
  const syncFallback = LevelService.getScoutLevelInfoSync(points);

  return {
    levelInfo: levelInfo || syncFallback,
    currentLevel: levelInfo?.currentLevel || syncFallback.currentLevel,
    nextLevel: levelInfo?.nextLevel || syncFallback.nextLevel,
    progress: levelInfo?.progress ?? syncFallback.progress,
    pointsToNextLevel: levelInfo?.pointsToNextLevel ?? syncFallback.pointsToNextLevel,
    isMaxLevel: levelInfo?.isMaxLevel ?? syncFallback.isMaxLevel,
    loading,
    error,
    refetch,
  };
}
