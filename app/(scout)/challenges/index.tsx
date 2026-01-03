import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Modal, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
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
import { CompletedChallengesSection } from '@/src/features/challenges/components/completed-challenges-section';
import { StartedChallengesSection } from '@/src/features/challenges/components/started-challenges-section';
import { LevelProgressModal } from '@/src/features/challenges/components/level-progress-modal';
import { useLeaderboard } from '@/src/features/challenges/hooks';
import { LeaderboardService } from '@/services/leaderboard-service';
import { PartnerService } from '@/services/partner-service';
import { Challenge, ChallengeDifficulty } from '@/types';
import { Scout } from '@/types';
import { Partner, PartnerOffer } from '@/types/partners';
import { BrandColors } from '@/constants/theme';

export default function ChallengesScreen() {
  const { user } = useAuth();
  const scout = user as Scout;
  const { challenges, loading, error } = useChallenges();
  const { submissions, completedCount, startedCount, isCompleted, isStarted, refetch: refetchProgress } = useAllChallengeProgress();
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

  // États pour les récompenses/partenariats
  const [unitBalance, setUnitBalance] = useState<number>(0);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [offers, setOffers] = useState<(PartnerOffer & { partner: Partner })[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);

  const tintColor = useThemeColor({}, 'tint');
  const rewardsCardColor = useThemeColor({}, 'card');
  const rewardsCardBorderColor = useThemeColor({}, 'cardBorder');

  // Recharger les soumissions quand l'écran reprend le focus
  useFocusEffect(
    useCallback(() => {
      refetchProgress();
    }, [refetchProgress])
  );

  // Charger les données des partenariats
  const loadRewardsData = useCallback(async () => {
    if (!scout?.unitId) return;

    setRewardsLoading(true);
    try {
      const [balance, activeOffers, allPartners] = await Promise.all([
        PartnerService.getUnitPointsBalance(scout.unitId),
        PartnerService.getAllActiveOffers(),
        PartnerService.getPartners(),
      ]);

      setUnitBalance(balance);
      setOffers(activeOffers);
      setPartners(allPartners);
    } catch (error) {
      console.error('Erreur chargement récompenses:', error);
    } finally {
      setRewardsLoading(false);
    }
  }, [scout?.unitId]);

  // Charger les récompenses au focus
  useFocusEffect(
    useCallback(() => {
      if (activeMainTab === 'rewards') {
        loadRewardsData();
      }
    }, [activeMainTab, loadRewardsData])
  );

  // Charger aussi au changement d'onglet
  useEffect(() => {
    if (activeMainTab === 'rewards') {
      loadRewardsData();
    }
  }, [activeMainTab, loadRewardsData]);

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
    // "En cours" = défis avec statut STARTED (commencés mais pas encore soumis)
    const inProgressCount = challenges.filter(c => isStarted(c.id)).length;

    const newChallenges = challenges.filter(c =>
      isNewChallenge(c) && !isCompleted(c.id)
    );

    return {
      all: challenges.length,
      in_progress: inProgressCount,
      new: newChallenges.length,
    };
  }, [challenges, submissions, completedCount, startedCount]);

  // Filter challenges based on active filter
  const filteredChallenges = useMemo(() => {
    switch (activeFilter) {
      case 'in_progress':
        // Afficher uniquement les défis avec statut STARTED
        return challenges.filter(c => isStarted(c.id));
      case 'new':
        return challenges.filter(c => isNewChallenge(c) && !isCompleted(c.id));
      case 'all':
      default:
        return challenges;
    }
  }, [challenges, activeFilter, submissions]);

  // Sort challenges: started first, then pending, then by points
  const sortedChallenges = useMemo(() => {
    return [...filteredChallenges].sort((a, b) => {
      const aStarted = isStarted(a.id);
      const bStarted = isStarted(b.id);
      const aPending = isPendingValidation(a.id);
      const bPending = isPendingValidation(b.id);
      const aCompleted = isCompleted(a.id);
      const bCompleted = isCompleted(b.id);

      // Started challenges first (en cours)
      if (aStarted && !bStarted) return -1;
      if (!aStarted && bStarted) return 1;

      // Then pending challenges
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

      case 'achievements':
        const completedChallenges = challenges.filter((c) => isCompleted(c.id));
        return (
          <CompletedChallengesSection
            challenges={completedChallenges}
            submissions={submissions}
            onChallengePress={handleChallengeClick}
          />
        );

      case 'rewards':
        return renderRewardsContent();

      case 'challenges':
      default:
        return renderChallengesContent();
    }
  };

  // Formatter la réduction
  const formatDiscount = (offer: PartnerOffer) => {
    if (offer.discountType === 'percentage') {
      return `-${offer.discountValue}%`;
    }
    return `-${offer.discountValue}€`;
  };

  // Couleur selon le coût en points
  const getDifficultyColor = (pointsCost: number) => {
    if (pointsCost <= 500) return { bg: '#E8F5E9', color: '#28A745' };
    if (pointsCost <= 800) return { bg: '#FEF7E6', color: '#F5A623' };
    return { bg: '#FDEAEA', color: '#DC3545' };
  };

  // Rendu de l'onglet Récompenses
  const renderRewardsContent = () => {
    if (rewardsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText color="secondary" style={styles.loadingText}>
            Chargement des récompenses...
          </ThemedText>
        </View>
      );
    }

    return (
      <>
        {/* Bannière d'information */}
        <View style={[styles.rewardsBanner, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
          <View style={styles.rewardsBannerIcon}>
            <Ionicons name="gift" size={24} color={BrandColors.accent[500]} />
          </View>
          <View style={styles.rewardsBannerContent}>
            <ThemedText type="defaultSemiBold" style={styles.rewardsBannerTitle}>
              Récompenses collectives
            </ThemedText>
            <ThemedText color="secondary" style={styles.rewardsBannerText}>
              Tes points s'additionnent à ceux de ton unité pour débloquer des réductions chez nos partenaires !
            </ThemedText>
          </View>
        </View>

        {/* Solde de l'unité */}
        <View style={[styles.unitBalanceCard, { backgroundColor: rewardsCardColor, borderColor: rewardsCardBorderColor }]}>
          <View style={styles.unitBalanceHeader}>
            <Ionicons name="star" size={28} color={BrandColors.accent[500]} />
            <View style={styles.unitBalanceInfo}>
              <ThemedText color="secondary" style={styles.unitBalanceLabel}>
                Solde total de ton unité
              </ThemedText>
              <ThemedText type="title" style={[styles.unitBalanceValue, { color: BrandColors.accent[500] }]}>
                {unitBalance.toLocaleString()} pts
              </ThemedText>
            </View>
          </View>
          <View style={[styles.unitBalanceContribution, { backgroundColor: `${BrandColors.primary[500]}10` }]}>
            <Ionicons name="person" size={16} color={BrandColors.primary[500]} />
            <ThemedText style={[styles.unitBalanceContributionText, { color: BrandColors.primary[600] }]}>
              Ta contribution : {scout?.points || 0} pts
            </ThemedText>
          </View>
        </View>

        {/* Liste des partenaires */}
        <View style={styles.rewardsSectionHeader}>
          <ThemedText type="defaultSemiBold" style={styles.rewardsSectionTitle}>
            Nos partenaires ({partners.length})
          </ThemedText>
        </View>

        {partners.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyIcon}>🤝</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
              Pas encore de partenaires
            </ThemedText>
            <ThemedText color="secondary" style={styles.emptyText}>
              Les partenaires et leurs offres apparaîtront bientôt ici.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.partnersGrid}>
            {partners.map((partner) => (
              <View
                key={partner.id}
                style={[styles.partnerCard, { backgroundColor: rewardsCardColor, borderColor: rewardsCardBorderColor }]}
              >
                <View style={styles.partnerLogo}>
                  <ThemedText style={styles.partnerLogoText}>{partner.logo}</ThemedText>
                </View>
                <ThemedText type="defaultSemiBold" style={styles.partnerName}>
                  {partner.name}
                </ThemedText>
                <ThemedText color="secondary" style={styles.partnerCategory}>
                  {partner.category}
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Liste des offres */}
        {offers.length > 0 && (
          <>
            <View style={styles.rewardsSectionHeader}>
              <ThemedText type="defaultSemiBold" style={styles.rewardsSectionTitle}>
                Offres disponibles ({offers.length})
              </ThemedText>
            </View>

            {offers.map((offer) => {
              const canAfford = unitBalance >= offer.pointsCost;
              const diffStyle = getDifficultyColor(offer.pointsCost);

              return (
                <View
                  key={offer.id}
                  style={[
                    styles.offerCard,
                    { backgroundColor: rewardsCardColor, borderColor: rewardsCardBorderColor },
                    !canAfford && styles.offerCardDisabled,
                  ]}
                >
                  <View style={styles.offerHeader}>
                    <View style={styles.offerPartnerInfo}>
                      <ThemedText style={styles.offerPartnerLogo}>{offer.partner.logo}</ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.offerPartnerName}>
                        {offer.partner.name}
                      </ThemedText>
                    </View>
                    <View style={[styles.offerDiscountBadge, { backgroundColor: BrandColors.accent[500] }]}>
                      <ThemedText style={styles.offerDiscountText}>
                        {formatDiscount(offer)}
                      </ThemedText>
                    </View>
                  </View>

                  <ThemedText type="defaultSemiBold" style={styles.offerTitle}>
                    {offer.title}
                  </ThemedText>
                  <ThemedText color="secondary" style={styles.offerDescription}>
                    {offer.description}
                  </ThemedText>

                  <View style={styles.offerFooter}>
                    <View style={[styles.offerCostBadge, { backgroundColor: diffStyle.bg }]}>
                      <Ionicons name="star" size={12} color={diffStyle.color} />
                      <ThemedText style={[styles.offerCostText, { color: diffStyle.color }]}>
                        {offer.pointsCost} pts
                      </ThemedText>
                    </View>

                    {canAfford ? (
                      <View style={styles.offerAvailableBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#28A745" />
                        <ThemedText style={styles.offerAvailableText}>Disponible</ThemedText>
                      </View>
                    ) : (
                      <ThemedText style={styles.offerMissingPoints}>
                        Il manque {offer.pointsCost - unitBalance} pts
                      </ThemedText>
                    )}
                  </View>

                  {offer.minPurchase && (
                    <ThemedText style={[styles.offerCondition, { color: BrandColors.accent[500] }]}>
                      Dès {offer.minPurchase}€ d'achat
                    </ThemedText>
                  )}
                </View>
              );
            })}

            {/* Note pour les scouts */}
            <View style={[styles.scoutNote, { backgroundColor: `${BrandColors.primary[500]}10` }]}>
              <Ionicons name="information-circle" size={20} color={BrandColors.primary[500]} />
              <ThemedText style={[styles.scoutNoteText, { color: BrandColors.primary[600] }]}>
                Les échanges de points sont effectués par ton animateur. Continue à relever des défis pour augmenter le solde de ton unité !
              </ThemedText>
            </View>
          </>
        )}
      </>
    );
  }

  const renderChallengesContent = () => {
    return (
      <>
        {/* Section Défis en cours */}
        <StartedChallengesSection
          challenges={challenges}
          submissions={submissions}
          onChallengePress={handleChallengeClick}
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
                completedCount={challenge.participantsCount || 0}
                onPress={() => handleChallengeClick(challenge)}
              />
            ))}
          </View>
        )}
      </>
    );
  };

  // Get challenge progress - 0 for not started, 50 for started, 100 for completed/pending
  const getChallengeProgress = (challenge: Challenge) => {
    if (isCompleted(challenge.id)) return 100;
    if (isPendingValidation(challenge.id)) return 100;
    if (isStarted(challenge.id)) return 50;
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
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={levelInfo.levelColor} translucent />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header - scrolle avec le contenu */}
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
    isStarted,
    canStart,
    canSubmit,
  } = useChallengeProgress(challenge.id);

  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const overlayColor = useThemeColor({}, 'overlay');
  const successBackground = useThemeColor({}, 'successBackground');
  const warningBackground = useThemeColor({}, 'warningBackground');
  const infoBackground = useThemeColor({}, 'infoBackground');
  const startedBackground = useThemeColor({}, 'infoBackground');
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const handleGoToChallenge = () => {
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
            {isStarted && (
              <View style={[styles.statusBadge, { backgroundColor: startedBackground }]}>
                <Ionicons name="play-circle" size={18} color={tintColor} />
                <ThemedText style={[styles.statusBadgeText, { color: tintColor }]}>En cours</ThemedText>
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

            {/* Participants count */}
            {(challenge.participantsCount || 0) > 0 && (
              <View style={styles.participantsRow}>
                <Ionicons name="people" size={18} color={BrandColors.primary[500]} />
                <ThemedText style={styles.participantsModalText}>
                  {challenge.participantsCount} scout{challenge.participantsCount !== 1 ? 's' : ''} {challenge.participantsCount !== 1 ? 'ont' : 'a'} complété ce défi
                </ThemedText>
              </View>
            )}

            {/* Photo notice - seulement si défi commencé */}
            {isStarted && (
              <View style={[styles.photoNotice, { backgroundColor: infoBackground }]}>
                <View style={[styles.photoNoticeIcon, { backgroundColor: cardColor }]}>
                  <Ionicons name="camera" size={20} color={tintColor} />
                </View>
                <ThemedText style={[styles.photoNoticeText, { color: tintColor }]}>
                  Tu peux ajouter une photo pour prouver ta réalisation
                </ThemedText>
              </View>
            )}

            {/* Button - Commencer le défi (si pas de soumission) */}
            {canStart && !isStarted && (
              <TouchableOpacity
                style={[styles.takePhotoButton, { backgroundColor: BrandColors.primary[500] }]}
                onPress={handleGoToChallenge}
              >
                <Ionicons name="play" size={24} color="#FFFFFF" />
                <ThemedText style={styles.takePhotoButtonText}>
                  Commencer le défi
                </ThemedText>
              </TouchableOpacity>
            )}

            {/* Button - Soumettre ma preuve (si défi commencé) */}
            {isStarted && (
              <TouchableOpacity
                style={[styles.takePhotoButton, { backgroundColor: BrandColors.accent[500] }]}
                onPress={handleGoToChallenge}
              >
                <Ionicons name="camera" size={24} color="#FFFFFF" />
                <ThemedText style={styles.takePhotoButtonText}>
                  Soumettre ma preuve
                </ThemedText>
              </TouchableOpacity>
            )}

            {isCompleted && submission && (
              <View style={[styles.completedInfo, { backgroundColor: successBackground }]}>
                <ThemedText color="success" style={styles.completedInfoText}>
                  Complété le {formatDate(submission.validatedAt || submission.submittedAt || new Date())}
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
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: BrandColors.primary[50],
    borderRadius: 12,
  },
  participantsModalText: {
    fontSize: 14,
    fontWeight: '500',
    color: BrandColors.primary[700],
    flex: 1,
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

  // Rewards styles
  rewardsBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
  },
  rewardsBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardsBannerContent: {
    flex: 1,
  },
  rewardsBannerTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  rewardsBannerText: {
    fontSize: 13,
    lineHeight: 18,
  },
  unitBalanceCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  unitBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  unitBalanceInfo: {
    flex: 1,
  },
  unitBalanceLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  unitBalanceValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  unitBalanceContribution: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  unitBalanceContributionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  rewardsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  rewardsSectionTitle: {
    fontSize: 17,
  },
  partnersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  partnerCard: {
    width: '47%',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  partnerLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  partnerLogoText: {
    fontSize: 24,
  },
  partnerName: {
    fontSize: 14,
    textAlign: 'center',
  },
  partnerCategory: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  offerCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  offerCardDisabled: {
    opacity: 0.7,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  offerPartnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offerPartnerLogo: {
    fontSize: 20,
  },
  offerPartnerName: {
    fontSize: 14,
  },
  offerDiscountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  offerDiscountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  offerTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  offerCostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  offerCostText: {
    fontSize: 13,
    fontWeight: '600',
  },
  offerAvailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offerAvailableText: {
    fontSize: 12,
    color: '#28A745',
    fontWeight: '500',
  },
  offerMissingPoints: {
    fontSize: 12,
    color: '#F5A623',
    fontWeight: '500',
  },
  offerCondition: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  scoutNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  scoutNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
