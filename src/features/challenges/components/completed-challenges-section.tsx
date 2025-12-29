import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { Challenge, ChallengeSubmission, ChallengeStatus, ChallengeCategory } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CATEGORY_EMOJIS: Record<ChallengeCategory, string> = {
  [ChallengeCategory.NATURE]: '🌿',
  [ChallengeCategory.SPORT]: '⚽',
  [ChallengeCategory.TECHNIQUE]: '🔧',
  [ChallengeCategory.CUISINE]: '🍳',
  [ChallengeCategory.CREATIVITY]: '🎨',
};

interface CompletedChallengesSectionProps {
  challenges: Challenge[];
  submissions: ChallengeSubmission[];
  onChallengePress?: (challenge: Challenge) => void;
}

export function CompletedChallengesSection({
  challenges,
  submissions,
  onChallengePress,
}: CompletedChallengesSectionProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Filtrer les soumissions complétées et les associer aux défis
  const completedSubmissions = submissions.filter(
    (s) => s.status === ChallengeStatus.COMPLETED
  );

  // Créer une map des soumissions par challengeId
  const submissionMap = new Map<string, ChallengeSubmission>();
  completedSubmissions.forEach((s) => {
    submissionMap.set(s.challengeId, s);
  });

  // Filtrer les défis qui ont une soumission complétée
  const completedChallenges = challenges.filter((c) => submissionMap.has(c.id));

  // Calculer le total des points gagnés
  const totalPoints = completedChallenges.reduce((sum, c) => sum + c.points, 0);

  const getEmoji = (challenge: Challenge) => {
    return challenge.emoji || (challenge.category ? CATEGORY_EMOJIS[challenge.category] : '🎯');
  };

  const formatDate = (date: Date) => {
    return format(date, 'd MMM yyyy', { locale: fr });
  };

  if (completedChallenges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <ThemedText style={styles.emptyIcon}>🏆</ThemedText>
        </View>
        <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
          Aucune réussite pour l'instant
        </ThemedText>
        <ThemedText style={[styles.emptySubtitle, { color: textSecondary }]}>
          Complete des défis pour voir tes accomplissements ici !
        </ThemedText>
      </View>
    );
  }

  return (
    <View>
      {/* Header avec stats */}
      <View style={[styles.statsCard, { backgroundColor: BrandColors.primary[50] }]}>
        <View style={styles.statsIconContainer}>
          <ThemedText style={styles.statsIcon}>🏆</ThemedText>
        </View>
        <View style={styles.statsContent}>
          <ThemedText style={[styles.statsTitle, { color: BrandColors.primary[700] }]}>
            Mes réussites
          </ThemedText>
          <ThemedText style={[styles.statsSubtitle, { color: BrandColors.primary[600] }]}>
            {completedChallenges.length} défi{completedChallenges.length > 1 ? 's' : ''} complété{completedChallenges.length > 1 ? 's' : ''} • {totalPoints} points gagnés
          </ThemedText>
        </View>
      </View>

      {/* Liste des défis complétés */}
      <View style={styles.list}>
        {completedChallenges.map((challenge) => {
          const submission = submissionMap.get(challenge.id);
          const validatedAt = submission?.validatedAt;

          return (
            <TouchableOpacity
              key={challenge.id}
              style={[
                styles.challengeCard,
                {
                  backgroundColor: cardColor,
                  borderColor: BrandColors.primary[200],
                },
              ]}
              onPress={() => onChallengePress?.(challenge)}
              activeOpacity={0.7}
            >
              {/* Emoji */}
              <View style={[styles.emojiContainer, { backgroundColor: BrandColors.primary[50] }]}>
                <ThemedText style={styles.emoji}>{getEmoji(challenge)}</ThemedText>
              </View>

              {/* Contenu */}
              <View style={styles.cardContent}>
                <ThemedText style={[styles.challengeTitle, { color: textColor }]} numberOfLines={1}>
                  {challenge.title}
                </ThemedText>
                <View style={styles.metaRow}>
                  {validatedAt && (
                    <ThemedText style={[styles.validatedDate, { color: textSecondary }]}>
                      <Ionicons name="checkmark-circle" size={12} color={BrandColors.primary[500]} /> Validé le {formatDate(validatedAt)}
                    </ThemedText>
                  )}
                </View>
              </View>

              {/* Points */}
              <View style={[styles.pointsBadge, { backgroundColor: BrandColors.accent[50] }]}>
                <Ionicons name="star" size={14} color={BrandColors.accent[500]} />
                <ThemedText style={styles.pointsText}>+{challenge.points}</ThemedText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: NeutralColors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 40,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  statsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  statsIcon: {
    fontSize: 28,
  },
  statsContent: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    gap: 12,
  },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validatedDate: {
    fontSize: 12,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.accent[500],
  },
});
