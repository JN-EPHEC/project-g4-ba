import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
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
   */
  static async getRecentActivities(unitId: string, activityLimit = 10): Promise<Activity[]> {
    const activities: Activity[] = [];

    try {
      // Récupérer les événements récents
      const eventsQuery = query(
        collection(db, 'events'),
        where('unitId', '==', unitId),
        orderBy('createdAt', 'desc'),
        limit(5)
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

      // Récupérer les défis récents
      const challengesQuery = query(
        collection(db, 'challenges'),
        where('unitId', '==', unitId),
        orderBy('createdAt', 'desc'),
        limit(5)
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

      // Récupérer les soumissions de défis récentes (validées)
      const submissionsQuery = query(
        collection(db, 'challengeSubmissions'),
        where('status', '==', 'validated'),
        orderBy('submittedAt', 'desc'),
        limit(5)
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);
      submissionsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: `submission_${doc.id}`,
          type: 'challenge_validated',
          title: 'Défi validé',
          description: `Un scout a complété un défi`,
          authorId: data.scoutId || '',
          unitId,
          createdAt: data.validatedAt?.toDate() || data.submittedAt?.toDate() || new Date(),
        });
      });

      // Récupérer les messages récents
      const messagesQuery = query(
        collection(db, 'channelMessages'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      messagesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: `message_${doc.id}`,
          type: 'message_posted',
          title: 'Nouveau message',
          description: data.content?.substring(0, 50) + (data.content?.length > 50 ? '...' : ''),
          authorId: data.authorId || '',
          unitId,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      // Récupérer les fichiers récents
      const filesQuery = query(
        collection(db, 'storageFiles'),
        where('unitId', '==', unitId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const filesSnapshot = await getDocs(filesQuery);
      filesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: `file_${doc.id}`,
          type: 'file_uploaded',
          title: data.name,
          description: `Nouveau fichier ajouté`,
          authorId: data.uploadedBy || '',
          unitId,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      // Trier par date et limiter
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
