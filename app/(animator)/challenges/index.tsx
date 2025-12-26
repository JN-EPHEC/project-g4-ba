import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ActiveChallengeCard } from '@/src/features/challenges/components/active-challenge-card';
import { ChallengeListCard } from '@/src/features/challenges/components/challenge-list-card';
import { ChallengesHeroHeader, getScoutLevelInfo } from '@/src/features/challenges/components/challenges-hero-header';
import { ChallengesMainTabs, MainTab } from '@/src/features/challenges/components/challenges-main-tabs';
import { ChallengesFilterTabs, ChallengeFilter } from '@/src/features/challenges/components/challenges-filter-tabs';
import { LeaderboardPodium } from '@/src/features/challenges/components/leaderboard-podium';
import { LeaderboardList } from '@/src/features/challenges/components/leaderboard-list';
import { BadgesGrid } from '@/src/features/challenges/components/badges-grid';
import { LevelProgressModal } from '@/src/features/challenges/components/level-progress-modal';
import { useChallenges, useLeaderboard, useBadges } from '@/src/features/challenges/hooks';
import { useAuth } from '@/context/auth-context';
import { Challenge, ChallengeDifficulty } from '@/types';
import { Animator } from '@/types';
import { BrandColors } from '@/constants/theme';

export default function AnimatorChallengesScreen() {
  const { user } = useAuth();
  const animator = user as Animator;
  const { challenges, loading, error } = useChallenges();
  const {
    podiumUsers,
    otherUsers,
    currentUserRank,
    loading: leaderboardLoading
  } = useLeaderboard();
  // Utiliser les badges du premier scout du classement pour l'affichage
  const firstScoutId = podiumUsers.length > 0 ? podiumUsers[0].id : undefined;
  const {
    badgesForGrid,
    loading: badgesLoading
  } = useBadges({ scoutId: firstScoutId });
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [activeFilter, setActiveFilter] = useState<ChallengeFilter>('all');
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('challenges');
  const [showLevelModal, setShowLevelModal] = useState(false);

  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Helper to check if challenge is new (created in last 7 days)
  const isNewChallenge = (challenge: Challenge) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(challenge.createdAt) > sevenDaysAgo;
  };

  // Helper to check if challenge is active (started and not ended)
  const isActiveChallenge = (challenge: Challenge) => {
    const now = new Date();
    const start = new Date(challenge.startDate);
    const end = new Date(challenge.endDate);
    return now >= start && now <= end;
  };

  // Helper to check if challenge is ended
  const isEndedChallenge = (challenge: Challenge) => {
    const now = new Date();
    const end = new Date(challenge.endDate);
    return now > end;
  };

  // Helper to get deadline string
  const getDeadlineString = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Terminé';
    if (diffDays === 1) return '1 jour';
    if (diffDays < 7) return `${diffDays} jours`;
    if (diffDays < 14) return '1 semaine';
    return `${Math.ceil(diffDays / 7)} semaines`;
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalPoints = challenges.reduce((sum, c) => sum + c.points, 0);
    const activeChallenges = challenges.filter(isActiveChallenge);
    const endedChallenges = challenges.filter(isEndedChallenge);

    return {
      totalPoints,
      activeCount: activeChallenges.length,
      endedCount: endedChallenges.length,
    };
  }, [challenges]);

  // Calculate counts for each filter
  const filterCounts = useMemo(() => {
    const activeChallenges = challenges.filter(isActiveChallenge);
    const newChallenges = challenges.filter(isNewChallenge);
    const endedChallenges = challenges.filter(isEndedChallenge);

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
        return challenges.filter(isEndedChallenge);
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

      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;

      return b.points - a.points;
    });
  }, [filteredChallenges]);

  // Get "En cours" challenges for the featured section
  const inProgressChallenges = useMemo(() => {
    return challenges.filter(isActiveChallenge).slice(0, 5);
  }, [challenges]);

  const handleChallengeClick = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
  };

  const handleCloseModal = () => {
    setSelectedChallenge(null);
  };

  const handleMainTabChange = (tab: MainTab) => {
    setActiveMainTab(tab);
  };

  const levelInfo = getScoutLevelInfo(stats.totalPoints);

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
        return (
          <>
            {/* "En cours" Section - Scroll horizontal */}
            {inProgressChallenges.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionIconBg}>
                      <ThemedText style={styles.sectionIcon}>⏳</ThemedText>
                    </View>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>En cours</ThemedText>
                  </View>
                  <View style={styles.countBadge}>
                    <ThemedText style={styles.countText}>{inProgressChallenges.length}</ThemedText>
                  </View>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  {inProgressChallenges.map((challenge) => (
                    <ActiveChallengeCard
                      key={challenge.id}
                      title={challenge.title}
                      emoji={challenge.emoji}
                      category={challenge.category}
                      points={challenge.points}
                      deadline={getDeadlineString(challenge.endDate)}
                      progress={Math.floor(Math.random() * 70) + 10}
                      onPress={() => handleChallengeClick(challenge)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Filter Tabs */}
            <ChallengesFilterTabs
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              counts={filterCounts}
              showCompleted={true}
            />

            {/* Section Title for filtered results */}
            <ThemedText type="subtitle" style={styles.allChallengesTitle}>
              Tous les défis
            </ThemedText>

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
              <View style={styles.listContainer}>
                {sortedChallenges.map((challenge) => (
                  <ChallengeListCard
                    key={challenge.id}
                    title={challenge.title}
                    description={challenge.description}
                    emoji={challenge.emoji}
                    category={challenge.category}
                    difficulty={challenge.difficulty}
                    points={challenge.points}
                    participants={Math.floor(Math.random() * 25) + 5}
                    isCompleted={isEndedChallenge(challenge)}
                    isNew={isNewChallenge(challenge) && !isEndedChallenge(challenge)}
                    onPress={() => handleChallengeClick(challenge)}
                  />
                ))}
              </View>
            )}
          </>
        );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <ChallengesHeroHeader
          totalPoints={stats.totalPoints}
          level={levelInfo.level}
          levelIcon={levelInfo.levelIcon}
          levelColor={levelInfo.levelColor}
          nextLevel={levelInfo.nextLevel}
          nextLevelIcon={levelInfo.nextLevelIcon}
          levelProgress={levelInfo.progress}
          pointsToNextLevel={levelInfo.pointsToNextLevel}
          isMaxLevel={levelInfo.isMaxLevel}
          rank={podiumUsers.length + otherUsers.length > 0 ? podiumUsers.length + otherUsers.length : null}
          streak={podiumUsers.length > 0 ? podiumUsers[0].streak : 0}
          completedCount={stats.endedCount}
          inProgressCount={filterCounts.in_progress}
          onRankPress={() => setActiveMainTab('leaderboard')}
          onLevelPress={() => setShowLevelModal(true)}
        />

        {/* Main Tabs */}
        <ChallengesMainTabs
          activeTab={activeMainTab}
          onTabChange={handleMainTabChange}
        />

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>

      {/* Modal */}
      {selectedChallenge && (
        <ChallengeModal
          challenge={selectedChallenge}
          onClose={handleCloseModal}
        />
      )}

      {/* Modal de progression des niveaux */}
      <LevelProgressModal
        visible={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        currentPoints={stats.totalPoints}
      />
    </ThemedView>
  );
}

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
        return { label: 'Facile', color: BrandColors.primary[400] };
      case ChallengeDifficulty.MEDIUM:
        return { label: 'Moyen', color: BrandColors.accent[500] };
      case ChallengeDifficulty.HARD:
        return { label: 'Difficile', color: BrandColors.primary[700] };
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
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <View style={[styles.modalEmojiContainer, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                  <ThemedText style={styles.modalEmoji}>{challenge.emoji || '🎯'}</ThemedText>
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
                    <View style={[styles.modalBadge, { backgroundColor: BrandColors.accent[50] }]}>
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
              >
                <Ionicons name="close" size={20} color={textSecondary} />
              </TouchableOpacity>
            </View>

            {isEnded && (
              <View style={[styles.statusBadge, { backgroundColor: BrandColors.primary[50] }]}>
                <Ionicons name="checkmark-circle" size={18} color={BrandColors.primary[500]} />
                <ThemedText style={[styles.statusBadgeText, { color: BrandColors.primary[500] }]}>Défi terminé</ThemedText>
              </View>
            )}

            <View style={styles.modalSection}>
              <ThemedText color="secondary" type="label" style={styles.modalSectionTitle}>Description</ThemedText>
              <ThemedText style={styles.modalDescription}>{challenge.description}</ThemedText>
            </View>

            <View style={styles.modalSection}>
              <ThemedText color="secondary" type="label" style={styles.modalSectionTitle}>Période</ThemedText>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={16} color={textSecondary} />
                <ThemedText style={styles.modalDate}>
                  Du {formatDate(challenge.startDate)} au {formatDate(challenge.endDate)}
                </ThemedText>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: BrandColors.primary[500] }]}
              onPress={() => {
                onClose();
                router.push(`/(animator)/challenges/${challenge.id}` as any);
              }}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <ThemedText style={styles.editButtonText}>Modifier le défi</ThemedText>
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: BrandColors.accent[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIcon: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: BrandColors.accent[500],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  horizontalScrollContent: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  allChallengesTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  listContainer: {
    flex: 1,
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
  editButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  editButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
