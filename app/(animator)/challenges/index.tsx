import React, { useState, useMemo } from 'react';
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
import { useAuth } from '@/context/auth-context';
import { Challenge, ChallengeDifficulty } from '@/types';
import { Animator } from '@/types';
import { BrandColors } from '@/constants/theme';

export default function AnimatorChallengesScreen() {
  const { user } = useAuth();
  const animator = user as Animator;
  const { challenges, loading, error } = useChallenges();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [activeFilter, setActiveFilter] = useState<ChallengeFilter>('all');

  const tintColor = useThemeColor({}, 'tint');

  // Helper to check if challenge is new (created in last 7 days)
  const isNewChallenge = (challenge: Challenge) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(challenge.createdAt) > sevenDaysAgo;
  };

  // Helper to calculate days remaining
  const getDaysRemaining = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Helper to check if challenge is active (started and not ended)
  const isActiveChallenge = (challenge: Challenge) => {
    const now = new Date();
    const start = new Date(challenge.startDate);
    const end = new Date(challenge.endDate);
    return now >= start && now <= end;
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalPoints = challenges.reduce((sum, c) => sum + c.points, 0);
    const activeChallenges = challenges.filter(isActiveChallenge);
    const newChallenges = challenges.filter(isNewChallenge);

    return {
      totalPoints,
      activeCount: activeChallenges.length,
      newCount: newChallenges.length,
    };
  }, [challenges]);

  // Calculate counts for each filter
  const filterCounts = useMemo(() => {
    const activeChallenges = challenges.filter(isActiveChallenge);
    const newChallenges = challenges.filter(isNewChallenge);
    const endedChallenges = challenges.filter(c => {
      const now = new Date();
      const end = new Date(c.endDate);
      return now > end;
    });

    return {
      all: challenges.length,
      in_progress: activeChallenges.length,
      completed: endedChallenges.length,
      new: newChallenges.length,
    };
  }, [challenges]);

  // Filter challenges based on active filter
  const filteredChallenges = useMemo(() => {
    switch (activeFilter) {
      case 'in_progress':
        return challenges.filter(isActiveChallenge);
      case 'completed':
        return challenges.filter(c => {
          const now = new Date();
          const end = new Date(c.endDate);
          return now > end;
        });
      case 'new':
        return challenges.filter(isNewChallenge);
      case 'all':
      default:
        return challenges;
    }
  }, [challenges, activeFilter]);

  // Sort challenges: active first, then by points
  const sortedChallenges = useMemo(() => {
    return [...filteredChallenges].sort((a, b) => {
      const aActive = isActiveChallenge(a);
      const bActive = isActiveChallenge(b);

      // Active challenges first
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;

      // Then by points (highest first)
      return b.points - a.points;
    });
  }, [filteredChallenges]);

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
          totalPoints={stats.totalPoints}
          rank={null}
          completedCount={filterCounts.completed}
          streak={stats.activeCount}
          inProgressCount={filterCounts.in_progress}
          onRankPress={() => router.push('/(animator)/leaderboard')}
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
                ? 'Aucun défi terminé pour le moment'
                : activeFilter === 'new'
                ? 'Pas de nouveaux défis cette semaine'
                : 'Créez un nouveau défi depuis l\'onglet Gestion !'}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.challengesList}>
            {sortedChallenges.map((challenge) => {
              const isEnded = new Date() > new Date(challenge.endDate);

              return (
                <ChallengeCardNew
                  key={challenge.id}
                  title={challenge.title}
                  description={challenge.description}
                  points={challenge.points}
                  emoji={challenge.emoji}
                  difficulty={challenge.difficulty}
                  category={challenge.category}
                  daysRemaining={getDaysRemaining(challenge.endDate)}
                  isCompleted={isEnded}
                  isNew={isNewChallenge(challenge)}
                  participantsCount={challenge.participantsCount || 0}
                  onPress={() => handleChallengeClick(challenge)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal de détails du défi */}
      {selectedChallenge && (
        <ChallengeModal
          challenge={selectedChallenge}
          onClose={handleCloseModal}
        />
      )}
    </ThemedView>
  );
}

// Composant Modal pour afficher les détails d'un défi
function ChallengeModal({
  challenge,
  onClose,
}: {
  challenge: Challenge;
  onClose: () => void;
}) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const overlayColor = useThemeColor({}, 'overlay');
  const textSecondary = useThemeColor({}, 'textSecondary');

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
  const isEnded = new Date() > new Date(challenge.endDate);

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
            {isEnded && (
              <View style={[styles.statusBadge, { backgroundColor: '#f3f4f6' }]}>
                <Ionicons name="checkmark-circle" size={18} color="#6b7280" />
                <ThemedText style={[styles.statusBadgeText, { color: '#6b7280' }]}>Défi terminé</ThemedText>
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

            {/* Participants */}
            {challenge.participantsCount !== undefined && challenge.participantsCount > 0 && (
              <View style={styles.modalSection}>
                <ThemedText color="secondary" type="label" style={styles.modalSectionTitle}>Participants</ThemedText>
                <View style={styles.participantsRow}>
                  <Ionicons name="people" size={16} color={textSecondary} />
                  <ThemedText style={styles.participantsText}>
                    {challenge.participantsCount} participant{challenge.participantsCount > 1 ? 's' : ''}
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Edit Button */}
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: BrandColors.primary[500] }]}
              onPress={() => {
                onClose();
                router.push(`/(animator)/challenges/${challenge.id}` as any);
              }}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <ThemedText style={styles.editButtonText}>
                Modifier le défi
              </ThemedText>
            </TouchableOpacity>
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
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantsText: {
    fontSize: 15,
  },
  editButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    shadowColor: BrandColors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
