import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ChallengeCategory, ChallengeDifficulty } from '@/types';
import { BrandColors } from '@/constants/theme';

// Couleurs par catégorie - Utilise la palette brand
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

// Couleurs de difficulté - Palette brand uniquement
const DIFFICULTY_COLORS = {
  easy: BrandColors.primary[400],    // Vert clair
  medium: BrandColors.accent[500],   // Orange
  hard: BrandColors.primary[700],    // Vert foncé
};

interface ChallengeListCardProps {
  title: string;
  description: string;
  emoji?: string;
  category?: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  points: number;
  participants?: number;
  isCompleted?: boolean;
  isNew?: boolean;
  isWeCampChallenge?: boolean;
  onPress?: () => void;
}

export function ChallengeListCard({
  title,
  description,
  emoji = '🎯',
  category,
  difficulty,
  points,
  participants = 0,
  isCompleted = false,
  isNew = false,
  isWeCampChallenge = false,
  onPress,
}: ChallengeListCardProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const categoryKey = category?.toLowerCase() || 'default';
  const catColors = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.default;

  const getDifficultyDots = () => {
    const dots = difficulty === ChallengeDifficulty.EASY ? 1
      : difficulty === ChallengeDifficulty.MEDIUM ? 2 : 3;
    const color = difficulty === ChallengeDifficulty.EASY ? DIFFICULTY_COLORS.easy
      : difficulty === ChallengeDifficulty.MEDIUM ? DIFFICULTY_COLORS.medium : DIFFICULTY_COLORS.hard;

    return { dots, color };
  };

  const { dots, color: difficultyColor } = getDifficultyDots();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: cardColor,
          borderColor: isCompleted ? BrandColors.primary[500] : cardBorderColor,
          borderWidth: isCompleted ? 2 : 1,
          opacity: isCompleted ? 0.85 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* WeCamp Badge */}
      {isWeCampChallenge && !isNew && !isCompleted && (
        <View style={styles.wecampBadge}>
          <ThemedText style={styles.wecampBadgeText}>WECAMP</ThemedText>
        </View>
      )}

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

      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: catColors.bg }]}>
          <ThemedText style={styles.emoji}>{emoji}</ThemedText>
        </View>

        {/* Text Content */}
        <View style={styles.textContent}>
          <ThemedText
            style={[styles.title, { paddingRight: isNew || isCompleted ? 80 : 0 }]}
            numberOfLines={1}
          >
            {title}
          </ThemedText>
          <ThemedText
            style={[styles.description, { color: textSecondary }]}
            numberOfLines={2}
          >
            {description}
          </ThemedText>

          {/* Footer Row */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              {/* Category Badge */}
              <View style={[styles.categoryBadge, { backgroundColor: catColors.bg }]}>
                <ThemedText style={[styles.categoryText, { color: catColors.text }]}>
                  {category || 'Autre'}
                </ThemedText>
              </View>

              {/* Difficulty Dots */}
              <View style={styles.difficultyDots}>
                {[1, 2, 3].map((dot) => (
                  <View
                    key={dot}
                    style={[
                      styles.dot,
                      { backgroundColor: dot <= dots ? difficultyColor : '#E8EDE9' },
                    ]}
                  />
                ))}
              </View>

              {/* Participants */}
              <ThemedText style={styles.participants}>👥 {participants}</ThemedText>
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
  container: {
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
  wecampBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: BrandColors.accent[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  wecampBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.accent[600],
    letterSpacing: 0.5,
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
  content: {
    flexDirection: 'row',
    gap: 16,
  },
  iconContainer: {
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
  textContent: {
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
    gap: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  participants: {
    fontSize: 11,
    color: '#C4BBB3',
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
