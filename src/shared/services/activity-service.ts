import {
  collection,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export type ActivityType =
  | 'event_created'
  | 'challenge_created'
  | 'challenge_validated'
  | 'challenge_submitted'
  | 'message_posted'
  | 'file_uploaded'
  | 'folder_created';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  authorId: string;
  authorName?: string;
  unitId: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  event_created: 'calendar',
  challenge_created: 'trophy',
  challenge_validated: 'checkmark-circle',
  challenge_submitted: 'camera',
  message_posted: 'chatbubble',
  file_uploaded: 'document',
  folder_created: 'folder',
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  event_created: '#3b82f6',
  challenge_created: '#f97316',
  challenge_validated: '#22c55e',
  challenge_submitted: '#8b5cf6',
  message_posted: '#06b6d4',
  file_uploaded: '#ec4899',
  folder_created: '#eab308',
};

export class ActivityService {
  /**
   * Récupérer les activités récentes d'une unité
   * Agrège les données de plusieurs collections
   * Note: Les requêtes sont simplifiées pour éviter les index composites
   */
  static async getRecentActivities(unitId: string, activityLimit = 10): Promise<Activity[]> {
    const activities: Activity[] = [];

    try {
      // Récupérer les événements récents (sans orderBy pour éviter index composite)
      const eventsQuery = query(
        collection(db, 'events'),
        where('unitId', '==', unitId),
        limit(10)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      eventsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: `event_${doc.id}`,
          type: 'event_created',
          title: data.title,
          description: `Nouvel événement créé`,
          authorId: data.createdBy || '',
          unitId,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      // Récupérer les défis récents (sans orderBy pour éviter index composite)
      const challengesQuery = query(
        collection(db, 'challenges'),
        where('unitId', '==', unitId),
        limit(10)
      );
      const challengesSnapshot = await getDocs(challengesQuery);
      challengesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: `challenge_${doc.id}`,
          type: 'challenge_created',
          title: data.title,
          description: `Nouveau défi disponible`,
          authorId: data.createdBy || '',
          unitId,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      // Récupérer les soumissions de défis récentes (validées ou completed)
      const submissionsQuery = query(
        collection(db, 'challengeSubmissions'),
        where('status', '==', 'completed'),
        limit(10)
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);

      // Importer UserService et ChallengeService pour enrichir les données
      const { UserService } = await import('@/services/user-service');
      const { ChallengeService } = await import('@/services/challenge-service');

      for (const doc of submissionsSnapshot.docs) {
        const data = doc.data();
        // Vérifier que le scout appartient à l'unité
        const scout = await UserService.getUserById(data.scoutId);
        if (scout && 'unitId' in scout && scout.unitId === unitId) {
          const challenge = await ChallengeService.getChallengeById(data.challengeId);
          activities.push({
            id: `submission_${doc.id}`,
            type: 'challenge_validated',
            title: challenge?.title || 'Défi validé',
            description: `${scout.firstName} a complété le défi`,
            authorId: data.scoutId || '',
            authorName: `${scout.firstName} ${scout.lastName}`,
            unitId,
            createdAt: data.validatedAt?.toDate() || data.submittedAt?.toDate() || new Date(),
          });
        }
      }

      // Récupérer les canaux de l'unité pour les messages
      const { ChannelService } = await import('@/src/shared/services/channel-service');
      const channels = await ChannelService.getChannelsByUnit(unitId);

      // Pour chaque canal, récupérer les derniers messages
      for (const channel of channels.slice(0, 3)) {
        const messagesQuery = query(
          collection(db, 'channels', channel.id, 'messages'),
          limit(3)
        );
        const messagesSnapshot = await getDocs(messagesQuery);

        for (const msgDoc of messagesSnapshot.docs) {
          const msgData = msgDoc.data();
          const author = await UserService.getUserById(msgData.authorId);
          if (author) {
            activities.push({
              id: `message_${msgDoc.id}`,
              type: 'message_posted',
              title: `#${channel.name}`,
              description: `${author.firstName}: ${(msgData.content || '').substring(0, 40)}${(msgData.content || '').length > 40 ? '...' : ''}`,
              authorId: msgData.authorId || '',
              authorName: `${author.firstName} ${author.lastName}`,
              unitId,
              createdAt: msgData.createdAt?.toDate() || new Date(),
            });
          }
        }
      }

      // Récupérer les nouveaux scouts validés récemment
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const scoutsQuery = query(
        collection(db, 'users'),
        where('unitId', '==', unitId),
        where('role', '==', 'scout'),
        where('validated', '==', true),
        limit(5)
      );
      const scoutsSnapshot = await getDocs(scoutsQuery);
      scoutsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const validatedAt = data.validatedAt?.toDate();
        if (validatedAt && validatedAt > sevenDaysAgo) {
          activities.push({
            id: `scout_${doc.id}`,
            type: 'challenge_submitted', // Réutilise un type existant pour "nouveau scout"
            title: 'Nouveau scout',
            description: `${data.firstName} ${data.lastName} a rejoint l'unité`,
            authorId: doc.id,
            authorName: `${data.firstName} ${data.lastName}`,
            unitId,
            createdAt: validatedAt,
          });
        }
      });

      // Trier par date (plus récent en premier) et limiter
      activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return activities.slice(0, activityLimit);
    } catch (error) {
      console.error('[ActivityService] Erreur:', error);
      return [];
    }
  }

  /**
   * Récupérer l'icône associée à un type d'activité
   */
  static getActivityIcon(type: ActivityType): string {
    return ACTIVITY_ICONS[type] || 'ellipse';
  }

  /**
   * Récupérer la couleur associée à un type d'activité
   */
  static getActivityColor(type: ActivityType): string {
    return ACTIVITY_COLORS[type] || '#666666';
  }
}
