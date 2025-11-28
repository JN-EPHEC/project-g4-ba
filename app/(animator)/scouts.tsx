import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Text } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { RankBadge } from '@/components/rank-badge';
import { useAuth } from '@/context/auth-context';
import { UnitService } from '@/services/unit-service';
import { Animator, Scout } from '@/types';

export default function ScoutsScreen() {
  const { user } = useAuth();
  const animator = user as Animator;
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadScouts();
  }, [animator?.unitId]);

  const loadScouts = async () => {
    try {
      setLoading(true);
      setError(null);

      if (animator?.unitId) {
        const scoutsData = await UnitService.getScoutsByUnit(animator.unitId);
        setScouts(scoutsData);
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des scouts:', err);
      setError(err.message || 'Impossible de charger les scouts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des scouts...</Text>
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Scouts
        </ThemedText>

        <Card style={styles.statsCard}>
          <ThemedText type="defaultSemiBold" style={styles.statsTitle}>
            Total
          </ThemedText>
          <ThemedText type="title" style={styles.totalScouts}>
            {scouts.length}
          </ThemedText>
          <ThemedText style={styles.statsSubtitle}>
            scouts dans votre unité
          </ThemedText>
        </Card>

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
              <Card key={scout.id} style={styles.scoutCard}>
                <View style={styles.scoutHeader}>
                  <View style={styles.scoutAvatar}>
                    <Text style={styles.avatarText}>
                      {scout.firstName.charAt(0)}
                      {scout.lastName.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.scoutInfo}>
                    <View style={styles.nameRow}>
                      <ThemedText type="defaultSemiBold">
                        {scout.firstName} {scout.lastName}
                      </ThemedText>
                      <RankBadge xp={scout.points || 0} size="small" />
                    </View>
                    <ThemedText style={styles.scoutEmail}>{scout.email}</ThemedText>
                  </View>
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
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#666666',
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
  },
  statsSubtitle: {
    fontSize: 14,
    opacity: 0.7,
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
    backgroundColor: '#3b82f6',
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
    borderTopColor: '#e5e5e5',
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
  },
});
