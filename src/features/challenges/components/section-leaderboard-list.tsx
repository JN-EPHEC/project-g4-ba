import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { SectionLeaderboardItem } from '../hooks/use-section-leaderboard';

const COLORS = {
  gold: BrandColors.accent[500],
  primary: BrandColors.primary[500],
  neutral: BrandColors.secondary[500],
  mist: BrandColors.secondary[100],
};

interface SectionLeaderboardListProps {
  sections: SectionLeaderboardItem[];
  startRank?: number;
}

export function SectionLeaderboardList({ sections, startRank = 4 }: SectionLeaderboardListProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');

  return (
    <View style={[styles.container, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
      {sections.map((section, index) => {
        const rank = startRank + index;
        const isLast = index === sections.length - 1;

        return (
          <View
            key={section.id}
            style={[
              styles.row,
              !isLast && { borderBottomWidth: 1, borderBottomColor: cardBorderColor },
              section.isMySection && { backgroundColor: `${COLORS.primary}08` },
            ]}
          >
            <ThemedText style={styles.rank}>{rank}</ThemedText>
            <View style={[
              styles.logo,
              section.isMySection && { backgroundColor: `${COLORS.primary}20`, borderWidth: 2, borderColor: COLORS.primary }
            ]}>
              {section.logoUrl ? (
                <Image source={{ uri: section.logoUrl }} style={styles.logoImage} />
              ) : (
                <ThemedText style={styles.logoEmoji}>{section.logo}</ThemedText>
              )}
            </View>
            <View style={styles.info}>
              <ThemedText style={[styles.name, section.isMySection && { color: COLORS.primary, fontWeight: '700' }]}>
                {section.name}
              </ThemedText>
              <ThemedText style={styles.scouts}>👥 {section.scoutsCount} scouts</ThemedText>
            </View>
            <View style={styles.pointsContainer}>
              <ThemedText style={styles.points}>{section.totalPoints}</ThemedText>
              <ThemedText style={styles.pointsLabel}>pts</ThemedText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  rank: {
    width: 28,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.neutral,
    textAlign: 'center',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.mist,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoEmoji: {
    fontSize: 22,
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  scouts: {
    fontSize: 12,
    color: COLORS.neutral,
    marginTop: 2,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gold,
  },
  pointsLabel: {
    fontSize: 10,
    color: COLORS.neutral,
  },
});
