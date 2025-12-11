import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ChallengeCardNew } from '@/src/features/challenges/components/challenge-card-new';
import { ChallengesStats } from '@/src/features/challenges/components/challenges-stats';
import { ChallengesFilterTabs, ChallengeFilter } from '@/src/features/challenges/components/challenges-filter-tabs';
import { useChallenges } from '@/src/features/challenges/hooks/use-challenges';
import { useAllChallengeProgress } from '@/src/features/challenges/hooks/use-all-challenge-progress';
import { useChallengeProgress } from '@/src/features/challenges/hooks/use-challenge-progress';
import { useAuth } from '@/context/auth-context';
import { LeaderboardService } from '@/services/leaderboard-service';
import { Challenge, ChallengeDifficulty } from '@/types';
import { Scout } from '@/types';
import { BrandColors } from '@/constants/theme';

export default function ChallengesScreen() {
  const { user } = useAuth();
  const scout = user as Scout;
  const { challenges, loading, error } = useChallenges();
  const { submissions, completedCount, isCompleted, refetch: refetchProgress } = useAllChallengeProgress();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [activeFilter, setActiveFilter] = useState<ChallengeFilter>('all');
  const [userRank, setUserRank] = useState<number | null>(null);

  const tintColor = useThemeColor({}, 'tint');

  // Fetch user rank
  useEffect(() => {
    const fetchRank = async () => {
      if (scout?.unitId && scout?.id) {
        try {
          const rank = await LeaderboardService.getScoutRank(scout.id, scout.unitId);
          setUserRank(rank);
        } catch (error) {
          console.error('Error fetching rank:', error);
        }
      }
    };
    fetchRank();
  }, [scout?.unitId, scout?.id]);

  // Helper to check if challenge is new (created in last 7 days)
  const isNewChallenge = (challenge: Challenge) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(challenge.createdAt) > sevenDaysAgo;
  };

  // Helper to check if challenge is pending validation
  const isPendingValidation = (challengeId: string) => {
    const submission = submissions.find(s => s.challengeId === challengeId);
    return submission?.status === 'pending_validation';
  };

  // Helper to calculate days remaining
  const getDaysRemaining = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Calculate counts for each filter
  const filterCounts = useMemo(() => {
    const inProgressChallenges = challenges.filter(c => {
      const pending = isPendingValidation(c.id);
      const completed = isCompleted(c.id);
      return pending || (!completed && !pending);
    });

    const newChallenges = challenges.filter(c =>
      isNewChallenge(c) && !isCompleted(c.id)
    );

    return {
      all: challenges.length,
      in_progress: inProgressChallenges.filter(c => !isCompleted(c.id)).length,
      completed: completedCount,
      new: newChallenges.length,
    };
  }, [challenges, submissions, completedCount]);

  // Filter challenges based on active filter
  const filteredChallenges = useMemo(() => {
    switch (activeFilter) {
      case 'in_progress':
        return challenges.filter(c => !isCompleted(c.id) && !isPendingValidation(c.id));
      case 'completed':
        return challenges.filter(c => isCompleted(c.id));
      case 'new':
        return challenges.filter(c => isNewChallenge(c) && !isCompleted(c.id));
      case 'all':
      default:
        return challenges;
    }
  }, [challenges, activeFilter, submissions]);

  // Sort challenges: pending first, then by points
  const sortedChallenges = useMemo(() => {
    return [...filteredChallenges].sort((a, b) => {
      const aPending = isPendingValidation(a.id);
      const bPending = isPendingValidation(b.id);
      const aCompleted = isCompleted(a.id);
      const bCompleted = isCompleted(b.id);

      // Pending challenges first
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;

      // Then non-completed
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;

      // Then by points (highest first)
      return b.points - a.points;
    });
  }, [filteredChallenges, submissions]);

  const handleChallengeClick = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
  };

  const handleCloseModal = () => {
    setSelectedChallenge(null);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText color="secondary" style={styles.loadingText}>Chargement des défis...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorIcon}>⚠️</ThemedText>
          <ThemedText color="error" style={styles.errorText}>{error}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Stats */}
        <ChallengesStats
          totalPoints={scout?.points || 0}
          rank={userRank}
          completedCount={completedCount}
          streak={0}
          inProgressCount={filterCounts.in_progress}
          onRankPress={() => router.push('/(scout)/leaderboard')}
          showRankAsClickable={true}
        />

        {/* Filter Tabs */}
        <ChallengesFilterTabs
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={filterCounts}
        />

        {/* Challenges List */}
        {sortedChallenges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyIcon}>🎯</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
              Aucun défi trouvé
            </ThemedText>
            <ThemedText color="secondary" style={styles.emptyText}>
              {activeFilter === 'completed'
                ? 'Vous n\'avez pas encore complété de défis'
                : activeFilter === 'new'
                ? 'Pas de nouveaux défis cette semaine'
                : 'Revenez plus tard pour découvrir de nouveaux défis !'}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.challengesList}>
            {sortedChallenges.map((challenge) => (
              <ChallengeCardNew
                key={challenge.id}
                title={challenge.title}
                description={challenge.description}
                points={challenge.points}
                emoji={challenge.emoji}
                difficulty={challenge.difficulty}
                category={challenge.category}
                daysRemaining={getDaysRemaining(challenge.endDate)}
                isCompleted={isCompleted(challenge.id)}
                isPending={isPendingValidation(challenge.id)}
                isNew={isNewChallenge(challenge)}
                onPress={() => handleChallengeClick(challenge)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal de détails du défi */}
      {selectedChallenge && (
        <ChallengeModal
          challenge={selectedChallenge}
          onClose={handleCloseModal}
          onComplete={refetchProgress}
        />
      )}
    </ThemedView>
  );
}

// Composant Modal pour afficher les détails d'un défi
function ChallengeModal({
  challenge,
  onClose,
  onComplete,
}: {
  challenge: Challenge;
  onClose: () => void;
  onComplete: () => void;
}) {
  const {
    submission,
    isCompleted,
    isPending,
    canSubmit,
  } = useChallengeProgress(challenge.id);

  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const overlayColor = useThemeColor({}, 'overlay');
  const successBackground = useThemeColor({}, 'successBackground');
  const warningBackground = useThemeColor({}, 'warningBackground');
  const infoBackground = useThemeColor({}, 'infoBackground');
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const handleTakePhoto = () => {
    onClose();
    router.push(`/(scout)/challenges/${challenge.id}`);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDifficultyInfo = (difficulty: ChallengeDifficulty) => {
    switch (difficulty) {
      case ChallengeDifficulty.EASY:
        return { label: 'Facile', color: '#10b981', emoji: '🟢' };
      case ChallengeDifficulty.MEDIUM:
        return { label: 'Moyen', color: '#f59e0b', emoji: '🟡' };
      case ChallengeDifficulty.HARD:
        return { label: 'Difficile', color: '#ef4444', emoji: '🔴' };
    }
  };

  const difficultyInfo = getDifficultyInfo(challenge.difficulty);

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: overlayColor }]}>
        <View style={[styles.modalContent, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <View style={[styles.modalEmojiContainer, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                  <ThemedText style={styles.modalEmoji}>
                    {challenge.emoji || '🎯'}
                  </ThemedText>
                </View>
                <View style={styles.modalTitleInfo}>
                  <ThemedText type="title" style={styles.modalTitle} numberOfLines={2}>
                    {challenge.title}
                  </ThemedText>
                  <View style={styles.modalBadgesRow}>
                    <View style={[styles.modalBadge, { backgroundColor: `${difficultyInfo.color}15` }]}>
                      <ThemedText style={[styles.modalBadgeText, { color: difficultyInfo.color }]}>
                        {difficultyInfo.label}
                      </ThemedText>
                    </View>
                    <View style={[styles.modalBadge, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
                      <ThemedText style={[styles.modalBadgeText, { color: BrandColors.accent[500] }]}>
                        +{challenge.points} pts
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: cardBorderColor }]}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Status Badge */}
            {isCompleted && (
              <View style={[styles.statusBadge, { backgroundColor: successBackground }]}>
                <Ionicons name="checkmark-circle" size={18} color={BrandColors.primary[500]} />
                <ThemedText color="success" style={styles.statusBadgeText}>Défi complété</ThemedText>
              </View>
            )}
            {isPending && (
              <View style={[styles.statusBadge, { backgroundColor: warningBackground }]}>
                <Ionicons name="time" size={18} color="#f59e0b" />
                <ThemedText color="warning" style={styles.statusBadgeText}>En attente de validation</ThemedText>
              </View>
            )}

            {/* Description */}
            <View style={styles.modalSection}>
              <ThemedText color="secondary" type="label" style={styles.modalSectionTitle}>Description</ThemedText>
              <ThemedText style={styles.modalDescription}>{challenge.description}</ThemedText>
            </View>

            {/* Dates */}
            <View style={styles.modalSection}>
              <ThemedText color="secondary" type="label" style={styles.modalSectionTitle}>Période</ThemedText>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={16} color={textSecondary} />
                <ThemedText style={styles.modalDate}>
                  Du {formatDate(challenge.startDate)} au {formatDate(challenge.endDate)}
                </ThemedText>
              </View>
            </View>

            {/* Photo requirement notice */}
            {canSubmit && (
              <View style={[styles.photoNotice, { backgroundColor: infoBackground }]}>
                <View style={[styles.photoNoticeIcon, { backgroundColor: cardColor }]}>
                  <Ionicons name="camera" size={20} color={tintColor} />
                </View>
                <ThemedText style={[styles.photoNoticeText, { color: tintColor }]}>
                  Une photo de preuve est requise pour valider ce défi
                </ThemedText>
              </View>
            )}

            {/* Button */}
            {canSubmit && (
              <TouchableOpacity
                style={[styles.takePhotoButton, { backgroundColor: BrandColors.accent[500] }]}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera" size={24} color="#FFFFFF" />
                <ThemedText style={styles.takePhotoButtonText}>
                  Relever le défi
                </ThemedText>
              </TouchableOpacity>
            )}

            {isCompleted && submission && (
              <View style={[styles.completedInfo, { backgroundColor: successBackground }]}>
                <ThemedText color="success" style={styles.completedInfoText}>
                  Complété le {formatDate(submission.validatedAt || submission.submittedAt)}
                </ThemedText>
              </View>
            )}

            {isPending && (
              <View style={[styles.pendingInfo, { backgroundColor: warningBackground }]}>
                <ThemedText color="warning" style={styles.pendingInfoText}>
                  En attente de validation par votre animateur
                </ThemedText>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  challengesList: {
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  modalEmojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmoji: {
    fontSize: 28,
  },
  modalTitleInfo: {
    flex: 1,
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  modalBadgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalDate: {
    fontSize: 15,
  },
  photoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 12,
  },
  photoNoticeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoNoticeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  takePhotoButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    shadowColor: BrandColors.accent[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  takePhotoButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completedInfo: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  completedInfoText: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  pendingInfo: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  pendingInfoText: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
});
