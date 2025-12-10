import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, Avatar, Badge } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { LeaderboardService, LeaderboardEntry } from '@/services/leaderboard-service';
import { Scout } from '@/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const scout = user as Scout;
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showGlobal, setShowGlobal] = useState(false);
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadLeaderboard();
  }, [scout?.unitId, showGlobal]);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      let entries: LeaderboardEntry[];

      if (showGlobal) {
        entries = await LeaderboardService.getGlobalLeaderboard();
      } else if (scout?.unitId) {
        entries = await LeaderboardService.getLeaderboardByUnit(scout.unitId);
        // Récupérer le rang de l'utilisateur
        const rank = await LeaderboardService.getScoutRank(scout.id, scout.unitId);
        setUserRank(rank);
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
            Classement
          </ThemedText>
          <Badge
            variant={showGlobal ? 'info' : 'default'}
            onPress={() => setShowGlobal(!showGlobal)}
            style={styles.toggleBadge}
          >
            {showGlobal ? 'Global' : 'Unité'}
          </Badge>
        </View>

        {userRank && !showGlobal && (
          <Card style={styles.userRankCard}>
            <View style={styles.userRankInfo}>
              <ThemedText type="defaultSemiBold">Votre rang</ThemedText>
              <ThemedText type="title" style={styles.userRankValue}>
                #{userRank}
              </ThemedText>
            </View>
            <View style={styles.userRankInfo}>
              <ThemedText type="defaultSemiBold">Vos points</ThemedText>
              <ThemedText type="title" style={styles.userPointsValue}>
                {scout?.points || 0}
              </ThemedText>
            </View>
          </Card>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : leaderboard.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ThemedText style={styles.emptyText}>
              Aucun classement disponible
            </ThemedText>
          </Card>
        ) : (
          leaderboard.map((entry) => {
            const isCurrentUser = entry.scout.id === scout?.id;
            return (
              <Card
                key={entry.scout.id}
                style={[
                  styles.leaderboardCard,
                  isCurrentUser && styles.currentUserCard,
                ]}
              >
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
                  <ThemedText
                    type="defaultSemiBold"
                    style={isCurrentUser && styles.currentUserName}
                  >
                    {entry.scout.firstName} {entry.scout.lastName}
                    {isCurrentUser && ' (Vous)'}
                  </ThemedText>
                  <ThemedText style={styles.scoutDetail}>
                    {entry.scout.unitId ? 'Unité' : 'Sans unité'}
                  </ThemedText>
                </View>

                <View style={styles.pointsContainer}>
                  <Ionicons name="star" size={20} color={BrandColors.accent[500]} />
                  <ThemedText type="title" style={[styles.pointsText, { color: BrandColors.accent[500] }]}>
                    {entry.points}
                  </ThemedText>
                </View>
              </Card>
            );
          })
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
  },
  toggleBadge: {
    marginLeft: 12,
  },
  userRankCard: {
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  userRankInfo: {
    alignItems: 'center',
  },
  userRankValue: {
    fontSize: 32,
    color: BrandColors.primary[500],
    marginTop: 4,
  },
  userPointsValue: {
    fontSize: 32,
    color: BrandColors.accent[500],
    marginTop: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.7,
    textAlign: 'center',
  },
  leaderboardCard: {
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: BrandColors.primary[500],
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
  currentUserName: {
    color: BrandColors.primary[500],
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

