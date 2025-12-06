import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { WidgetCard } from './widget-card';
import { BirthdayService, BirthdayInfo } from '@/src/shared/services/birthday-service';
import { formatShortDate } from '@/src/shared/utils/date-utils';

interface BirthdaysWidgetProps {
  unitId: string;
  delay?: number;
  maxItems?: number;
}

export function BirthdaysWidget({ unitId, delay = 0, maxItems = 5 }: BirthdaysWidgetProps) {
  const [birthdays, setBirthdays] = useState<BirthdayInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBirthdays = useCallback(async () => {
    try {
      const upcoming = await BirthdayService.getUpcomingBirthdays(unitId, 30);
      setBirthdays(upcoming.slice(0, maxItems));
    } catch (error) {
      console.error('[BirthdaysWidget] Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  }, [unitId, maxItems]);

  useEffect(() => {
    loadBirthdays();
  }, [loadBirthdays]);

  const todayCount = birthdays.filter((b) => b.isToday).length;

  if (isLoading) {
    return (
      <WidgetCard
        title="Anniversaires"
        icon="gift"
        iconColor="#ec4899"
        delay={delay}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#ec4899" />
        </View>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title="Anniversaires"
      icon="gift"
      iconColor="#ec4899"
      badge={todayCount > 0 ? `${todayCount} 🎂` : undefined}
      delay={delay}
    >
      {birthdays.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={32} color="#666" />
          <ThemedText style={styles.emptyText}>
            Aucun anniversaire prévu ce mois-ci
          </ThemedText>
        </View>
      ) : (
        <View style={styles.birthdayList}>
          {birthdays.map((birthday) => (
            <View
              key={birthday.id}
              style={[
                styles.birthdayItem,
                birthday.isToday && styles.birthdayItemToday,
              ]}
            >
              {/* Avatar */}
              {birthday.avatarUrl ? (
                <Image source={{ uri: birthday.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <ThemedText style={styles.avatarInitial}>
                    {birthday.firstName.charAt(0).toUpperCase()}
                  </ThemedText>
                </View>
              )}

              {/* Info */}
              <View style={styles.birthdayInfo}>
                <ThemedText style={styles.birthdayName} numberOfLines={1}>
                  {birthday.firstName} {birthday.lastName}
                </ThemedText>
                <ThemedText style={styles.birthdayDate}>
                  {formatShortDate(birthday.dateOfBirth)} • {birthday.age} ans
                </ThemedText>
              </View>

              {/* Badge countdown */}
              <View
                style={[
                  styles.countdownBadge,
                  birthday.isToday && styles.countdownBadgeToday,
                ]}
              >
                <ThemedText
                  style={[
                    styles.countdownText,
                    birthday.isToday && styles.countdownTextToday,
                  ]}
                >
                  {BirthdayService.getBirthdayLabel(birthday.daysUntil)}
                </ThemedText>
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
    textAlign: 'center',
  },
  birthdayList: {
    gap: 10,
  },
  birthdayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A3A',
    padding: 10,
    borderRadius: 10,
    gap: 10,
  },
  birthdayItemToday: {
    backgroundColor: '#ec489920',
    borderWidth: 1,
    borderColor: '#ec4899',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A4A4A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  birthdayInfo: {
    flex: 1,
    gap: 2,
  },
  birthdayName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  birthdayDate: {
    color: '#888',
    fontSize: 12,
  },
  countdownBadge: {
    backgroundColor: '#4A4A4A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countdownBadgeToday: {
    backgroundColor: '#ec4899',
  },
  countdownText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },
  countdownTextToday: {
    color: '#FFFFFF',
  },
});
