import { useState, useEffect } from 'react';
import { ChallengeSubmission, ChallengeStatus } from '@/types';
import { ChallengeSubmissionService } from '../services/challenge-submission-service';
import { useAuth } from '@/context/auth-context';

export function useChallengeProgress(challengeId: string) {
  const { user } = useAuth();
  const [submission, setSubmission] = useState<ChallengeSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSubmission();
  }, [challengeId, user]);

  const loadSubmission = async () => {
    if (!user?.id || !challengeId) return;

    try {
      setLoading(true);
      setError(null);

      const existingSubmission = await ChallengeSubmissionService.getSubmissionByChallengeAndScout(
        challengeId,
        user.id
      );

      setSubmission(existingSubmission);
    } catch (err) {
      console.error('Erreur lors du chargement de la progression:', err);
      setError('Impossible de charger la progression');
    } finally {
      setLoading(false);
    }
  };

  const submitChallenge = async (proofImageUrl: string) => {
    if (!user?.id || !challengeId) return;

    try {
      setSubmitting(true);
      setError(null);

      const newSubmission = await ChallengeSubmissionService.submitChallenge(
        challengeId,
        user.id,
        proofImageUrl
      );

      setSubmission(newSubmission);
    } catch (err: any) {
      console.error('Erreur lors de la soumission:', err);
      setError(err.message || 'Impossible de soumettre le défi');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const isCompleted = submission?.status === ChallengeStatus.COMPLETED;
  const isPending = submission?.status === ChallengeStatus.PENDING_VALIDATION;
  const canSubmit = !submission || submission.status === ChallengeStatus.EXPIRED;

  return {
    submission,
    loading,
    error,
    submitting,
    submitChallenge,
    isCompleted,
    isPending,
    canSubmit,
    refetch: loadSubmission,
  };
}
