import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { Challenge, ChallengeSubmission } from '@/types';

interface StartedChallengesSectionProps {
  challenges: Challenge[];
  submissions: ChallengeSubmission[];
  onChallengePress?: (challenge: Challenge) => void;
}

export function StartedChallengesSection({
  challenges,
  submissions,
  onChallengePress,
}: StartedChallengesSectionProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Trouver les défis commencés (status = 'started')
  const startedSubmissions = submissions.filter(s => s.status === 'started');

  // Mapper avec les infos du défi
  const startedChallenges = startedSubmissions
    .map(submission => {
      const challenge = challenges.find(c => c.id === submission.challengeId);
      if (!challenge) return null;
      return {
        challenge,
        submission,
      };
    })
    .filter(Boolean) as { challenge: Challenge; submission: ChallengeSubmission }[];

  if (startedChallenges.length === 0) {
    return null;
  }

  const handlePress = (challenge: Challenge) => {
    if (onChallengePress) {
      onChallengePress(challenge);
    } else {
      router.push(`/(scout)/challenges/${challenge.id}`);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Il y a ${diffHours}h`;
    } else if (diffMinutes > 0) {
      return `Il y a ${diffMinutes} min`;
    } else {
      return 'À l\'instant';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: BrandColors.accent[100] }]}>
            <Ionicons name="time" size={18} color={BrandColors.accent[600]} />
          </View>
          <ThemedText type="subtitle" style={styles.title}>
            Mes défis en cours
          </ThemedText>
        </View>
        <View style={[styles.countBadge, { backgroundColor: BrandColors.accent[500] }]}>
          <ThemedText style={styles.countText}>{startedChallenges.length}</ThemedText>
        </View>
      </View>

      <View style={styles.list}>
        {startedChallenges.map(({ challenge, submission }) => (
          <TouchableOpacity
            key={challenge.id}
            style={[styles.card, { backgroundColor: cardColor, borderColor: cardBorderColor }]}
            onPress={() => handlePress(challenge)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={[styles.emojiContainer, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                <ThemedText style={styles.emoji}>{challenge.emoji || '🎯'}</ThemedText>
              </View>

              <View style={styles.cardInfo}>
                <ThemedText style={styles.challengeTitle} numberOfLines={1}>
                  {challenge.title}
                </ThemedText>
                <View style={styles.metaRow}>
                  <View style={[styles.pointsBadge, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
                    <Ionicons name="star" size={12} color={BrandColors.accent[500]} />
                    <ThemedText style={[styles.pointsText, { color: BrandColors.accent[600] }]}>
                      +{challenge.points} pts
                    </ThemedText>
                  </View>
                  {submission.startedAt && (
                    <ThemedText style={[styles.timeAgo, { color: textSecondary }]}>
                      {formatTimeAgo(submission.startedAt)}
                    </ThemedText>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => handlePress(challenge)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[BrandColors.primary[500], BrandColors.primary[600]]}
                  style={styles.continueGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
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
  cardInfo: {
    flex: 1,
    gap: 6,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 12,
  },
  continueButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  continueGradient: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
