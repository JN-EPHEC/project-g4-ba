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

const STATUS_BAR_HEIGHT = Platform.select({
  ios: Constants.statusBarHeight || 44,
  android: Constants.statusBarHeight || 24,
  web: 0,
  default: 0,
});

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
          <ThemedText type="title" style={styles.headerTitle}>Défis</ThemedText>
          <View style={styles.headerActions}>
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
          </View>
        </View>

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
              <ThemedText style={styles.validationSubtitle}>Tap pour voir →</ThemedText>
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
                />
              );
            })}
          </View>
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
});
