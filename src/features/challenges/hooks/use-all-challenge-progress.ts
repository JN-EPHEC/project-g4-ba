import { useState, useEffect } from 'react';
import { ChallengeSubmission, ChallengeStatus } from '@/types';
import { ChallengeSubmissionService } from '../services/challenge-submission-service';
import { useAuth } from '@/context/auth-context';

/**
 * Hook pour récupérer toutes les progressions de défis d'un utilisateur
 */
export function useAllChallengeProgress() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, [user]);

  const loadSubmissions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const userSubmissions = await ChallengeSubmissionService.getSubmissionsByScout(user.id);
      setSubmissions(userSubmissions);
    } catch (err) {
      console.error('Erreur lors du chargement des progressions:', err);
      setError('Impossible de charger les progressions');
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionForChallenge = (challengeId: string) => {
    return submissions.find((sub) => sub.challengeId === challengeId);
  };

  const isCompleted = (challengeId: string) => {
    const submission = getSubmissionForChallenge(challengeId);
    return submission?.status === ChallengeStatus.COMPLETED;
  };

  const isPending = (challengeId: string) => {
    const submission = getSubmissionForChallenge(challengeId);
    return submission?.status === ChallengeStatus.PENDING_VALIDATION;
  };

  const completedCount = submissions.filter(
    (sub) => sub.status === ChallengeStatus.COMPLETED
  ).length;

  return {
    submissions,
    loading,
    error,
    completedCount,
    getSubmissionForChallenge,
    isCompleted,
    isPending,
    refetch: loadSubmissions,
  };
}
