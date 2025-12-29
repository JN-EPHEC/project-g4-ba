import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { ChallengeDifficulty, ChallengeCategory } from '@/types';

interface ChallengeCardCompactProps {
  title: string;
  description?: string;
  emoji?: string;
  category?: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  points: number;
  progress?: number;
  isCompleted?: boolean;
  isPending?: boolean;
  isNew?: boolean;
  completedCount?: number;
  onPress?: () => void;
}

const DIFFICULTY_COLORS: Record<ChallengeDifficulty, string> = {
  [ChallengeDifficulty.EASY]: BrandColors.primary[400],
  [ChallengeDifficulty.MEDIUM]: BrandColors.accent[500],
  [ChallengeDifficulty.HARD]: BrandColors.primary[700],
};

const CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  [ChallengeCategory.NATURE]: 'Nature',
  [ChallengeCategory.SPORT]: 'Sport',
  [ChallengeCategory.TECHNIQUE]: 'Technique',
  [ChallengeCategory.CUISINE]: 'Cuisine',
  [ChallengeCategory.CREATIVITY]: 'Créativité',
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  nature: { bg: BrandColors.primary[50], text: BrandColors.primary[500] },
  sport: { bg: BrandColors.primary[100], text: BrandColors.primary[600] },
  technique: { bg: BrandColors.accent[50], text: BrandColors.accent[500] },
  cuisine: { bg: BrandColors.accent[100], text: BrandColors.accent[600] },
  creativity: { bg: BrandColors.primary[100], text: BrandColors.primary[700] },
  default: { bg: NeutralColors.gray[100], text: NeutralColors.gray[600] },
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
  description,
  emoji,
  category,
  difficulty,
  points,
  progress = 0,
  isCompleted = false,
  isPending = false,
  isNew = false,
  completedCount = 0,
  onPress,
}: ChallengeCardCompactProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const successColor = useThemeColor({}, 'success');

  const displayEmoji = emoji || (category ? CATEGORY_EMOJIS[category] : '🎯');
  const difficultyColor = DIFFICULTY_COLORS[difficulty];

  // Catégorie
  const categoryKey = category?.toLowerCase() || 'default';
  const catColors = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.default;
  const categoryLabel = category ? CATEGORY_LABELS[category] : 'Autre';

  // Difficulté en dots
  const getDifficultyDots = () => {
    const dots = difficulty === ChallengeDifficulty.EASY ? 1
      : difficulty === ChallengeDifficulty.MEDIUM ? 2 : 3;
    return dots;
  };
  const difficultyDots = getDifficultyDots();

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
      {/* New Badge */}
      {isNew && !isCompleted && (
        <View style={styles.newBadge}>
          <ThemedText style={styles.newBadgeText}>NOUVEAU</ThemedText>
        </View>
      )}

      {/* Completed Badge */}
      {isCompleted && (
        <View style={styles.completedBadge}>
          <ThemedText style={styles.checkmark}>✓</ThemedText>
        </View>
      )}

      <View style={styles.mainContent}>
        {/* Left: Emoji */}
        <View style={[styles.emojiContainer, { backgroundColor: catColors.bg }]}>
          <ThemedText style={styles.emoji}>{displayEmoji}</ThemedText>
        </View>

        {/* Middle: Title, Description and Meta */}
        <View style={styles.content}>
          <ThemedText
            type="defaultSemiBold"
            numberOfLines={1}
            style={[styles.title, { paddingRight: isNew || isCompleted ? 80 : 0 }]}
          >
            {title}
          </ThemedText>

          {description && (
            <ThemedText
              style={[styles.description, { color: textSecondary }]}
              numberOfLines={2}
            >
              {description}
            </ThemedText>
          )}

          {/* Footer: Category + Difficulty + Status */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              {/* Category Badge */}
              <View style={[styles.categoryBadge, { backgroundColor: catColors.bg }]}>
                <ThemedText style={[styles.categoryText, { color: catColors.text }]}>
                  {categoryLabel}
                </ThemedText>
              </View>

              {/* Difficulty Dots */}
              <View style={styles.difficultyDots}>
                {[1, 2, 3].map((dot) => (
                  <View
                    key={dot}
                    style={[
                      styles.dot,
                      { backgroundColor: dot <= difficultyDots ? difficultyColor : NeutralColors.gray[200] },
                    ]}
                  />
                ))}
              </View>

              {/* Participants count */}
              {completedCount > 0 && (
                <View style={styles.participantsContainer}>
                  <Ionicons name="people-outline" size={12} color={textSecondary} />
                  <ThemedText style={[styles.participantsText, { color: textSecondary }]}>
                    {completedCount}
                  </ThemedText>
                </View>
              )}

              {/* Status indicator */}
              {isPending && !isCompleted && (
                <View style={styles.statusIndicator}>
                  <Ionicons name="time" size={12} color={BrandColors.accent[500]} />
                </View>
              )}
            </View>

            {/* Points Badge */}
            <View style={styles.pointsBadge}>
              <ThemedText style={styles.pointsText}>⭐ +{points}</ThemedText>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: BrandColors.accent[500],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BrandColors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mainContent: {
    flexDirection: 'row',
    gap: 16,
  },
  emojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  difficultyDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusIndicator: {
    marginLeft: 4,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  participantsText: {
    fontSize: 11,
    fontWeight: '500',
  },
  pointsBadge: {
    backgroundColor: BrandColors.accent[50],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.accent[500],
  },
});
