import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { WidgetCard } from './widget-card';
import { ActivityService, Activity, ActivityType } from '@/src/shared/services/activity-service';
import { getRelativeTime } from '@/src/shared/utils/date-utils';

interface ActivityWidgetProps {
  unitId: string;
  delay?: number;
  maxItems?: number;
}

export function ActivityWidget({ unitId, delay = 0, maxItems = 5 }: ActivityWidgetProps) {
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

  if (isLoading) {
    return (
      <WidgetCard
        title="Activité récente"
        icon="pulse"
        iconColor="#22c55e"
        delay={delay}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#22c55e" />
        </View>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title="Activité récente"
      icon="pulse"
      iconColor="#22c55e"
      delay={delay}
    >
      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={32} color="#666" />
          <ThemedText style={styles.emptyText}>Aucune activité récente</ThemedText>
        </View>
      ) : (
        <View style={styles.timeline}>
          {activities.map((activity, index) => (
            <View key={activity.id} style={styles.timelineItem}>
              {/* Ligne de connexion */}
              {index < activities.length - 1 && <View style={styles.timelineLine} />}

              {/* Point avec icône */}
              <View
                style={[
                  styles.timelinePoint,
                  { backgroundColor: `${ActivityService.getActivityColor(activity.type)}20` },
                ]}
              >
                <Ionicons
                  name={ActivityService.getActivityIcon(activity.type) as keyof typeof Ionicons.glyphMap}
                  size={14}
                  color={ActivityService.getActivityColor(activity.type)}
                />
              </View>

              {/* Contenu */}
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <ThemedText style={styles.activityTitle} numberOfLines={1}>
                    {activity.title}
                  </ThemedText>
                  <ThemedText style={styles.timestamp}>
                    {getRelativeTime(activity.createdAt)}
                  </ThemedText>
                </View>
                {activity.description && (
                  <ThemedText style={styles.activityDescription} numberOfLines={1}>
                    {activity.description}
                  </ThemedText>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </WidgetCard>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 14,
    top: 36,
    bottom: -8,
    width: 2,
    backgroundColor: '#3A3A3A',
  },
  timelinePoint: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    gap: 2,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    color: '#888',
    fontSize: 12,
  },
  activityDescription: {
    color: '#999',
    fontSize: 13,
  },
});
