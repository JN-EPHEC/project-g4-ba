import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

const COLORS = {
  gold: '#F5A623',
  goldLight: '#FEF7E6',
  success: '#28A745',
  primary: BrandColors.primary[500],
  neutral: '#8B7E74',
  mist: '#E8EDE9',
};

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  date?: string;
  progress?: number;
}

interface BadgesGridProps {
  badges: Badge[];
}

export function BadgesGrid({ badges }: BadgesGridProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Ma collection</ThemedText>
        <ThemedText style={styles.count}>{unlockedCount}/{badges.length} débloqués</ThemedText>
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {badges.map((badge) => (
          <View key={badge.id} style={styles.badgeCard}>
            <View
              style={[
                styles.badgeCardInner,
                {
                  backgroundColor: cardColor,
                  borderColor: badge.unlocked ? COLORS.gold : cardBorderColor,
                  borderWidth: badge.unlocked ? 2 : 1,
                  opacity: badge.unlocked ? 1 : 0.7,
                },
              ]}
            >
              <View style={[
                styles.iconContainer,
                { backgroundColor: badge.unlocked ? COLORS.goldLight : COLORS.mist }
              ]}>
                <ThemedText style={[
                  styles.icon,
                  !badge.unlocked && { opacity: 0.5 }
                ]}>
                  {badge.icon}
                </ThemedText>
              </View>
              <ThemedText style={[styles.badgeName, { color: textColor }]}>{badge.name}</ThemedText>
              <ThemedText style={styles.badgeDescription}>{badge.description}</ThemedText>

              {badge.unlocked ? (
                <ThemedText style={styles.unlockedDate}>✓ Obtenu le {badge.date}</ThemedText>
              ) : (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${badge.progress || 0}%` }]} />
                  </View>
                  <ThemedText style={styles.progressText}>{badge.progress || 0}%</ThemedText>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  count: {
    fontSize: 14,
    color: COLORS.neutral,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  badgeCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  badgeCardInner: {
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  icon: {
    fontSize: 32,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 11,
    color: COLORS.neutral,
    textAlign: 'center',
    marginBottom: 12,
  },
  unlockedDate: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.mist,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: COLORS.neutral,
  },
});
