import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

interface ChallengesStatsRowProps {
  streak: number;
  completedCount: number;
  inProgressCount: number;
}

export function ChallengesStatsRow({
  streak,
  completedCount,
  inProgressCount,
}: ChallengesStatsRowProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const stats = [
    {
      icon: '🔥',
      value: streak,
      label: 'Série',
      color: '#ef4444',
    },
    {
      icon: '✅',
      value: completedCount,
      label: 'Complétés',
      color: BrandColors.primary[500],
    },
    {
      icon: '⏳',
      value: inProgressCount,
      label: 'En cours',
      color: BrandColors.accent[500],
    },
  ];

  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View
          key={stat.label}
          style={[
            styles.statCard,
            { backgroundColor: cardColor, borderColor: cardBorderColor },
          ]}
        >
          <ThemedText style={styles.statIcon}>{stat.icon}</ThemedText>
          <ThemedText style={[styles.statValue, { color: stat.color }]}>
            {stat.value}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
            {stat.label}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
