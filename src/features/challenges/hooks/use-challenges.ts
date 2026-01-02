import { useState, useEffect } from 'react';
import { Challenge, UserRole } from '@/types';
import { ChallengeService } from '../services/challenge-service';
import { useAuth } from '@/context/auth-context';

export function useChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get unitId from user (only Scout and Animator have unitId)
  const userUnitId = user && 'unitId' in user ? user.unitId : undefined;
  const isScout = user?.role === UserRole.SCOUT || user?.role === 'scout';

  useEffect(() => {
    loadChallenges();
  }, [user]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer tous les défis
      const allChallenges = await ChallengeService.getChallenges(userUnitId);
      console.log('[useChallenges] Loaded challenges:', allChallenges.map(c => ({ id: c.id, title: c.title, isArchived: c.isArchived })));

      // Pour les scouts, masquer les défis expirés (endDate passée)
      const visibleChallenges = isScout
        ? allChallenges.filter(c => new Date(c.endDate) >= new Date())
        : allChallenges;

      setChallenges(visibleChallenges);
    } catch (err) {
      console.error('Erreur lors du chargement des défis:', err);
      setError('Impossible de charger les défis');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    loadChallenges();
  };

  return {
    challenges,
    loading,
    error,
    refetch,
  };
}
