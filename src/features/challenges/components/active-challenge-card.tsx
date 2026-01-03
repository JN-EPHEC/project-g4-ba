import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ChallengeCategory } from '@/types';
import { BrandColors } from '@/constants/theme';

// Couleurs par catégorie - Palette brand
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  nature: { bg: BrandColors.primary[50], text: BrandColors.primary[500] },
  sport: { bg: BrandColors.primary[100], text: BrandColors.primary[600] },
  technique: { bg: BrandColors.accent[50], text: BrandColors.accent[500] },
  cuisine: { bg: BrandColors.accent[100], text: BrandColors.accent[600] },
  aventure: { bg: BrandColors.primary[100], text: BrandColors.primary[700] },
  survie: { bg: BrandColors.accent[100], text: BrandColors.accent[700] },
  securite: { bg: BrandColors.accent[50], text: BrandColors.accent[600] },
  default: { bg: BrandColors.secondary[100], text: BrandColors.secondary[500] },
};

interface ActiveChallengeCardProps {
  title: string;
  emoji?: string;
  category?: ChallengeCategory;
  points: number;
  deadline: string;
  isWeCampChallenge?: boolean;
  onPress?: () => void;
}

export function ActiveChallengeCard({
  title,
  emoji = '🎯',
  category,
  points,
  deadline,
  isWeCampChallenge = false,
  onPress,
}: ActiveChallengeCardProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');

  const categoryKey = category?.toLowerCase() || 'default';
  const catColors = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.default;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: cardColor, borderColor: cardBorderColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* WeCamp Badge */}
      {isWeCampChallenge && (
        <View style={styles.wecampBadge}>
          <ThemedText style={styles.wecampBadgeText}>WECAMP</ThemedText>
        </View>
      )}

      {/* Header: Icon + Title + Deadline */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: catColors.bg }]}>
          <ThemedText style={styles.emoji}>{emoji}</ThemedText>
        </View>
        <View style={styles.headerText}>
          <ThemedText style={styles.title} numberOfLines={1}>{title}</ThemedText>
          <ThemedText style={styles.deadline}>⏰ {deadline}</ThemedText>
        </View>
      </View>

      {/* Points display */}
      <View style={styles.progressSection}>
        <View style={styles.pointsRow}>
          <ThemedText style={styles.pointsLabel}>+{points}</ThemedText>
          <ThemedText style={styles.pointsUnit}>pts</ThemedText>
        </View>
      </View>

      {/* Footer: Category + Points */}
      <View style={styles.footer}>
        <View style={[styles.categoryBadge, { backgroundColor: catColors.bg }]}>
          <ThemedText style={[styles.categoryText, { color: catColors.text }]}>
            {category || 'Autre'}
          </ThemedText>
        </View>
        <View style={styles.pointsBadge}>
          <ThemedText style={styles.pointsText}>⭐ +{points}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  wecampBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: BrandColors.accent[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 1,
  },
  wecampBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: BrandColors.accent[600],
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  deadline: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.accent[500],
  },
  progressSection: {
    marginBottom: 12,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  pointsLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: BrandColors.accent[500],
  },
  pointsUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: BrandColors.secondary[400],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.accent[500],
  },
});
