import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { WidgetCard } from './widget-card';
import { ActivityService, Activity } from '@/src/shared/services/activity-service';
import { getRelativeTime } from '@/src/shared/utils/date-utils';
import { BrandColors } from '@/constants/theme';

interface ActivityWidgetProps {
  unitId: string;
  delay?: number;
  maxItems?: number;
}

// Emojis pour chaque type d'activité
const ACTIVITY_EMOJIS: Record<string, string> = {
  event_created: '📅',
  challenge_created: '🎯',
  challenge_validated: '🏆',
  challenge_submitted: '📷',
  message_posted: '💬',
  file_uploaded: '📄',
  folder_created: '📁',
};

export function ActivityWidget({ unitId, delay = 0, maxItems = 4 }: ActivityWidgetProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    try {
      const recentActivities = await ActivityService.getRecentActivities(unitId, maxItems);
      setActivities(recentActivities);
    } catch (error) {
      console.error('[ActivityWidget] Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  }, [unitId, maxItems]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Fonction pour formater le texte d'activité
  const getActivityText = (activity: Activity): string => {
    switch (activity.type) {
      case 'event_created':
        return `Nouvel événement : ${activity.title}`;
      case 'challenge_created':
        return `Nouveau défi : ${activity.title}`;
      case 'challenge_validated':
        return `${activity.authorName || 'Un scout'} a complété "${activity.title}"`;
      case 'challenge_submitted':
        // Pour les nouveaux scouts
        if (activity.title === 'Nouveau scout') {
          return activity.description || `${activity.authorName} a rejoint l'unité`;
        }
        return `${activity.authorName || 'Un scout'} a soumis un défi`;
      case 'message_posted':
        return activity.description || `Nouveau message dans ${activity.title}`;
      default:
        return activity.title;
    }
  };

  if (isLoading) {
    return (
      <WidgetCard
        title="Activité récente"
        icon="pulse"
        iconColor={BrandColors.primary[500]}
        delay={delay}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={BrandColors.primary[500]} />
        </View>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title="Activité récente"
      icon="pulse"
      iconColor={BrandColors.primary[500]}
      delay={delay}
    >
      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={32} color="#999" />
          <ThemedText style={styles.emptyText}>Aucune activité récente</ThemedText>
        </View>
      ) : (
        <View style={styles.activityList}>
          {activities.slice(0, 4).map((activity, index) => (
            <View
              key={activity.id}
              style={[
                styles.activityItem,
                index < Math.min(activities.length, 4) - 1 && styles.activityItemBorder,
              ]}
            >
              <ThemedText style={styles.activityEmoji}>
                {ACTIVITY_EMOJIS[activity.type] || '📌'}
              </ThemedText>
              <ThemedText style={styles.activityText} numberOfLines={1}>
                {getActivityText(activity)}
              </ThemedText>
              <ThemedText style={styles.activityTime}>
                {getRelativeTime(activity.createdAt)}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </WidgetCard>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  activityList: {
    gap: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 10,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  activityEmoji: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  activityText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  activityTime: {
    fontSize: 11,
    color: '#999',
    marginLeft: 8,
  },
});
