import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, TouchableOpacity, Alert, Platform, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { AnimatorChallengeCard } from '@/src/features/challenges/components/animator-challenge-card';
import { useChallenges, useSectionLeaderboard, useLeaderboard } from '@/src/features/challenges/hooks';
import { LeaderboardSubTabs, LeaderboardTab } from '@/src/features/challenges/components/leaderboard-sub-tabs';
import { LeaderboardPodium } from '@/src/features/challenges/components/leaderboard-podium';
import { LeaderboardList } from '@/src/features/challenges/components/leaderboard-list';
import { SectionLeaderboardPodium } from '@/src/features/challenges/components/section-leaderboard-podium';
import { SectionLeaderboardList } from '@/src/features/challenges/components/section-leaderboard-list';
import { useAuth } from '@/context/auth-context';
import { Challenge, ChallengeStatus } from '@/types';
import { Animator } from '@/types';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { ChallengeSubmissionService } from '@/services/challenge-submission-service';
import { ChallengeService } from '@/src/features/challenges/services/challenge-service';
import { UnitService } from '@/services/unit-service';
import { PartnerService } from '@/services/partner-service';
import { Partner, PartnerOffer } from '@/types/partners';

const STATUS_BAR_HEIGHT = Platform.select({
  ios: Constants.statusBarHeight || 44,
  android: Constants.statusBarHeight || 24,
  web: 0,
  default: 0,
});

// Couleurs pour l'onglet récompenses
const rewardColors = {
  primary: '#2D5A45',
  accent: '#E07B4C',
  accentLight: '#FEF3EE',
  dark: '#1A2E28',
  neutral: '#8B7E74',
  neutralLight: '#C4BBB3',
  mist: '#E8EDE9',
  canvas: '#FDFCFB',
  cardBg: '#FFFFFF',
  success: '#28A745',
  warning: '#F5A623',
};

type MainTab = 'defis' | 'recompenses' | 'classement';
type AnimatorFilter = 'active' | 'completed' | 'archived';

export default function AnimatorChallengesScreen() {
  const { user } = useAuth();
  const animator = user as Animator;
  const { challenges, loading, error, refetch } = useChallenges();

  // Onglet principal
  const [mainTab, setMainTab] = useState<MainTab>('defis');

  // Sous-onglet classement
  const [leaderboardSubTab, setLeaderboardSubTab] = useState<LeaderboardTab>('individual');

  // Hooks leaderboard
  const { podiumUsers, otherUsers, loading: leaderboardLoading } = useLeaderboard({ unitId: animator?.unitId });
  const { podiumSections, otherSections, loading: sectionLeaderboardLoading } = useSectionLeaderboard({ unitId: animator?.unitId });

  useFocusEffect(
    useCallback(() => {
      refetch();
      loadUnitStats();
      loadUnitBalance();
      if (mainTab === 'recompenses') {
        loadRewardsData();
      }
    }, [mainTab])
  );

  // Charger uniquement le solde de points (léger)
  const loadUnitBalance = useCallback(async () => {
    if (!animator?.unitId) return;
    try {
      const balance = await PartnerService.getUnitPointsBalance(animator.unitId);
      setUnitBalance(balance);
    } catch (error) {
      console.error('Erreur chargement solde points:', error);
    }
  }, [animator?.unitId]);

  const [activeFilter, setActiveFilter] = useState<AnimatorFilter>('active');
  const [pendingValidations, setPendingValidations] = useState(0);
  const [totalScouts, setTotalScouts] = useState(0);
  const [challengeStats, setChallengeStats] = useState<Record<string, {
    participantsCount: number;
    completedCount: number;
    inProgressCount: number;
  }>>({});

  // États récompenses
  const [partners, setPartners] = useState<Partner[]>([]);
  const [offers, setOffers] = useState<(PartnerOffer & { partner: Partner })[]>([]);
  const [unitBalance, setUnitBalance] = useState(0);
  const [rewardsLoading, setRewardsLoading] = useState(false);

  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Charger les stats de l'unité
  const loadUnitStats = async () => {
    if (!animator?.unitId) return;

    try {
      const pending = await ChallengeSubmissionService.getPendingSubmissions(animator.unitId);
      setPendingValidations(pending.length);

      const scouts = await UnitService.getScoutsByUnit(animator.unitId);
      setTotalScouts(scouts.length);
    } catch (err) {
      console.error('Erreur chargement stats unité:', err);
    }
  };

  // Charger les données des récompenses
  const loadRewardsData = useCallback(async () => {
    if (!animator?.unitId) return;

    setRewardsLoading(true);
    try {
      const [partnersData, offersData, balance] = await Promise.all([
        PartnerService.getPartners(),
        PartnerService.getAllActiveOffers(),
        PartnerService.getUnitPointsBalance(animator.unitId),
      ]);
      setPartners(partnersData);
      setOffers(offersData);
      setUnitBalance(balance);
    } catch (error) {
      console.error('Erreur chargement récompenses:', error);
    } finally {
      setRewardsLoading(false);
    }
  }, [animator?.unitId]);

  // Charger les récompenses quand on change d'onglet
  useEffect(() => {
    if (mainTab === 'recompenses') {
      loadRewardsData();
    }
  }, [mainTab, loadRewardsData]);

  useEffect(() => {
    loadUnitStats();
  }, [animator?.unitId]);

  // Charger les stats par défi
  useEffect(() => {
    const loadChallengeStats = async () => {
      if (!animator?.unitId || challenges.length === 0) return;

      const stats: Record<string, any> = {};

      for (const challenge of challenges) {
        try {
          const submissions = await ChallengeSubmissionService.getSubmissionsByChallenge(challenge.id);
          stats[challenge.id] = {
            participantsCount: submissions.length,
            completedCount: submissions.filter(s => s.status === ChallengeStatus.COMPLETED).length,
            inProgressCount: submissions.filter(s => s.status === ChallengeStatus.STARTED || s.status === ChallengeStatus.PENDING_VALIDATION).length,
          };
        } catch {
          stats[challenge.id] = { participantsCount: 0, completedCount: 0, inProgressCount: 0 };
        }
      }

      setChallengeStats(stats);
    };

    loadChallengeStats();
  }, [challenges, animator?.unitId]);

  // Helpers pour filtrer les défis
  const isArchivedChallenge = (challenge: Challenge) => {
    return challenge.isArchived === true;
  };

  const isActiveChallenge = (challenge: Challenge) => {
    if (isArchivedChallenge(challenge)) return false;
    const now = new Date();
    const start = new Date(challenge.startDate);
    const end = new Date(challenge.endDate);
    return now >= start && now <= end;
  };

  const isEndedChallenge = (challenge: Challenge) => {
    if (isArchivedChallenge(challenge)) return false;
    const now = new Date();
    const end = new Date(challenge.endDate);
    return now > end;
  };

  // Stats counts
  const counts = useMemo(() => ({
    active: challenges.filter(c => isActiveChallenge(c)).length,
    completed: challenges.filter(c => isEndedChallenge(c)).length,
    archived: challenges.filter(c => isArchivedChallenge(c)).length,
  }), [challenges]);

  // Filtrer les défis
  const filteredChallenges = useMemo(() => {
    switch (activeFilter) {
      case 'active':
        return challenges.filter(isActiveChallenge);
      case 'completed':
        return challenges.filter(isEndedChallenge);
      case 'archived':
        return challenges.filter(isArchivedChallenge);
      default:
        return challenges;
    }
  }, [challenges, activeFilter]);

  // Calculer jours restants
  const getDaysRemaining = (challenge: Challenge) => {
    const now = new Date();
    const end = new Date(challenge.endDate);
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  // Helpers récompenses
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'alimentation':
        return '🛒';
      case 'sport':
        return '⚽';
      case 'bricolage':
        return '🔨';
      case 'outdoor':
        return '🏕️';
      default:
        return '🏪';
    }
  };

  // Helper pour détecter si c'est une URL d'image
  const isImageUrl = (str: string | undefined): boolean => {
    if (!str) return false;
    return str.startsWith('http://') ||
           str.startsWith('https://') ||
           str.startsWith('data:image') ||
           str.includes('firebasestorage.googleapis.com');
  };

  const formatDiscount = (offer: PartnerOffer) => {
    if (offer.discountType === 'percentage') {
      return `-${offer.discountValue}%`;
    }
    return `-${offer.discountValue}€`;
  };

  // Actions défis
  const handleEdit = (challenge: Challenge) => {
    router.push(`/(animator)/challenges/${challenge.id}` as any);
  };

  const handleDelete = async (challenge: Challenge) => {
    // Utiliser window.confirm pour la compatibilité web (Alert.alert ne fonctionne pas sur web)
    const confirmed = window.confirm(
      `Supprimer le défi\n\nÊtes-vous sûr de vouloir supprimer "${challenge.title}" ?\n\nCette action est irréversible.`
    );

    if (!confirmed) return;

    try {
      await ChallengeService.deleteChallenge(challenge.id);
      refetch();
    } catch (err) {
      window.alert('Erreur: Impossible de supprimer le défi');
    }
  };

  const handleArchive = async (challenge: Challenge) => {
    console.log('[Archive] Starting for:', challenge.id, challenge.title);
    try {
      await ChallengeService.archiveChallenge(challenge.id);
      console.log('[Archive] Success! Refetching...');
      Alert.alert('✅ Succès', 'Le défi a été archivé');
      refetch();
    } catch (error) {
      console.error('[Archive] Error:', error);
      Alert.alert('❌ Erreur', 'Impossible d\'archiver le défi');
    }
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Défis
          </ThemedText>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/(animator)/challenges/create')}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <ThemedText style={styles.createButtonText}>Créer</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Onglets principaux */}
        <View style={styles.mainTabs}>
          <TouchableOpacity
            style={[
              styles.mainTab,
              mainTab === 'defis' && styles.mainTabActive,
            ]}
            onPress={() => setMainTab('defis')}
          >
            <Text style={styles.tabEmoji}>🏆</Text>
            <ThemedText
              style={[
                styles.mainTabText,
                { color: mainTab === 'defis' ? BrandColors.primary[600] : textSecondary },
              ]}
            >
              Défis
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.mainTab,
              mainTab === 'classement' && styles.mainTabActive,
            ]}
            onPress={() => setMainTab('classement')}
          >
            <Text style={styles.tabEmoji}>🏅</Text>
            <ThemedText
              style={[
                styles.mainTabText,
                { color: mainTab === 'classement' ? BrandColors.primary[600] : textSecondary },
              ]}
            >
              Classement
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.mainTab,
              mainTab === 'recompenses' && styles.mainTabActive,
            ]}
            onPress={() => setMainTab('recompenses')}
          >
            <Text style={styles.tabEmoji}>🎁</Text>
            <ThemedText
              style={[
                styles.mainTabText,
                { color: mainTab === 'recompenses' ? BrandColors.primary[600] : textSecondary },
              ]}
            >
              Récompenses
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* === CONTENU DÉFIS === */}
        {mainTab === 'defis' && (
          <>
            {/* Carte Points de l'unité */}
            <TouchableOpacity
              style={styles.pointsCard}
              onPress={() => setMainTab('recompenses')}
              activeOpacity={0.9}
            >
              <View>
                <Text style={styles.pointsCardLabel}>Points de l'unité</Text>
                <View style={styles.pointsCardValue}>
                  <Ionicons name="star" size={20} color={BrandColors.accent[500]} />
                  <Text style={styles.pointsCardNumber}>{unitBalance.toLocaleString()}</Text>
                </View>
              </View>
              <View style={styles.pointsCardButton}>
                <Text style={styles.pointsCardButtonText}>Voir récompenses</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Bandeau Validations */}
            {pendingValidations > 0 && (
              <TouchableOpacity
                style={styles.validationBanner}
                onPress={() => router.push('/(animator)/validate-challenges')}
                activeOpacity={0.8}
              >
                <View style={styles.validationIconContainer}>
                  <Ionicons name="notifications" size={20} color={BrandColors.accent[600]} />
                </View>
                <View style={styles.validationTextContainer}>
                  <ThemedText style={styles.validationTitle}>
                    {pendingValidations} soumission{pendingValidations > 1 ? 's' : ''} à valider
                  </ThemedText>
                  <ThemedText style={styles.validationSubtitle}>Tap pour voir</ThemedText>
                </View>
                <View style={styles.validationBadge}>
                  <ThemedText style={styles.validationBadgeText}>{pendingValidations}</ThemedText>
                </View>
              </TouchableOpacity>
            )}

            {/* Stats Cards */}
            <View style={styles.statsCards}>
              <TouchableOpacity
                style={[
                  styles.statCard,
                  { backgroundColor: cardColor, borderColor: activeFilter === 'active' ? BrandColors.primary[500] : cardBorderColor },
                  activeFilter === 'active' && styles.statCardActive,
                ]}
                onPress={() => setActiveFilter('active')}
              >
                <ThemedText style={[styles.statValue, activeFilter === 'active' && styles.statValueActive]}>
                  {counts.active}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Actifs</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statCard,
                  { backgroundColor: cardColor, borderColor: activeFilter === 'completed' ? BrandColors.primary[500] : cardBorderColor },
                  activeFilter === 'completed' && styles.statCardActive,
                ]}
                onPress={() => setActiveFilter('completed')}
              >
                <ThemedText style={[styles.statValue, activeFilter === 'completed' && styles.statValueActive]}>
                  {counts.completed}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Terminés</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statCard,
                  { backgroundColor: cardColor, borderColor: activeFilter === 'archived' ? BrandColors.primary[500] : cardBorderColor },
                  activeFilter === 'archived' && styles.statCardActive,
                ]}
                onPress={() => setActiveFilter('archived')}
              >
                <ThemedText style={[styles.statValue, activeFilter === 'archived' && styles.statValueActive]}>
                  {counts.archived}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Archivés</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Challenges List */}
            {filteredChallenges.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyIcon}>🎯</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                  Aucun défi {activeFilter === 'active' ? 'actif' : activeFilter === 'completed' ? 'terminé' : 'archivé'}
                </ThemedText>
                <ThemedText color="secondary" style={styles.emptyText}>
                  {activeFilter === 'active'
                    ? 'Créez votre premier défi pour motiver vos scouts !'
                    : 'Les défis apparaîtront ici une fois terminés.'}
                </ThemedText>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {filteredChallenges.map(challenge => {
                  const stats = challengeStats[challenge.id] || { participantsCount: 0, completedCount: 0, inProgressCount: 0 };
                  return (
                    <AnimatorChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      totalScouts={totalScouts}
                      participantsCount={stats.participantsCount}
                      completedCount={stats.completedCount}
                      inProgressCount={stats.inProgressCount}
                      daysRemaining={getDaysRemaining(challenge)}
                      onPress={() => handleEdit(challenge)}
                      onEdit={() => handleEdit(challenge)}
                      onDelete={() => handleDelete(challenge)}
                      onArchive={() => handleArchive(challenge)}
                      canEdit={!!challenge.unitId && challenge.createdBy === user?.id}
                    />
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* === CONTENU CLASSEMENT === */}
        {mainTab === 'classement' && (
          <>
            {/* Sous-onglets Individuel / Sections */}
            <LeaderboardSubTabs
              activeTab={leaderboardSubTab}
              onTabChange={setLeaderboardSubTab}
            />

            {leaderboardSubTab === 'individual' ? (
              // Classement individuel
              leaderboardLoading ? (
                <View style={styles.rewardsLoadingContainer}>
                  <ActivityIndicator size="large" color={BrandColors.primary[500]} />
                </View>
              ) : (
                <>
                  {podiumUsers.length >= 3 && (
                    <LeaderboardPodium users={podiumUsers} />
                  )}
                  {otherUsers.length > 0 && (
                    <LeaderboardList users={otherUsers} startRank={4} />
                  )}
                  {podiumUsers.length === 0 && otherUsers.length === 0 && (
                    <View style={styles.emptyContainer}>
                      <ThemedText style={styles.emptyIcon}>🏆</ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                        Pas encore de classement
                      </ThemedText>
                      <ThemedText color="secondary" style={styles.emptyText}>
                        Les scouts apparaîtront ici quand ils auront des points.
                      </ThemedText>
                    </View>
                  )}
                </>
              )
            ) : (
              // Classement par sections
              sectionLeaderboardLoading ? (
                <View style={styles.rewardsLoadingContainer}>
                  <ActivityIndicator size="large" color={BrandColors.primary[500]} />
                </View>
              ) : (
                <>
                  {podiumSections.length >= 3 && (
                    <SectionLeaderboardPodium sections={podiumSections} />
                  )}
                  {otherSections.length > 0 && (
                    <SectionLeaderboardList sections={otherSections} startRank={4} />
                  )}
                  {podiumSections.length === 0 && otherSections.length === 0 && (
                    <View style={styles.emptyContainer}>
                      <ThemedText style={styles.emptyIcon}>🏕️</ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                        Pas encore de sections
                      </ThemedText>
                      <ThemedText color="secondary" style={styles.emptyText}>
                        Les sections apparaîtront ici quand elles auront des points.
                      </ThemedText>
                    </View>
                  )}
                </>
              )
            )}
          </>
        )}

        {/* === CONTENU RÉCOMPENSES === */}
        {mainTab === 'recompenses' && (
          <>
            {rewardsLoading ? (
              <View style={styles.rewardsLoadingContainer}>
                <ActivityIndicator size="large" color={rewardColors.primary} />
              </View>
            ) : (
              <>
                {/* Balance Card */}
                <View style={styles.balanceCard}>
                  <View style={styles.balanceHeader}>
                    <Text style={styles.balanceLabel}>Points de l'unité</Text>
                    <View style={styles.balanceBadge}>
                      <Ionicons name="star" size={16} color={rewardColors.accent} />
                    </View>
                  </View>
                  <Text style={styles.balanceValue}>{unitBalance.toLocaleString()}</Text>
                  <Text style={styles.balanceSubtitle}>
                    Points disponibles pour des récompenses
                  </Text>
                </View>

                {/* Bouton Historique */}
                <TouchableOpacity
                  style={styles.historyButton}
                  onPress={() => router.push('/(animator)/partners/history')}
                >
                  <View style={styles.historyButtonLeft}>
                    <Ionicons name="receipt-outline" size={20} color={rewardColors.primary} />
                    <Text style={styles.historyButtonText}>Historique des échanges</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={rewardColors.neutralLight} />
                </TouchableOpacity>

                {/* Offres populaires */}
                <Text style={styles.rewardSectionTitle}>🔥 Offres populaires</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.offersScroll}
                >
                  {offers.slice(0, 4).map((offer) => (
                    <TouchableOpacity
                      key={offer.id}
                      style={styles.offerCard}
                      onPress={() => router.push(`/(animator)/partners/offer/${offer.id}`)}
                    >
                      <View style={styles.offerHeader}>
                        {isImageUrl(offer.partner.logo) ? (
                          <Image source={{ uri: offer.partner.logo }} style={styles.offerLogoImage} contentFit="cover" />
                        ) : (
                          <Text style={styles.offerLogo}>{offer.partner.logo}</Text>
                        )}
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>{formatDiscount(offer)}</Text>
                        </View>
                      </View>
                      <Text style={styles.offerPartner}>{offer.partner.name}</Text>
                      <Text style={styles.offerTitle} numberOfLines={2}>
                        {offer.title}
                      </Text>
                      <View style={styles.offerFooter}>
                        <View style={styles.pointsCost}>
                          <Ionicons name="star" size={14} color={rewardColors.accent} />
                          <Text style={styles.pointsCostText}>{offer.pointsCost} pts</Text>
                        </View>
                        {unitBalance >= offer.pointsCost ? (
                          <View style={[styles.statusBadge, { backgroundColor: `${rewardColors.success}15` }]}>
                            <Text style={[styles.statusText, { color: rewardColors.success }]}>Disponible</Text>
                          </View>
                        ) : (
                          <View style={[styles.statusBadge, { backgroundColor: `${rewardColors.warning}15` }]}>
                            <Text style={[styles.statusText, { color: rewardColors.warning }]}>
                              -{offer.pointsCost - unitBalance} pts
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Liste des partenaires */}
                <Text style={styles.rewardSectionTitle}>🤝 Nos partenaires</Text>
                {partners.map((partner) => {
                  const partnerOffers = offers.filter((o) => o.partnerId === partner.id);
                  const minPoints = partnerOffers.length > 0
                    ? Math.min(...partnerOffers.map((o) => o.pointsCost))
                    : 0;

                  return (
                    <TouchableOpacity
                      key={partner.id}
                      style={styles.partnerCard}
                      onPress={() => router.push(`/(animator)/partners/${partner.id}`)}
                    >
                      <View style={styles.partnerLogo}>
                        {isImageUrl(partner.logo) ? (
                          <Image source={{ uri: partner.logo }} style={styles.partnerLogoImage} contentFit="cover" />
                        ) : (
                          <Text style={styles.partnerLogoText}>{partner.logo}</Text>
                        )}
                      </View>
                      <View style={styles.partnerInfo}>
                        <Text style={styles.partnerName}>{partner.name}</Text>
                        <Text style={styles.partnerDescription} numberOfLines={1}>
                          {partner.description}
                        </Text>
                        <View style={styles.partnerMeta}>
                          <Text style={styles.partnerCategory}>
                            {getCategoryIcon(partner.category)} {partner.category}
                          </Text>
                          {partnerOffers.length > 0 && (
                            <Text style={styles.partnerOffers}>
                              {partnerOffers.length} offre{partnerOffers.length > 1 ? 's' : ''} • dès {minPoints} pts
                            </Text>
                          )}
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={rewardColors.neutralLight} />
                    </TouchableOpacity>
                  );
                })}

                {partners.length === 0 && (
                  <View style={styles.rewardEmptyState}>
                    <Ionicons name="gift-outline" size={48} color={rewardColors.neutral} />
                    <Text style={styles.rewardEmptyStateText}>Aucun partenaire disponible</Text>
                    <Text style={styles.rewardEmptyStateSubtext}>
                      Les partenariats arrivent bientôt !
                    </Text>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
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
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_HEIGHT + 12,
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
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary[500],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  // Main Tabs
  mainTabs: {
    flexDirection: 'row',
    backgroundColor: NeutralColors.gray[100],
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  mainTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mainTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabEmoji: {
    fontSize: 14,
  },
  // Points Card
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BrandColors.primary[600],
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  pointsCardLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  pointsCardValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsCardNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pointsCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  pointsCardButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Validation Banner
  validationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.accent[50],
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  validationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  validationTextContainer: {
    flex: 1,
  },
  validationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: BrandColors.accent[700],
  },
  validationSubtitle: {
    fontSize: 13,
    color: BrandColors.accent[500],
    marginTop: 2,
  },
  validationBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BrandColors.accent[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  validationBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Stats Cards
  statsCards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  statCardActive: {
    backgroundColor: BrandColors.primary[50],
    borderColor: BrandColors.primary[500],
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statValueActive: {
    color: BrandColors.primary[600],
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  // List
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
  // === REWARDS STYLES ===
  rewardsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  // Balance Card
  balanceCard: {
    backgroundColor: rewardColors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  balanceBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceValue: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 8,
  },
  balanceSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  // Section Title
  rewardSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: rewardColors.dark,
    marginBottom: 16,
    marginTop: 12,
  },
  // Offers Scroll
  offersScroll: {
    paddingBottom: 16,
    gap: 12,
  },
  offerCard: {
    width: 180,
    backgroundColor: rewardColors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: rewardColors.mist,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  offerLogo: {
    fontSize: 32,
  },
  offerLogoImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  discountBadge: {
    backgroundColor: rewardColors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  offerPartner: {
    fontSize: 12,
    color: rewardColors.neutral,
    marginBottom: 2,
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: rewardColors.dark,
    marginBottom: 12,
    minHeight: 36,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsCostText: {
    fontSize: 13,
    fontWeight: '600',
    color: rewardColors.accent,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  // Partner Card
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rewardColors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: rewardColors.mist,
  },
  partnerLogo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: rewardColors.mist,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  partnerLogoText: {
    fontSize: 28,
  },
  partnerLogoImage: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '700',
    color: rewardColors.dark,
    marginBottom: 2,
  },
  partnerDescription: {
    fontSize: 13,
    color: rewardColors.neutral,
    marginBottom: 8,
  },
  partnerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partnerCategory: {
    fontSize: 12,
    color: rewardColors.neutralLight,
    textTransform: 'capitalize',
  },
  partnerOffers: {
    fontSize: 12,
    color: rewardColors.primary,
    fontWeight: '500',
  },
  // Empty State
  rewardEmptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: rewardColors.cardBg,
    borderRadius: 16,
    gap: 12,
  },
  rewardEmptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: rewardColors.dark,
  },
  rewardEmptyStateSubtext: {
    fontSize: 14,
    color: rewardColors.neutral,
    textAlign: 'center',
  },
  // History Button
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: rewardColors.cardBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: rewardColors.mist,
  },
  historyButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: rewardColors.dark,
  },
});
