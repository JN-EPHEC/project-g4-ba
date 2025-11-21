import { useState, useEffect } from 'react';
import { Challenge } from '@/types';
import { ChallengeService } from '../services/challenge-service';
import { useAuth } from '@/context/auth-context';

export function useChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChallenges();
  }, [user]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les défis actifs
      const unitId = user?.unitId;
      const activeChallenges = await ChallengeService.getActiveChallenges(unitId);

      setChallenges(activeChallenges);
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
