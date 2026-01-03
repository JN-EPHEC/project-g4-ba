import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { AnimatorChallengeCard } from '@/src/features/challenges/components/animator-challenge-card';
import { useChallenges } from '@/src/features/challenges/hooks';
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

type MainTab = 'defis' | 'recompenses';
type AnimatorFilter = 'active' | 'completed' | 'archived';

export default function AnimatorChallengesScreen() {
  const { user } = useAuth();
  const animator = user as Animator;
  const { challenges, loading, error, refetch } = useChallenges();

  useFocusEffect(
    useCallback(() => {
      refetch();
      loadUnitStats();
    }, [])
  );

  const [activeFilter, setActiveFilter] = useState<AnimatorFilter>('active');
  const [pendingValidations, setPendingValidations] = useState(0);
  const [totalScouts, setTotalScouts] = useState(0);
  const [challengeStats, setChallengeStats] = useState<Record<string, {
    participantsCount: number;
    completedCount: number;
    inProgressCount: number;
  }>>({});

  // Onglet principal (Défis / Récompenses)
  const [mainTab, setMainTab] = useState<MainTab>('defis');

  // États partenaires/récompenses
  const [partners, setPartners] = useState<Partner[]>([]);
  const [offers, setOffers] = useState<(PartnerOffer & { partner: Partner })[]>([]);
  const [unitBalance, setUnitBalance] = useState(0);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [pendingRedemptions, setPendingRedemptions] = useState(0);
  const [requestingOffer, setRequestingOffer] = useState<string | null>(null);

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
      const [balance, activeOffers, allPartners, pendingCount] = await Promise.all([
        PartnerService.getUnitPointsBalance(animator.unitId),
        PartnerService.getAllActiveOffers(),
        PartnerService.getPartners(),
        PartnerService.getPendingRedemptionsCount(animator.unitId),
      ]);

      setUnitBalance(balance);
      setOffers(activeOffers);
      setPartners(allPartners);
      setPendingRedemptions(pendingCount);
    } catch (error) {
      console.error('Erreur chargement récompenses:', error);
    } finally {
      setRewardsLoading(false);
    }
  }, [animator?.unitId]);

  // Demander un échange (avec validation par 3 animateurs)
  const handleRequestRedemption = async (offer: PartnerOffer & { partner: Partner }) => {
    if (!animator?.unitId || !animator?.id) return;

    const animatorName = `${animator.firstName} ${animator.lastName}`;

    Alert.alert(
      'Demander un échange',
      `Voulez-vous demander l'échange "${offer.title}" pour ${offer.pointsCost} points ?\n\nCette demande devra être approuvée par 3 animateurs avant que les points ne soient déduits.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Demander',
          onPress: async () => {
            setRequestingOffer(offer.id);
            try {
              const result = await PartnerService.requestRedemption(
                offer.id,
                animator.id,
                animatorName,
                animator.unitId
              );

              if (result.success) {
                Alert.alert(
                  'Demande envoyée',
                  'Votre demande a été créée. Elle doit être approuvée par 3 animateurs pour être validée.',
                  [{ text: 'OK' }]
                );
                loadRewardsData(); // Recharger pour mettre à jour le compteur
              } else {
                Alert.alert('Erreur', result.error || 'Impossible de créer la demande');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue');
            } finally {
              setRequestingOffer(null);
            }
          },
        },
      ]
    );
  };

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

  // Helpers pour filtrer
  const isArchivedChallenge = (challenge: Challenge) => {
    // Archivé manuellement par l'animateur
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

  // Actions
  const handleEdit = (challenge: Challenge) => {
    router.push(`/(animator)/challenges/${challenge.id}` as any);
  };

  const handleDelete = (challenge: Challenge) => {
    Alert.alert(
      'Supprimer le défi',
      `Êtes-vous sûr de vouloir supprimer "${challenge.title}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await ChallengeService.deleteChallenge(challenge.id);
              refetch();
            } catch (err) {
              Alert.alert('Erreur', 'Impossible de supprimer le défi');
            }
          },
        },
      ]
    );
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
            {mainTab === 'defis' ? 'Défis' : 'Récompenses'}
          </ThemedText>
          <View style={styles.headerActions}>
            {mainTab === 'defis' ? (
              <>
                <TouchableOpacity
                  style={styles.statsButton}
                  onPress={() => router.push('/(animator)/challenges/kpi')}
                >
                  <Ionicons name="stats-chart" size={22} color={textColor} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => router.push('/(animator)/challenges/create')}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.createButtonText}>Créer</ThemedText>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => router.push('/(animator)/partners/history')}
              >
                <Ionicons name="time-outline" size={22} color={textColor} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Onglets principaux Défis / Récompenses */}
        <View style={styles.mainTabs}>
          <TouchableOpacity
            style={[
              styles.mainTab,
              mainTab === 'defis' && styles.mainTabActive,
            ]}
            onPress={() => setMainTab('defis')}
          >
            <Ionicons
              name="trophy"
              size={18}
              color={mainTab === 'defis' ? BrandColors.primary[600] : textSecondary}
            />
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
              mainTab === 'recompenses' && styles.mainTabActive,
            ]}
            onPress={() => setMainTab('recompenses')}
          >
            <Ionicons
              name="gift"
              size={18}
              color={mainTab === 'recompenses' ? BrandColors.accent[600] : textSecondary}
            />
            <ThemedText
              style={[
                styles.mainTabText,
                { color: mainTab === 'recompenses' ? BrandColors.accent[600] : textSecondary },
              ]}
            >
              Récompenses
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* === CONTENU DÉFIS === */}
        {mainTab === 'defis' && (
          <>
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

            {/* Filter Tabs */}
            <View style={styles.filterTabs}>
              {(['active', 'completed', 'archived'] as AnimatorFilter[]).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterTab,
                    activeFilter === filter && styles.filterTabActive,
                  ]}
                  onPress={() => setActiveFilter(filter)}
                >
                  <ThemedText
                    style={[
                      styles.filterTabText,
                      { color: activeFilter === filter ? '#FFFFFF' : textSecondary },
                    ]}
                  >
                    {filter === 'active' ? 'Actifs' : filter === 'completed' ? 'Terminés' : 'Archivés'}
                  </ThemedText>
                </TouchableOpacity>
              ))}
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
                      canEdit={!!challenge.unitId}
                    />
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* === CONTENU RÉCOMPENSES === */}
        {mainTab === 'recompenses' && (
          <>
            {rewardsLoading ? (
              <View style={styles.rewardsLoadingContainer}>
                <ActivityIndicator size="large" color={BrandColors.accent[500]} />
                <ThemedText color="secondary">Chargement des récompenses...</ThemedText>
              </View>
            ) : (
              <>
                {/* Bandeau demandes en attente */}
                {pendingRedemptions > 0 && (
                  <TouchableOpacity
                    style={styles.pendingRedemptionsBanner}
                    onPress={() => router.push('/(animator)/partners/pending-approvals')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.pendingRedemptionsIconContainer}>
                      <Ionicons name="hourglass" size={20} color={BrandColors.primary[600]} />
                    </View>
                    <View style={styles.pendingRedemptionsTextContainer}>
                      <ThemedText style={styles.pendingRedemptionsTitle}>
                        {pendingRedemptions} demande{pendingRedemptions > 1 ? 's' : ''} en attente
                      </ThemedText>
                      <ThemedText style={styles.pendingRedemptionsSubtitle}>
                        Approbation requise de 3 animateurs
                      </ThemedText>
                    </View>
                    <View style={styles.pendingRedemptionsBadge}>
                      <ThemedText style={styles.pendingRedemptionsBadgeText}>{pendingRedemptions}</ThemedText>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Solde de points de l'unité */}
                <View style={[styles.balanceCard, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
                  <View style={styles.balanceHeader}>
                    <View style={[styles.balanceIconContainer, { backgroundColor: BrandColors.accent[100] }]}>
                      <Ionicons name="wallet" size={24} color={BrandColors.accent[600]} />
                    </View>
                    <View>
                      <ThemedText style={styles.balanceTitle}>Solde de l'unité</ThemedText>
                      <ThemedText style={[styles.balanceSubtitle, { color: textSecondary }]}>
                        Points accumulés par vos scouts
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={[styles.balanceValue, { color: BrandColors.accent[600] }]}>
                    {unitBalance.toLocaleString()} pts
                  </ThemedText>
                  <ThemedText style={[styles.balanceHint, { color: textSecondary }]}>
                    Échangez ces points contre des offres partenaires
                  </ThemedText>
                </View>

                {/* Info validation */}
                <View style={[styles.validationInfoBanner, { backgroundColor: `${BrandColors.primary[500]}10` }]}>
                  <Ionicons name="shield-checkmark" size={18} color={BrandColors.primary[500]} />
                  <ThemedText style={[styles.validationInfoText, { color: BrandColors.primary[600] }]}>
                    Chaque échange nécessite l'approbation de 3 animateurs avant déduction des points.
                  </ThemedText>
                </View>

                {/* Partenaires */}
                {partners.length > 0 && (
                  <>
                    <ThemedText style={styles.sectionTitle}>Nos partenaires</ThemedText>
                    <View style={styles.partnersGrid}>
                      {partners.map(partner => (
                        <View
                          key={partner.id}
                          style={[styles.partnerCard, { backgroundColor: cardColor, borderColor: cardBorderColor }]}
                        >
                          <ThemedText style={styles.partnerLogo}>{partner.logo}</ThemedText>
                          <ThemedText style={styles.partnerName}>{partner.name}</ThemedText>
                          <ThemedText style={[styles.partnerCategory, { color: textSecondary }]}>
                            {partner.category}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* Offres disponibles */}
                <ThemedText style={styles.sectionTitle}>Offres disponibles</ThemedText>
                {offers.length === 0 ? (
                  <View style={styles.noOffersContainer}>
                    <Ionicons name="gift-outline" size={48} color={textSecondary} />
                    <ThemedText style={[styles.noOffersText, { color: textSecondary }]}>
                      Aucune offre disponible pour le moment
                    </ThemedText>
                  </View>
                ) : (
                  <View style={styles.offersContainer}>
                    {offers.map(offer => {
                      const canRedeem = unitBalance >= offer.pointsCost;
                      return (
                        <View
                          key={offer.id}
                          style={[styles.offerCard, { backgroundColor: cardColor, borderColor: cardBorderColor }]}
                        >
                          <View style={styles.offerHeader}>
                            <View style={styles.offerPartner}>
                              <ThemedText style={styles.offerPartnerLogo}>{offer.partner.logo}</ThemedText>
                              <ThemedText style={[styles.offerPartnerName, { color: textSecondary }]}>
                                {offer.partner.name}
                              </ThemedText>
                            </View>
                            <View style={[styles.offerCostBadge, { backgroundColor: BrandColors.accent[100] }]}>
                              <ThemedText style={[styles.offerCostText, { color: BrandColors.accent[700] }]}>
                                {offer.pointsCost} pts
                              </ThemedText>
                            </View>
                          </View>
                          <ThemedText style={styles.offerTitle}>{offer.title}</ThemedText>
                          <ThemedText style={[styles.offerDescription, { color: textSecondary }]}>
                            {offer.description}
                          </ThemedText>
                          <View style={styles.offerFooter}>
                            <ThemedText style={[styles.offerValidity, { color: textSecondary }]}>
                              Valide {offer.validityDays} jours
                            </ThemedText>
                            <TouchableOpacity
                              style={[
                                styles.redeemButton,
                                { backgroundColor: BrandColors.accent[500] },
                                (!canRedeem || requestingOffer === offer.id) && styles.redeemButtonDisabled,
                              ]}
                              disabled={!canRedeem || requestingOffer === offer.id}
                              onPress={() => handleRequestRedemption(offer)}
                            >
                              {requestingOffer === offer.id ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <>
                                  <Ionicons name="hand-left" size={16} color="#FFFFFF" />
                                  <ThemedText style={styles.redeemButtonText}>
                                    {canRedeem ? 'Demander' : 'Points insuffisants'}
                                  </ThemedText>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsButton: {
    padding: 8,
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
  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterTab: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: NeutralColors.gray[100],
  },
  filterTabActive: {
    backgroundColor: BrandColors.primary[500],
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
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
  // Main Tabs (Défis / Récompenses)
  mainTabs: {
    flexDirection: 'row',
    backgroundColor: NeutralColors.gray[100],
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
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
    fontSize: 15,
    fontWeight: '600',
  },
  historyButton: {
    padding: 8,
  },
  // Rewards Content
  rewardsLoadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  balanceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  balanceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  balanceSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 8,
  },
  balanceHint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  // Partners Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  partnersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  partnerCard: {
    width: '47%',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  partnerLogo: {
    fontSize: 32,
    marginBottom: 8,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  partnerCategory: {
    fontSize: 12,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  // Offers Section
  offersContainer: {
    gap: 12,
    marginBottom: 24,
  },
  offerCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  offerPartner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offerPartnerLogo: {
    fontSize: 24,
  },
  offerPartnerName: {
    fontSize: 13,
    fontWeight: '500',
  },
  offerCostBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offerCostText: {
    fontSize: 13,
    fontWeight: '700',
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '700',
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
  },
  offerValidity: {
    fontSize: 12,
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  redeemButtonDisabled: {
    opacity: 0.5,
  },
  redeemButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  noOffersContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noOffersText: {
    fontSize: 15,
    marginTop: 12,
  },
  // Pending Redemptions Banner
  pendingRedemptionsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary[50],
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  pendingRedemptionsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pendingRedemptionsTextContainer: {
    flex: 1,
  },
  pendingRedemptionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: BrandColors.primary[700],
  },
  pendingRedemptionsSubtitle: {
    fontSize: 13,
    color: BrandColors.primary[500],
    marginTop: 2,
  },
  pendingRedemptionsBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BrandColors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingRedemptionsBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Validation Info Banner
  validationInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  validationInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
