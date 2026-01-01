import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ChallengeSubmissionService } from '@/services/challenge-submission-service';
import { UnitService } from '@/services/unit-service';
import { HealthService } from '@/services/health-service';
import { DocumentService } from '@/services/document-service';
import { useAuth } from '@/context/auth-context';
import { ParentScoutService } from '@/services/parent-scout-service';
import { Animator, Parent } from '@/types';

/**
 * Interface pour le contexte de notifications
 */
interface NotificationContextType {
  // Animateur
  pendingChallengesCount: number;
  pendingScoutsCount: number;
  missingHealthRecordsCount: number;
  pendingAuthorizationsCount: number;
  totalNotificationsCount: number;
  // Parent
  parentPendingDocumentsCount: number;
  // Common
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
  const [parentPendingDocumentsCount, setParentPendingDocumentsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refreshAnimatorNotifications = async () => {
    // Vérifier que l'utilisateur est toujours authentifié avant de faire des requêtes
    if (!isAuthenticated || !user) {
      return;
    }

    const animator = user as Animator;
    if (!animator.unitId) {
      return;
    }

    try {
      // Récupérer le nombre de soumissions en attente
      const pendingSubmissions = await ChallengeSubmissionService.getPendingSubmissions(animator.unitId);
      // Vérifier encore l'authentification après chaque requête async
      if (!isAuthenticated) return;
      setPendingChallengesCount(pendingSubmissions.length);

      // Récupérer le nombre de scouts non validés
      const scouts = await UnitService.getScoutsByUnit(animator.unitId);
      if (!isAuthenticated) return;
      const unvalidatedScouts = scouts.filter((s: any) => !s.validated);
      setPendingScoutsCount(unvalidatedScouts.length);

      // Récupérer les IDs des scouts validés uniquement
      const validatedScouts = scouts.filter((s: any) => s.validated);
      const scoutIds = validatedScouts.map((s: any) => s.id);

      // Récupérer les statistiques de fiches santé
      try {
        if (!isAuthenticated) return;
        const healthStats = await HealthService.getUnitHealthStats(scoutIds);
        if (!isAuthenticated) return;
        // Comptabiliser les fiches manquantes + non signées
        setMissingHealthRecordsCount(healthStats.missing + healthStats.unsigned);
      } catch (error: any) {
        // Ignorer silencieusement les erreurs de permission (déconnexion en cours)
        if (error?.code !== 'permission-denied' && !error?.message?.includes('insufficient permissions')) {
          console.error('Erreur lors de la récupération des stats de santé:', error);
        }
        setMissingHealthRecordsCount(0);
      }

      // Récupérer les statistiques d'autorisations
      try {
        if (!isAuthenticated) return;
        const authStats = await DocumentService.getUnitAuthorizationStats(animator.unitId, scoutIds);
        if (!isAuthenticated) return;
        setPendingAuthorizationsCount(authStats.scoutsWithPendingDocs.length);
      } catch (error: any) {
        // Ignorer silencieusement les erreurs de permission (déconnexion en cours)
        if (error?.code !== 'permission-denied' && !error?.message?.includes('insufficient permissions')) {
          console.error('Erreur lors de la récupération des stats d\'autorisations:', error);
        }
        setPendingAuthorizationsCount(0);
      }
    } catch (error: any) {
      // Ignorer silencieusement les erreurs de permission (déconnexion en cours)
      if (error?.code !== 'permission-denied' && !error?.message?.includes('insufficient permissions')) {
        console.error('Erreur lors de la récupération des notifications animateur:', error);
      }
    }
  };

  const refreshParentNotifications = async () => {
    // Vérifier que l'utilisateur est toujours authentifié avant de faire des requêtes
    if (!isAuthenticated || !user) {
      return;
    }

    const parent = user as Parent;
    if (!parent.id) {
      return;
    }

    try {
      // Récupérer les scouts du parent
      const scouts = await ParentScoutService.getScoutsByParent(parent.id);
      if (!isAuthenticated) return;

      // Compter les documents en attente pour chaque scout
      let totalPendingDocs = 0;
      for (const scout of scouts) {
        if (!isAuthenticated) return;
        if (scout.unitId) {
          const pendingDocs = await DocumentService.getPendingDocumentsForScout(scout.id, scout.unitId);
          if (!isAuthenticated) return;
          totalPendingDocs += pendingDocs.length;
        }
      }
      setParentPendingDocumentsCount(totalPendingDocs);
    } catch (error: any) {
      // Ignorer silencieusement les erreurs de permission (déconnexion en cours)
      if (error?.code !== 'permission-denied' && !error?.message?.includes('insufficient permissions')) {
        console.error('Erreur lors de la récupération des notifications parent:', error);
      }
      setParentPendingDocumentsCount(0);
    }
  };

  const refreshNotifications = async () => {
    if (!isAuthenticated || !user) {
      setPendingChallengesCount(0);
      setPendingScoutsCount(0);
      setMissingHealthRecordsCount(0);
      setPendingAuthorizationsCount(0);
      setParentPendingDocumentsCount(0);
      return;
    }

    try {
      setIsLoading(true);

      if (user.role === 'animator') {
        await refreshAnimatorNotifications();
      } else if (user.role === 'parent') {
        await refreshParentNotifications();
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les notifications au démarrage et à chaque changement d'utilisateur
  useEffect(() => {
    if (isAuthenticated && (user?.role === 'animator' || user?.role === 'parent')) {
      refreshNotifications();
    } else {
      setPendingChallengesCount(0);
      setPendingScoutsCount(0);
      setMissingHealthRecordsCount(0);
      setPendingAuthorizationsCount(0);
      setParentPendingDocumentsCount(0);
    }
  }, [isAuthenticated, user?.id]);

  // Polling toutes les 30 secondes pour mettre à jour les notifications
  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'animator' && user?.role !== 'parent')) {
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
    parentPendingDocumentsCount,
    isLoading,
    refreshNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
