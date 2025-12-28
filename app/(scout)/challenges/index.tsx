import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Modal, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ChallengeCardCompact } from '@/src/features/challenges/components/challenge-card-compact';
import { ChallengesHeroHeader, getScoutLevelInfo } from '@/src/features/challenges/components/challenges-hero-header';
import { ChallengesMainTabs, MainTab } from '@/src/features/challenges/components/challenges-main-tabs';
import { ChallengesFilterTabs, ChallengeFilter } from '@/src/features/challenges/components/challenges-filter-tabs';
import { useChallenges, useBadges } from '@/src/features/challenges/hooks';
import { useAllChallengeProgress } from '@/src/features/challenges/hooks/use-all-challenge-progress';
import { useChallengeProgress } from '@/src/features/challenges/hooks/use-challenge-progress';
import { useAuth } from '@/context/auth-context';
import { LeaderboardPodium } from '@/src/features/challenges/components/leaderboard-podium';
import { LeaderboardList } from '@/src/features/challenges/components/leaderboard-list';
import { BadgesGrid } from '@/src/features/challenges/components/badges-grid';
import { LevelProgressModal } from '@/src/features/challenges/components/level-progress-modal';
import { useLeaderboard } from '@/src/features/challenges/hooks';
import { LeaderboardService } from '@/services/leaderboard-service';
import { Challenge, ChallengeDifficulty } from '@/types';
import { Scout } from '@/types';
import { BrandColors } from '@/constants/theme';

export default function ChallengesScreen() {
  const { user } = useAuth();
  const scout = user as Scout;
  const { challenges, loading, error } = useChallenges();
  const { submissions, completedCount, isCompleted, refetch: refetchProgress } = useAllChallengeProgress();
  const {
    podiumUsers,
    otherUsers,
    currentUserRank,
    loading: leaderboardLoading
  } = useLeaderboard();
  const {
    badgesForGrid,
    loading: badgesLoading
  } = useBadges({ scoutId: scout?.id });
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [activeFilter, setActiveFilter] = useState<ChallengeFilter>('all');
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('challenges');
  const [userRank, setUserRank] = useState<number | null>(null);
  const [showLevelModal, setShowLevelModal] = useState(false);

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
      new: newChallenges.length,
    };
  }, [challenges, submissions, completedCount]);

  // Filter challenges based on active filter
  const filteredChallenges = useMemo(() => {
    switch (activeFilter) {
      case 'in_progress':
        return challenges.filter(c => !isCompleted(c.id) && !isPendingValidation(c.id));
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

  const handleMainTabChange = (tab: MainTab) => {
    setActiveMainTab(tab);
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeMainTab) {
      case 'leaderboard':
        if (leaderboardLoading) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={tintColor} />
              <ThemedText color="secondary" style={styles.loadingText}>Chargement du classement...</ThemedText>
            </View>
          );
        }

        if (podiumUsers.length === 0) {
          return (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyIcon}>🏆</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                Aucun scout dans le classement
              </ThemedText>
              <ThemedText color="secondary" style={styles.emptyText}>
                Les scouts de votre unité apparaîtront ici une fois qu'ils auront des points.
              </ThemedText>
            </View>
          );
        }

        return (
          <>
            {/* Podium */}
            <LeaderboardPodium users={podiumUsers} />
            {/* Full list (starting from rank 4) */}
            {otherUsers.length > 0 && (
              <LeaderboardList users={otherUsers} startRank={4} />
            )}
          </>
        );

      case 'badges':
        if (badgesLoading) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={tintColor} />
              <ThemedText color="secondary" style={styles.loadingText}>Chargement des badges...</ThemedText>
            </View>
          );
        }

        if (badgesForGrid.length === 0) {
          return (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyIcon}>🏅</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                Aucun badge disponible
              </ThemedText>
              <ThemedText color="secondary" style={styles.emptyText}>
                Les badges seront affichés ici une fois configurés.
              </ThemedText>
            </View>
          );
        }

        return <BadgesGrid badges={badgesForGrid} />;

      case 'challenges':
      default:
        return renderChallengesContent();
    }
  };

  const renderChallengesContent = () => {
    return (
      <>
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
              {activeFilter === 'new'
                ? 'Pas de nouveaux défis cette semaine'
                : 'Revenez plus tard pour découvrir de nouveaux défis !'}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.challengesList}>
            {sortedChallenges.map((challenge) => (
              <ChallengeCardCompact
                key={challenge.id}
                title={challenge.title}
                description={challenge.description}
                emoji={challenge.emoji}
                category={challenge.category}
                difficulty={challenge.difficulty}
                points={challenge.points}
                progress={getChallengeProgress(challenge)}
                isCompleted={isCompleted(challenge.id)}
                isPending={isPendingValidation(challenge.id)}
                isNew={isNewChallenge(challenge)}
                onPress={() => handleChallengeClick(challenge)}
              />
            ))}
          </View>
        )}
      </>
    );
  };

  // Get challenge progress - 0 for not started, 100 for completed/pending
  const getChallengeProgress = (challenge: Challenge) => {
    if (isCompleted(challenge.id)) return 100;
    if (isPendingValidation(challenge.id)) return 100;
    return 0;
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

  // Calculer les infos de niveau une fois
  const levelInfo = getScoutLevelInfo(scout?.points || 0);

  return (
    <View style={[styles.container, { backgroundColor: levelInfo.levelColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={levelInfo.levelColor} translucent />
      {/* Hero Header fixé en haut - en dehors du ScrollView */}
      <ChallengesHeroHeader
        totalPoints={scout?.points || 0}
        level={levelInfo.level}
        levelIcon={levelInfo.levelIcon}
        levelColor={levelInfo.levelColor}
        nextLevel={levelInfo.nextLevel}
        nextLevelIcon={levelInfo.nextLevelIcon}
        levelProgress={levelInfo.progress}
        pointsToNextLevel={levelInfo.pointsToNextLevel}
        isMaxLevel={levelInfo.isMaxLevel}
        rank={userRank}
        streak={0}
        completedCount={completedCount}
        inProgressCount={filterCounts.in_progress}
        onRankPress={() => setActiveMainTab('leaderboard')}
        onLevelPress={() => setShowLevelModal(true)}
      />

      <ThemedView style={styles.scrollContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Content Section with padding */}
          <View style={styles.contentSection}>
            {/* Main Tabs */}
            <ChallengesMainTabs
              activeTab={activeMainTab}
              onTabChange={handleMainTabChange}
            />

            {/* Tab Content */}
            {renderTabContent()}
          </View>
        </ScrollView>
      </ThemedView>

      {/* Modal de détails du défi */}
      {selectedChallenge && (
        <ChallengeModal
          challenge={selectedChallenge}
          onClose={handleCloseModal}
          onComplete={refetchProgress}
        />
      )}

      {/* Modal de progression des niveaux */}
      <LevelProgressModal
        visible={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        currentPoints={scout?.points || 0}
      />
    </View>
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
    backgroundColor: '#D97B4A', // Couleur du header pour éviter le flash blanc
    // S'assurer que le container ne déborde pas de la zone des Tabs
    overflow: 'hidden',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  contentSection: {
    padding: 20,
    paddingTop: 24,
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
