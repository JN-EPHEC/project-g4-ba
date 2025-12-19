import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { ChallengeDifficulty, ChallengeCategory } from '@/types';

interface ChallengeCardCompactProps {
  title: string;
  emoji?: string;
  category?: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  points: number;
  progress?: number;
  isCompleted?: boolean;
  isPending?: boolean;
  isNew?: boolean;
  onPress?: () => void;
}

const DIFFICULTY_COLORS: Record<ChallengeDifficulty, string> = {
  [ChallengeDifficulty.EASY]: '#10b981',
  [ChallengeDifficulty.MEDIUM]: '#f59e0b',
  [ChallengeDifficulty.HARD]: '#ef4444',
};

const CATEGORY_EMOJIS: Record<ChallengeCategory, string> = {
  [ChallengeCategory.NATURE]: '🌲',
  [ChallengeCategory.SPORT]: '⚽',
  [ChallengeCategory.TECHNIQUE]: '🔧',
  [ChallengeCategory.CUISINE]: '🍳',
  [ChallengeCategory.CREATIVITY]: '🎨',
};

export function ChallengeCardCompact({
  title,
  emoji,
  category,
  difficulty,
  points,
  progress = 0,
  isCompleted = false,
  isPending = false,
  isNew = false,
  onPress,
}: ChallengeCardCompactProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const successColor = useThemeColor({}, 'success');

  const displayEmoji = emoji || (category ? CATEGORY_EMOJIS[category] : '🎯');
  const difficultyColor = DIFFICULTY_COLORS[difficulty];

  // Determine border color based on status
  const getBorderStyle = () => {
    if (isCompleted) return { borderColor: successColor, borderWidth: 2 };
    if (isPending) return { borderColor: BrandColors.accent[400], borderWidth: 2 };
    return { borderColor: cardBorderColor, borderWidth: 1 };
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardColor }, getBorderStyle()]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left: Emoji */}
      <View style={[styles.emojiContainer, { backgroundColor: `${difficultyColor}15` }]}>
        <ThemedText style={styles.emoji}>{displayEmoji}</ThemedText>
      </View>

      {/* Middle: Title and Progress */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.title}>
            {title}
          </ThemedText>
          {isNew && (
            <View style={styles.newBadge}>
              <ThemedText style={styles.newBadgeText}>NEW</ThemedText>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        {!isCompleted && progress >= 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarBg, { backgroundColor: NeutralColors.gray[200] }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: isCompleted ? successColor : difficultyColor,
                  },
                ]}
              />
            </View>
            <ThemedText style={[styles.progressText, { color: textSecondary }]}>
              {progress}%
            </ThemedText>
          </View>
        )}

        {/* Completed indicator */}
        {isCompleted && (
          <View style={styles.completedRow}>
            <Ionicons name="checkmark-circle" size={14} color={successColor} />
            <ThemedText style={[styles.completedText, { color: successColor }]}>
              Complété
            </ThemedText>
          </View>
        )}

        {/* Pending indicator */}
        {isPending && !isCompleted && (
          <View style={styles.pendingRow}>
            <Ionicons name="time" size={14} color={BrandColors.accent[500]} />
            <ThemedText style={[styles.pendingText, { color: BrandColors.accent[500] }]}>
              En attente
            </ThemedText>
          </View>
        )}
      </View>

      {/* Right: Points */}
      <View style={styles.pointsContainer}>
        <ThemedText style={[styles.pointsValue, { color: BrandColors.accent[600] }]}>
          +{points}
        </ThemedText>
        <ThemedText style={[styles.pointsLabel, { color: textSecondary }]}>pts</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    flex: 1,
  },
  newBadge: {
    backgroundColor: BrandColors.accent[500],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 28,
    textAlign: 'right',
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  pointsLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: -2,
  },
});
