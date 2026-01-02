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
  const [starting, setStarting] = useState(false);

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

  /**
   * Commence le défi (crée une soumission avec status STARTED)
   */
  const startChallenge = async () => {
    if (!user?.id || !challengeId) return;

    try {
      setStarting(true);
      setError(null);

      const newSubmission = await ChallengeSubmissionService.startChallenge(
        challengeId,
        user.id
      );

      setSubmission(newSubmission);
    } catch (err: any) {
      console.error('Erreur lors du démarrage du défi:', err);
      setError(err.message || 'Impossible de commencer le défi');
      throw err;
    } finally {
      setStarting(false);
    }
  };

  /**
   * Soumet le défi avec une preuve
   */
  const submitChallenge = async (scoutComment: string, proofImageUrl?: string) => {
    if (!user?.id || !challengeId) return;

    try {
      setSubmitting(true);
      setError(null);

      const newSubmission = await ChallengeSubmissionService.submitChallenge(
        challengeId,
        user.id,
        scoutComment,
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
  const isStarted = submission?.status === ChallengeStatus.STARTED;
  const isExpired = submission?.status === ChallengeStatus.EXPIRED;

  // Peut commencer si pas de soumission ou si précédemment rejeté
  const canStart = !submission || isExpired;
  // Peut soumettre si commencé ou si pas de soumission/expiré
  const canSubmit = isStarted || canStart;

  return {
    submission,
    loading,
    error,
    submitting,
    starting,
    startChallenge,
    submitChallenge,
    isCompleted,
    isPending,
    isStarted,
    isExpired,
    canStart,
    canSubmit,
    refetch: loadSubmission,
  };
}
