import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { ChallengeDifficulty, ChallengeCategory } from '@/types';

interface ChallengeCardNewProps {
  title: string;
  description: string;
  points: number;
  emoji?: string;
  difficulty: ChallengeDifficulty;
  category?: ChallengeCategory;
  daysRemaining?: number;
  progress?: number;
  participantsCount?: number;
  isCompleted?: boolean;
  isPending?: boolean;
  isNew?: boolean;
  onPress?: () => void;
}

const DIFFICULTY_LABELS: Record<ChallengeDifficulty, string> = {
  [ChallengeDifficulty.EASY]: 'Facile',
  [ChallengeDifficulty.MEDIUM]: 'Moyen',
  [ChallengeDifficulty.HARD]: 'Difficile',
};

const CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  [ChallengeCategory.NATURE]: 'Nature',
  [ChallengeCategory.SPORT]: 'Sport',
  [ChallengeCategory.TECHNIQUE]: 'Technique',
  [ChallengeCategory.CUISINE]: 'Cuisine',
  [ChallengeCategory.CREATIVITY]: 'Créatif',
};

const CATEGORY_EMOJIS: Record<ChallengeCategory, string> = {
  [ChallengeCategory.NATURE]: '🌲',
  [ChallengeCategory.SPORT]: '⚽',
  [ChallengeCategory.TECHNIQUE]: '🔧',
  [ChallengeCategory.CUISINE]: '🍳',
  [ChallengeCategory.CREATIVITY]: '🎨',
};

const DIFFICULTY_COLORS: Record<ChallengeDifficulty, string> = {
  [ChallengeDifficulty.EASY]: '#10b981',
  [ChallengeDifficulty.MEDIUM]: '#f59e0b',
  [ChallengeDifficulty.HARD]: '#ef4444',
};

export function ChallengeCardNew({
  title,
  description,
  points,
  emoji,
  difficulty,
  category,
  daysRemaining,
  progress,
  participantsCount,
  isCompleted = false,
  isPending = false,
  isNew = false,
  onPress,
}: ChallengeCardNewProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const successColor = useThemeColor({}, 'success');
  const background = useThemeColor({}, 'background');

  const displayEmoji = emoji || (category ? CATEGORY_EMOJIS[category] : '🎯');
  const difficultyColor = DIFFICULTY_COLORS[difficulty];
  const categoryLabel = category ? CATEGORY_LABELS[category] : null;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: cardColor, borderColor: cardBorderColor },
        isCompleted && { borderColor: successColor, borderWidth: 2 },
        isPending && { borderColor: BrandColors.accent[400], borderWidth: 2 },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Top Row: Emoji + Content + Checkmark/Points */}
      <View style={styles.topRow}>
        {/* Emoji Container */}
        <View style={[styles.emojiContainer, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
          <ThemedText style={styles.emoji}>{displayEmoji}</ThemedText>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText color="secondary" numberOfLines={2} style={styles.description}>
            {description}
          </ThemedText>
        </View>

        {/* Right Side: Checkmark for completed */}
        {isCompleted && (
          <View style={[styles.checkmarkContainer, { backgroundColor: successColor }]}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Tags Row */}
      <View style={styles.tagsRow}>
        {categoryLabel && (
          <View style={[styles.tag, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
            <ThemedText style={[styles.tagText, { color: BrandColors.primary[500] }]}>
              {categoryLabel}
            </ThemedText>
          </View>
        )}
        <View style={[styles.tag, { backgroundColor: `${difficultyColor}15` }]}>
          <ThemedText style={[styles.tagText, { color: difficultyColor }]}>
            {DIFFICULTY_LABELS[difficulty]}
          </ThemedText>
        </View>
        {daysRemaining !== undefined && daysRemaining > 0 && !isCompleted && (
          <View style={[styles.tag, { backgroundColor: NeutralColors.gray[100] }]}>
            <Ionicons name="time-outline" size={12} color={textSecondary} />
            <ThemedText style={[styles.tagText, { color: textSecondary, marginLeft: 4 }]}>
              {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
            </ThemedText>
          </View>
        )}
        {isNew && (
          <View style={[styles.tag, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
            <ThemedText style={[styles.tagText, { color: BrandColors.accent[500] }]}>
              Nouveau
            </ThemedText>
          </View>
        )}
      </View>

      {/* Progress Bar (if in progress) */}
      {progress !== undefined && progress > 0 && !isCompleted && (
        <View style={styles.progressSection}>
          <View style={[styles.progressBarBg, { backgroundColor: NeutralColors.gray[200] }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(progress, 100)}%`, backgroundColor: BrandColors.primary[500] },
              ]}
            />
          </View>
          <ThemedText style={[styles.progressText, { color: textSecondary }]}>
            {progress}%
          </ThemedText>
        </View>
      )}

      {/* Bottom Row: Participants + Points Badge */}
      <View style={styles.bottomRow}>
        <View style={styles.participantsInfo}>
          <Ionicons name="people-outline" size={14} color={textSecondary} />
          <ThemedText style={[styles.participantsText, { color: textSecondary }]}>
            {participantsCount || 0} participant{(participantsCount || 0) !== 1 ? 's' : ''}
          </ThemedText>
        </View>
        {!isCompleted && (
          <View style={[styles.bottomPointsBadge, { backgroundColor: '#fef3c7' }]}>
            <ThemedText style={styles.bottomPointsIcon}>⭐</ThemedText>
            <ThemedText style={styles.bottomPointsText}>+{points} pts</ThemedText>
          </View>
        )}
      </View>

      {/* Pending Badge */}
      {isPending && (
        <View style={styles.pendingBadge}>
          <Ionicons name="time" size={12} color={BrandColors.accent[500]} />
          <ThemedText style={[styles.pendingText, { color: BrandColors.accent[500] }]}>
            En attente
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  checkmarkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
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
    fontSize: 12,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'right',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantsText: {
    fontSize: 12,
  },
  bottomPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  bottomPointsIcon: {
    fontSize: 12,
  },
  bottomPointsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309',
  },
  pendingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${BrandColors.accent[500]}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
