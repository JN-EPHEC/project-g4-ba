import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/context/auth-context';
import { ChallengeKPIService, ChallengeKPI, ChallengeStats } from '@/src/features/challenges/services/challenge-kpi-service';
import { useChallenges } from '@/src/features/challenges/hooks/use-challenges';
import { StartedByScoutsSection } from '@/src/features/challenges/components/started-by-scouts-section';
import { Animator } from '@/types';
import { BrandColors, NeutralColors } from '@/constants/theme';

export default function ChallengesKPIScreen() {
  const { user } = useAuth();
  const animator = user as Animator;
  const { challenges } = useChallenges();
  const [globalStats, setGlobalStats] = useState<ChallengeKPI | null>(null);
  const [challengeStats, setChallengeStats] = useState<ChallengeStats[]>([]);
  const [popularChallenges, setPopularChallenges] = useState<ChallengeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadKPIData();
  }, [animator?.unitId]);

  const loadKPIData = async () => {
    if (!animator?.unitId) return;

    try {
      setLoading(true);
      setError(null);

      const [stats, challenges, popular] = await Promise.all([
        ChallengeKPIService.getGlobalStats(animator.unitId),
        ChallengeKPIService.getChallengeStats(animator.unitId),
        ChallengeKPIService.getPopularChallenges(animator.unitId, 5),
      ]);

      setGlobalStats(stats);
      setChallengeStats(challenges);
      setPopularChallenges(popular);
    } catch (err) {
      console.error('Erreur lors du chargement des KPI:', err);
      setError('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 70) return BrandColors.primary[500];
    if (rate >= 30) return BrandColors.accent[500];
    return '#ef4444';
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText color="secondary" style={styles.loadingText}>
            Chargement des statistiques...
          </ThemedText>
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
          <TouchableOpacity style={styles.retryButton} onPress={loadKPIData}>
            <ThemedText style={styles.retryText}>Réessayer</ThemedText>
          </TouchableOpacity>
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
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: cardBorderColor }]}
            onPress={() => router.replace('/(animator)/challenges')}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Statistiques
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* Global Stats Cards */}
        {globalStats && (
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: BrandColors.primary[50] }]}>
              <ThemedText style={styles.statEmoji}>🎯</ThemedText>
              <ThemedText style={[styles.statValue, { color: BrandColors.primary[700] }]}>
                {globalStats.totalChallenges}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: BrandColors.primary[600] }]}>
                Défis créés
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: BrandColors.accent[50] }]}>
              <ThemedText style={styles.statEmoji}>⚡</ThemedText>
              <ThemedText style={[styles.statValue, { color: BrandColors.accent[600] }]}>
                {globalStats.activeChallenges}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: BrandColors.accent[500] }]}>
                En cours
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
              <ThemedText style={styles.statEmoji}>✅</ThemedText>
              <ThemedText style={[styles.statValue, { color: '#15803d' }]}>
                {globalStats.totalValidations}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: '#16a34a' }]}>
                Validations
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
              <ThemedText style={styles.statEmoji}>📊</ThemedText>
              <ThemedText style={[styles.statValue, { color: '#b45309' }]}>
                {globalStats.averageCompletionRate}%
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: '#d97706' }]}>
                Taux moyen
              </ThemedText>
            </View>
          </View>
        )}

        {/* Started Challenges by Scouts */}
        <StartedByScoutsSection
          challenges={challenges}
          onChallengePress={(challenge) => router.push(`/(animator)/challenges/${challenge.id}`)}
          onEditChallenge={(challenge) => router.push(`/(animator)/challenges/${challenge.id}`)}
        />

        {/* Popular Challenges */}
        {popularChallenges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionEmoji}>🏆</ThemedText>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Défis les plus populaires
              </ThemedText>
            </View>

            <View style={styles.popularList}>
              {popularChallenges.map((challenge, index) => (
                <View
                  key={challenge.challengeId}
                  style={[styles.popularCard, { backgroundColor: cardColor, borderColor: cardBorderColor }]}
                >
                  <View style={styles.popularRank}>
                    <ThemedText style={styles.rankText}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </ThemedText>
                  </View>
                  <View style={styles.popularEmoji}>
                    <ThemedText style={styles.challengeEmoji}>{challenge.emoji}</ThemedText>
                  </View>
                  <View style={styles.popularInfo}>
                    <ThemedText style={[styles.popularTitle, { color: textColor }]} numberOfLines={1}>
                      {challenge.title}
                    </ThemedText>
                    <ThemedText style={[styles.popularMeta, { color: textSecondary }]}>
                      {challenge.completedCount} validation{challenge.completedCount !== 1 ? 's' : ''}
                    </ThemedText>
                  </View>
                  <View style={[styles.popularPoints, { backgroundColor: BrandColors.accent[50] }]}>
                    <ThemedText style={styles.popularPointsText}>+{challenge.points}</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Completion Rate by Challenge */}
        {challengeStats.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionEmoji}>📈</ThemedText>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Taux de complétion par défi
              </ThemedText>
            </View>

            <View style={styles.completionList}>
              {challengeStats
                .sort((a, b) => b.completionRate - a.completionRate)
                .map((challenge) => (
                  <View
                    key={challenge.challengeId}
                    style={[styles.completionCard, { backgroundColor: cardColor, borderColor: cardBorderColor }]}
                  >
                    <View style={styles.completionHeader}>
                      <View style={styles.completionTitleRow}>
                        <ThemedText style={styles.completionEmoji}>{challenge.emoji}</ThemedText>
                        <ThemedText style={[styles.completionTitle, { color: textColor }]} numberOfLines={1}>
                          {challenge.title}
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.completionPercent, { color: getCompletionColor(challenge.completionRate) }]}>
                        {challenge.completionRate}%
                      </ThemedText>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBarBg, { backgroundColor: NeutralColors.gray[200] }]}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${challenge.completionRate}%`,
                              backgroundColor: getCompletionColor(challenge.completionRate),
                            },
                          ]}
                        />
                      </View>
                    </View>

                    <View style={styles.completionMeta}>
                      <ThemedText style={[styles.completionMetaText, { color: textSecondary }]}>
                        {challenge.completedCount}/{challenge.totalScouts} scouts
                      </ThemedText>
                      {challenge.pendingCount > 0 && (
                        <ThemedText style={[styles.pendingBadge, { color: BrandColors.accent[500] }]}>
                          {challenge.pendingCount} en attente
                        </ThemedText>
                      )}
                      {challenge.isActive && (
                        <View style={[styles.activeBadge, { backgroundColor: BrandColors.primary[100] }]}>
                          <ThemedText style={[styles.activeBadgeText, { color: BrandColors.primary[700] }]}>
                            Actif
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
            </View>
          </View>
        )}

        {challengeStats.length === 0 && (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyIcon}>📊</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
              Aucune statistique disponible
            </ThemedText>
            <ThemedText color="secondary" style={styles.emptyText}>
              Créez des défis pour voir les statistiques apparaître ici.
            </ThemedText>
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
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
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
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: BrandColors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  statCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  popularList: {
    gap: 10,
  },
  popularCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  popularRank: {
    width: 32,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
  },
  popularEmoji: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: BrandColors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  challengeEmoji: {
    fontSize: 20,
  },
  popularInfo: {
    flex: 1,
  },
  popularTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  popularMeta: {
    fontSize: 13,
  },
  popularPoints: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  popularPointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.accent[500],
  },
  completionList: {
    gap: 12,
  },
  completionCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  completionEmoji: {
    fontSize: 18,
  },
  completionTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  completionPercent: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressBarContainer: {
    marginBottom: 10,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  completionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completionMetaText: {
    fontSize: 13,
  },
  pendingBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
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
