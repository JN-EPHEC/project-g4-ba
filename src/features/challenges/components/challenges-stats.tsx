import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors, NeutralColors } from '@/constants/theme';

interface ChallengesStatsProps {
  totalPoints: number;
  rank?: number | null;
  completedCount: number;
  streak?: number;
  inProgressCount?: number;
  onRankPress?: () => void;
  showRankAsClickable?: boolean;
}

export function ChallengesStats({
  totalPoints,
  rank,
  completedCount,
  streak = 0,
  inProgressCount = 0,
  onRankPress,
  showRankAsClickable = true,
}: ChallengesStatsProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <View style={styles.container}>
      {/* Header with title and points badge */}
      <View style={styles.header}>
        <View>
          <ThemedText type="title" style={[styles.title, { color: BrandColors.primary[600] }]}>
            Défis
          </ThemedText>
          {inProgressCount > 0 && (
            <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
              {inProgressCount} défi{inProgressCount > 1 ? 's' : ''} en cours
            </ThemedText>
          )}
        </View>
        <View style={[styles.pointsBadge, { backgroundColor: BrandColors.accent[500] }]}>
          <Ionicons name="trophy" size={18} color="#FFFFFF" />
          <ThemedText style={styles.pointsText}>{totalPoints} pts</ThemedText>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {/* Rank Card */}
        {showRankAsClickable && onRankPress ? (
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: cardColor, borderColor: cardBorderColor }]}
            onPress={onRankPress}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.statIcon}>🏅</ThemedText>
            <ThemedText type="title" style={[styles.statValue, { color: BrandColors.primary[500] }]}>
              #{rank || '-'}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Classement</ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={[styles.statCard, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
            <ThemedText style={styles.statIcon}>🏅</ThemedText>
            <ThemedText type="title" style={[styles.statValue, { color: BrandColors.primary[500] }]}>
              #{rank || '-'}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Classement</ThemedText>
          </View>
        )}

        {/* Completed Card */}
        <View style={[styles.statCard, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
          <ThemedText style={styles.statIcon}>✅</ThemedText>
          <ThemedText type="title" style={[styles.statValue, { color: BrandColors.accent[500] }]}>
            {completedCount}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Complétés</ThemedText>
        </View>

        {/* Streak Card */}
        <View style={[styles.statCard, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
          <ThemedText style={styles.statIcon}>🔥</ThemedText>
          <ThemedText type="title" style={[styles.statValue, { color: '#ef4444' }]}>
            {streak}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Série</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pointsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});
