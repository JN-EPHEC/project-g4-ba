import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ChallengeSubmissionService } from '@/services/challenge-submission-service';
import { UnitService } from '@/services/unit-service';
import { HealthService } from '@/services/health-service';
import { DocumentService } from '@/services/document-service';
import { useAuth } from '@/context/auth-context';
import { Animator } from '@/types';

/**
 * Interface pour le contexte de notifications
 */
interface NotificationContextType {
  pendingChallengesCount: number;
  pendingScoutsCount: number;
  missingHealthRecordsCount: number;
  pendingAuthorizationsCount: number;
  totalNotificationsCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
}

/**
 * Contexte de notifications
 */
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Hook personnalisé pour utiliser le contexte de notifications
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications doit être utilisé dans un NotificationProvider');
  }
  return context;
}

/**
 * Provider pour le contexte de notifications
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [pendingChallengesCount, setPendingChallengesCount] = useState(0);
  const [pendingScoutsCount, setPendingScoutsCount] = useState(0);
  const [missingHealthRecordsCount, setMissingHealthRecordsCount] = useState(0);
  const [pendingAuthorizationsCount, setPendingAuthorizationsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refreshNotifications = async () => {
    // Ne rien faire si l'utilisateur n'est pas connecté ou n'est pas un animateur
    if (!isAuthenticated || !user || user.role !== 'animator') {
      setPendingChallengesCount(0);
      setPendingScoutsCount(0);
      setMissingHealthRecordsCount(0);
      setPendingAuthorizationsCount(0);
      return;
    }

    const animator = user as Animator;
    if (!animator.unitId) {
      return;
    }

    try {
      setIsLoading(true);

      // Récupérer le nombre de soumissions en attente
      const pendingSubmissions = await ChallengeSubmissionService.getPendingSubmissions(animator.unitId);
      setPendingChallengesCount(pendingSubmissions.length);

      // Récupérer le nombre de scouts non validés
      const scouts = await UnitService.getScoutsByUnit(animator.unitId);
      const unvalidatedScouts = scouts.filter((s: any) => !s.validated);
      setPendingScoutsCount(unvalidatedScouts.length);

      // Récupérer les IDs des scouts validés uniquement
      const validatedScouts = scouts.filter((s: any) => s.validated);
      const scoutIds = validatedScouts.map((s: any) => s.id);

      // Récupérer les statistiques de fiches santé
      try {
        const healthStats = await HealthService.getUnitHealthStats(scoutIds);
        // Comptabiliser les fiches manquantes + non signées
        setMissingHealthRecordsCount(healthStats.missing + healthStats.unsigned);
      } catch (error) {
        console.error('Erreur lors de la récupération des stats de santé:', error);
        setMissingHealthRecordsCount(0);
      }

      // Récupérer les statistiques d'autorisations
      try {
        const authStats = await DocumentService.getUnitAuthorizationStats(animator.unitId, scoutIds);
        setPendingAuthorizationsCount(authStats.scoutsWithPendingDocs.length);
      } catch (error) {
        console.error('Erreur lors de la récupération des stats d\'autorisations:', error);
        setPendingAuthorizationsCount(0);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les notifications au démarrage et à chaque changement d'utilisateur
  useEffect(() => {
    if (isAuthenticated && user?.role === 'animator') {
      refreshNotifications();
    } else {
      setPendingChallengesCount(0);
      setPendingScoutsCount(0);
      setMissingHealthRecordsCount(0);
      setPendingAuthorizationsCount(0);
    }
  }, [isAuthenticated, user?.id]);

  // Polling toutes les 30 secondes pour mettre à jour les notifications
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'animator') {
      return;
    }

    const interval = setInterval(() => {
      refreshNotifications();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id]);

  // Calculer le total des notifications
  const totalNotificationsCount = pendingChallengesCount + pendingScoutsCount + missingHealthRecordsCount + pendingAuthorizationsCount;

  const value: NotificationContextType = {
    pendingChallengesCount,
    pendingScoutsCount,
    missingHealthRecordsCount,
    pendingAuthorizationsCount,
    totalNotificationsCount,
    isLoading,
    refreshNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
