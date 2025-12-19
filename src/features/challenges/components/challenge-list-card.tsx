import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ChallengeCategory, ChallengeDifficulty } from '@/types';
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

// Couleurs de difficulté (de la mockup)
const DIFFICULTY_COLORS = {
  easy: '#28A745',
  medium: '#F5A623',
  hard: '#DC3545',
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
          borderColor: isCompleted ? '#28A745' : cardBorderColor,
          borderWidth: isCompleted ? 2 : 1,
          opacity: isCompleted ? 0.8 : 1,
        },
      ]}
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
  newBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#E07B4C',
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
    backgroundColor: '#28A745',
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
    backgroundColor: '#FEF7E6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F5A623',
  },
});
