import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ChallengeCategory } from '@/types';
import { BrandColors } from '@/constants/theme';

// Couleurs par catégorie (de la mockup)
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  nature: { bg: '#E8F5E9', text: '#28A745' },
  sport: { bg: '#EBF4FF', text: '#4A90D9' },
  technique: { bg: '#FEF7E6', text: '#F5A623' },
  cuisine: { bg: '#FEF3EE', text: '#E07B4C' },
  aventure: { bg: '#F3E5F5', text: '#7B1FA2' },
  survie: { bg: '#FDEAEA', text: '#DC3545' },
  securite: { bg: '#FDEAEA', text: '#DC3545' },
  default: { bg: '#E8EDE9', text: '#8B7E74' },
};

interface ActiveChallengeCardProps {
  title: string;
  emoji?: string;
  category?: ChallengeCategory;
  points: number;
  deadline: string;
  progress: number;
  current?: string;
  target?: string;
  onPress?: () => void;
}

export function ActiveChallengeCard({
  title,
  emoji = '🎯',
  category,
  points,
  deadline,
  progress,
  current,
  target,
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

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <ThemedText style={styles.progressText}>
            {current && target ? `${current} / ${target}` : `${progress}%`}
          </ThemedText>
          <ThemedText style={styles.progressPercent}>{progress}%</ThemedText>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
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
    color: '#E07B4C',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#8B7E74',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.primary[500],
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E8EDE9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: BrandColors.primary[500],
    borderRadius: 3,
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
    color: '#F5A623',
  },
});
