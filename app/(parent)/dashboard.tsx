import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar, Badge, Card } from '@/components/ui';
import { RankBadge } from '@/components/rank-badge';
import { useAuth } from '@/context/auth-context';
import { ParentScoutService } from '@/services/parent-scout-service';
import { Parent, Scout } from '@/types';

export default function ParentDashboardScreen() {
  const { user } = useAuth();
  const parent = user as Parent;
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadScouts();
  }, [parent?.id]);

  const loadScouts = async () => {
    if (!parent?.id) return;

    try {
      setIsLoading(true);
      const parentScouts = await ParentScoutService.getScoutsByParent(parent.id);
      setScouts(parentScouts);
    } catch (error) {
      console.error('Erreur lors du chargement des scouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Bonjour {parent?.firstName} 👋
        </ThemedText>

        <Animated.View entering={FadeInUp.duration(400).delay(100)}>
          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText type="title" style={styles.statValue}>
                  {scouts.length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Scouts</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type="title" style={styles.statValue}>0</ThemedText>
                <ThemedText style={styles.statLabel}>Documents à signer</ThemedText>
              </View>
            </View>
          </Card>
        </Animated.View>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Mes scouts
        </ThemedText>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : scouts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ThemedText style={styles.emptyText}>
              Aucun scout lié pour le moment
            </ThemedText>
          </Card>
        ) : (
          scouts.map((scout, index) => (
            <Animated.View
              key={scout.id}
              entering={FadeInLeft.duration(400).delay(200 + index * 100)}
            >
              <Card style={styles.scoutCard}>
                <View style={styles.scoutHeader}>
                  <Avatar
                    name={`${scout.firstName} ${scout.lastName}`}
                    imageUrl={scout.profilePicture}
                    size="medium"
                  />
                  <View style={styles.scoutInfo}>
                    <View style={styles.nameRow}>
                      <ThemedText type="defaultSemiBold">
                        {scout.firstName} {scout.lastName}
                      </ThemedText>
                      <RankBadge xp={scout.points || 0} size="small" />
                    </View>
                    <ThemedText style={styles.scoutDetail}>
                      {scout.points || 0} points
                    </ThemedText>
                  </View>
                  <Badge variant="success">Actif</Badge>
                </View>
              </Card>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    marginBottom: 20,
    color: '#FFFFFF',
  },
  statsCard: {
    padding: 20,
    marginBottom: 24,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    marginBottom: 4,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  scoutCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  scoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoutInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoutDetail: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  emptyText: {
    color: '#999999',
    textAlign: 'center',
  },
});
