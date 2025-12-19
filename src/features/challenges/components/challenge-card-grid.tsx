import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { ChallengeDifficulty, ChallengeCategory } from '@/types';

interface ChallengeCardGridProps {
  title: string;
  emoji?: string;
  category?: ChallengeCategory;
  points: number;
  daysRemaining?: number;
  progress?: number;
  progressLabel?: string; // e.g. "6.5 km / 10 km"
  isCompleted?: boolean;
  isPending?: boolean;
  onPress?: () => void;
}

const CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  [ChallengeCategory.NATURE]: 'Nature',
  [ChallengeCategory.SPORT]: 'Sport',
  [ChallengeCategory.TECHNIQUE]: 'Technique',
  [ChallengeCategory.CUISINE]: 'Cuisine',
  [ChallengeCategory.CREATIVITY]: 'Créatif',
};

const CATEGORY_COLORS: Record<ChallengeCategory, string> = {
  [ChallengeCategory.NATURE]: '#10b981',
  [ChallengeCategory.SPORT]: '#3b82f6',
  [ChallengeCategory.TECHNIQUE]: '#8b5cf6',
  [ChallengeCategory.CUISINE]: '#f59e0b',
  [ChallengeCategory.CREATIVITY]: '#ec4899',
};

const CATEGORY_EMOJIS: Record<ChallengeCategory, string> = {
  [ChallengeCategory.NATURE]: '♻️',
  [ChallengeCategory.SPORT]: '🥾',
  [ChallengeCategory.TECHNIQUE]: '🔧',
  [ChallengeCategory.CUISINE]: '🍳',
  [ChallengeCategory.CREATIVITY]: '🎨',
};

export function ChallengeCardGrid({
  title,
  emoji,
  category,
  points,
  daysRemaining,
  progress = 0,
  progressLabel,
  isCompleted = false,
  isPending = false,
  onPress,
}: ChallengeCardGridProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const successColor = useThemeColor({}, 'success');

  const displayEmoji = emoji || (category ? CATEGORY_EMOJIS[category] : '🎯');
  const categoryLabel = category ? CATEGORY_LABELS[category] : null;
  const categoryColor = category ? CATEGORY_COLORS[category] : BrandColors.primary[500];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: cardColor, borderColor: cardBorderColor },
        isCompleted && { borderColor: successColor, borderWidth: 2 },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Emoji Circle */}
      <View style={[styles.emojiCircle, { backgroundColor: `${categoryColor}15` }]}>
        <ThemedText style={styles.emoji}>{displayEmoji}</ThemedText>
      </View>

      {/* Title */}
      <ThemedText type="defaultSemiBold" numberOfLines={2} style={styles.title}>
        {title}
      </ThemedText>

      {/* Days Remaining */}
      {daysRemaining !== undefined && daysRemaining > 0 && !isCompleted && (
        <View style={styles.daysRow}>
          <Ionicons name="time-outline" size={14} color="#ef4444" />
          <ThemedText style={styles.daysText}>{daysRemaining} jours</ThemedText>
        </View>
      )}

      {/* Progress Section */}
      {progress > 0 && !isCompleted && (
        <View style={styles.progressSection}>
          {progressLabel && (
            <View style={styles.progressLabelRow}>
              <ThemedText style={[styles.progressLabel, { color: textSecondary }]}>
                {progressLabel}
              </ThemedText>
              <ThemedText style={[styles.progressPercent, { color: textSecondary }]}>
                {progress}%
              </ThemedText>
            </View>
          )}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progress}%`, backgroundColor: categoryColor },
              ]}
            />
          </View>
        </View>
      )}

      {/* Bottom Row: Category + Points */}
      <View style={styles.bottomRow}>
        {categoryLabel && (
          <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}15` }]}>
            <ThemedText style={[styles.categoryText, { color: categoryColor }]}>
              {categoryLabel}
            </ThemedText>
          </View>
        )}
        <View style={styles.pointsBadge}>
          <ThemedText style={styles.pointsIcon}>⭐</ThemedText>
          <ThemedText style={styles.pointsText}>+{points}</ThemedText>
        </View>
      </View>

      {/* Completed Checkmark */}
      {isCompleted && (
        <View style={[styles.completedBadge, { backgroundColor: successColor }]}>
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    minHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emoji: {
    fontSize: 24,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 6,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  daysText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  progressSection: {
    marginBottom: 10,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: NeutralColors.gray[200],
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pointsIcon: {
    fontSize: 14,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.accent[600],
  },
  completedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
