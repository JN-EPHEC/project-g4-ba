import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { RankBadge } from '@/components/rank-badge';
import { useAuth } from '@/context/auth-context';
import { UnitService } from '@/services/unit-service';
import { Animator, Scout } from '@/types';
import { BrandColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ScoutsScreen() {
  const { user } = useAuth();
  const animator = user as Animator;
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [animators, setAnimators] = useState<Animator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iconColor = useThemeColor({}, 'icon');

  // Recharger les membres quand on revient sur la page
  useFocusEffect(
    useCallback(() => {
      if (animator?.unitId) {
        loadMembers();
      }
    }, [animator?.unitId])
  );

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (animator?.unitId) {
        const [scoutsData, animatorsData] = await Promise.all([
          UnitService.getScoutsByUnit(animator.unitId),
          UnitService.getAnimatorsByUnit(animator.unitId),
        ]);
        setScouts(scoutsData);
        setAnimators(animatorsData);
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des membres:', err);
      setError(err.message || 'Impossible de charger les membres');
    } finally {
      setLoading(false);
    }
  };

  const totalMembers = scouts.length + animators.length;

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary[500]} />
          <Text style={styles.loadingText}>Chargement des membres...</Text>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={[styles.title, { color: BrandColors.primary[600] }]}>
          Membres
        </ThemedText>

        <Card style={styles.statsCard}>
          <ThemedText type="defaultSemiBold" style={styles.statsTitle}>
            Total
          </ThemedText>
          <ThemedText type="title" style={styles.totalScouts}>
            {totalMembers}
          </ThemedText>
          <View style={styles.statsBreakdown}>
            <ThemedText style={styles.statsSubtitle}>
              {scouts.length} scouts
            </ThemedText>
            <ThemedText style={[styles.statsSubtitle, { color: BrandColors.accent[500] }]}>
              {animators.length} animateurs
            </ThemedText>
          </View>
        </Card>

        {/* Section Animateurs */}
        {animators.length > 0 && (
          <>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Animateurs ({animators.length})
            </ThemedText>
            <View style={styles.scoutsList}>
              {animators.map((anim) => (
                <Card key={anim.id} style={[styles.scoutCard, styles.animatorCard]}>
                  <View style={styles.scoutHeader}>
                    <View style={[styles.scoutAvatar, styles.animatorAvatar]}>
                      <Text style={styles.avatarText}>
                        {anim.firstName.charAt(0)}
                        {anim.lastName.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.scoutInfo}>
                      <View style={styles.nameRow}>
                        <ThemedText type="defaultSemiBold" style={[styles.scoutName, { color: BrandColors.accent[500] }]}>
                          {anim.firstName} {anim.lastName}
                        </ThemedText>
                        {(anim as any).isUnitLeader && (
                          <View style={styles.leaderBadge}>
                            <ThemedText style={styles.leaderBadgeText}>Chef</ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText style={styles.scoutEmail}>{anim.email}</ThemedText>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </>
        )}

        {/* Section Scouts */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Scouts ({scouts.length})
        </ThemedText>

        {scouts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Text style={styles.emptyIcon}>🏕️</Text>
              <ThemedText type="subtitle" style={styles.emptyTitle}>
                Aucun scout
              </ThemedText>
              <ThemedText style={styles.emptyText}>
                Il n'y a pas encore de scouts dans votre unité.
              </ThemedText>
            </View>
          </Card>
        ) : (
          <View style={styles.scoutsList}>
            {scouts.map((scout) => (
              <TouchableOpacity
                key={scout.id}
                activeOpacity={0.7}
                onPress={() => router.push(`/(animator)/scouts/${scout.id}`)}
              >
                <Card style={styles.scoutCard}>
                  <View style={styles.scoutHeader}>
                    <View style={styles.scoutAvatar}>
                      <Text style={styles.avatarText}>
                        {scout.firstName.charAt(0)}
                        {scout.lastName.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.scoutInfo}>
                      <View style={styles.nameRow}>
                        <ThemedText type="defaultSemiBold" style={styles.scoutName}>
                          {scout.firstName} {scout.lastName}
                        </ThemedText>
                        <RankBadge xp={scout.points || 0} size="small" />
                      </View>
                      <ThemedText style={styles.scoutEmail}>{scout.email}</ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={iconColor} />
                  </View>
                  <View style={styles.scoutStats}>
                    <View style={styles.scoutStat}>
                      <Text style={styles.statIcon}>⭐</Text>
                      <ThemedText style={styles.statText}>
                        {scout.points || 0} points
                      </ThemedText>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
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
    opacity: 0.7,
    letterSpacing: -0.3,
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
    color: '#FF3B30',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  title: {
    marginBottom: 20,
  },
  statsCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  statsTitle: {
    marginBottom: 8,
  },
  totalScouts: {
    fontSize: 48,
    marginBottom: 4,
    color: BrandColors.primary[500],
  },
  statsSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  statsBreakdown: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    color: BrandColors.primary[600],
  },
  animatorCard: {
    borderLeftWidth: 3,
    borderLeftColor: BrandColors.accent[500],
  },
  animatorAvatar: {
    backgroundColor: BrandColors.accent[500],
  },
  leaderBadge: {
    backgroundColor: BrandColors.accent[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  leaderBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: BrandColors.accent[600],
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 14,
  },
  scoutsList: {
    gap: 12,
  },
  scoutCard: {
    padding: 16,
  },
  scoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  scoutAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BrandColors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  scoutInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoutName: {
  },
  scoutEmail: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
  scoutStats: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e520',
  },
  scoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    fontSize: 16,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: BrandColors.accent[500],
  },
});
