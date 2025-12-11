import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, Avatar, Badge } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { LeaderboardService, LeaderboardEntry } from '@/services/leaderboard-service';
import { Animator } from '@/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

export default function AnimatorLeaderboardScreen() {
  const { user } = useAuth();
  const animator = user as Animator;
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGlobal, setShowGlobal] = useState(false);
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadLeaderboard();
  }, [animator?.unitId, showGlobal]);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      let entries: LeaderboardEntry[];

      if (showGlobal) {
        entries = await LeaderboardService.getGlobalLeaderboard();
      } else if (animator?.unitId) {
        entries = await LeaderboardService.getLeaderboardByUnit(animator.unitId);
      } else {
        entries = [];
      }

      setLeaderboard(entries);
    } catch (error) {
      console.error('Erreur lors du chargement du classement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.title, { color: BrandColors.primary[600] }]}>
            Classement des Scouts
          </ThemedText>
          <Badge
            variant={showGlobal ? 'info' : 'default'}
            onPress={() => setShowGlobal(!showGlobal)}
            style={styles.toggleBadge}
          >
            {showGlobal ? 'Global' : 'Unité'}
          </Badge>
        </View>

        {/* Stats summary */}
        <Card style={styles.statsCard}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statIcon}>👥</ThemedText>
            <ThemedText type="title" style={styles.statValue}>
              {leaderboard.length}
            </ThemedText>
            <ThemedText color="secondary" style={styles.statLabel}>
              Scouts
            </ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statIcon}>⭐</ThemedText>
            <ThemedText type="title" style={[styles.statValue, { color: BrandColors.accent[500] }]}>
              {leaderboard.reduce((sum, e) => sum + e.points, 0)}
            </ThemedText>
            <ThemedText color="secondary" style={styles.statLabel}>
              Points total
            </ThemedText>
          </View>
        </Card>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
          </View>
        ) : leaderboard.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ThemedText style={styles.emptyIcon}>🏆</ThemedText>
            <ThemedText style={styles.emptyText}>
              Aucun scout dans le classement
            </ThemedText>
            <ThemedText color="secondary" style={styles.emptySubtext}>
              Les scouts gagneront des points en complétant des défis
            </ThemedText>
          </Card>
        ) : (
          leaderboard.map((entry) => (
            <Card key={entry.scout.id} style={styles.leaderboardCard}>
              <View style={styles.rankContainer}>
                <ThemedText type="title" style={styles.rankText}>
                  {getRankIcon(entry.rank)}
                </ThemedText>
              </View>

              <Avatar
                name={`${entry.scout.firstName} ${entry.scout.lastName}`}
                imageUrl={entry.scout.profilePicture}
                size="medium"
              />

              <View style={styles.scoutInfo}>
                <ThemedText type="defaultSemiBold">
                  {entry.scout.firstName} {entry.scout.lastName}
                </ThemedText>
                {entry.scout.totemName && (
                  <ThemedText style={styles.scoutDetail}>
                    {entry.scout.totemAnimal} - {entry.scout.totemName}
                  </ThemedText>
                )}
              </View>

              <View style={styles.pointsContainer}>
                <Ionicons name="star" size={20} color={BrandColors.accent[500]} />
                <ThemedText type="title" style={[styles.pointsText, { color: BrandColors.accent[500] }]}>
                  {entry.points}
                </ThemedText>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    flex: 1,
    fontSize: 24,
  },
  toggleBadge: {
    marginLeft: 12,
  },
  statsCard: {
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#e5e7eb',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  leaderboardCard: {
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoutInfo: {
    flex: 1,
  },
  scoutDetail: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
