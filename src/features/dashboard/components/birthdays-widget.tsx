import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { WidgetCard } from './widget-card';
import { BirthdayService, BirthdayInfo } from '@/src/shared/services/birthday-service';
import { formatShortDate } from '@/src/shared/utils/date-utils';
import { getDisplayName, getUserTotemEmoji } from '@/src/shared/utils/totem-utils';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/design-tokens';

interface BirthdaysWidgetProps {
  unitId: string;
  delay?: number;
  maxItems?: number;
}

export function BirthdaysWidget({ unitId, delay = 0, maxItems = 5 }: BirthdaysWidgetProps) {
  const [birthdays, setBirthdays] = useState<BirthdayInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');

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
        iconColor={BrandColors.accent[500]}
        delay={delay}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={BrandColors.accent[500]} />
        </View>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title="Anniversaires"
      icon="gift"
      iconColor={BrandColors.accent[500]}
      badge={todayCount > 0 ? `${todayCount} 🎂` : undefined}
      delay={delay}
    >
      {birthdays.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={32} color={textSecondary} />
          <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
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
                { backgroundColor: surfaceSecondary },
                birthday.isToday && styles.birthdayItemToday,
              ]}
            >
              {/* Avatar */}
              {birthday.avatarUrl ? (
                <Image source={{ uri: birthday.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: BrandColors.primary[500] }]}>
                  <ThemedText style={styles.avatarInitial}>
                    {getUserTotemEmoji(birthday) || `${birthday.firstName.charAt(0).toUpperCase()}${birthday.lastName.charAt(0).toUpperCase()}`}
                  </ThemedText>
                </View>
              )}

              {/* Info */}
              <View style={styles.birthdayInfo}>
                <ThemedText style={[styles.birthdayName, { color: textColor }]} numberOfLines={1}>
                  {getDisplayName(birthday)}
                </ThemedText>
                <ThemedText style={[styles.birthdayDate, { color: textSecondary }]}>
                  {formatShortDate(birthday.dateOfBirth)} • {birthday.age} ans
                </ThemedText>
              </View>

              {/* Badge countdown */}
              <View
                style={[
                  styles.countdownBadge,
                  birthday.isToday
                    ? { backgroundColor: BrandColors.accent[500] }
                    : { backgroundColor: `${BrandColors.accent[500]}20` }
                ]}
              >
                <ThemedText
                  style={[
                    styles.countdownText,
                    { color: birthday.isToday ? '#FFFFFF' : BrandColors.accent[500] }
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
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  birthdayList: {
    gap: Spacing.sm,
  },
  birthdayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.md,
  },
  birthdayItemToday: {
    borderWidth: 1.5,
    borderColor: BrandColors.accent[500],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  birthdayInfo: {
    flex: 1,
    gap: 2,
  },
  birthdayName: {
    fontSize: 15,
    fontWeight: '600',
  },
  birthdayDate: {
    fontSize: 13,
  },
  countdownBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
