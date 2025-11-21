import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar, Badge, Card } from '@/components/ui';
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
          scouts.map((scout) => (
            <Card key={scout.id} style={styles.scoutCard}>
              <View style={styles.scoutHeader}>
                <Avatar
                  name={`${scout.firstName} ${scout.lastName}`}
                  imageUrl={scout.profilePicture}
                  size="medium"
                />
                <View style={styles.scoutInfo}>
                  <ThemedText type="defaultSemiBold">
                    {scout.firstName} {scout.lastName}
                  </ThemedText>
                  <ThemedText style={styles.scoutDetail}>
                    {scout.points || 0} points
                  </ThemedText>
                </View>
                <Badge variant="success">Actif</Badge>
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
  },
  title: {
    marginBottom: 20,
  },
  statsCard: {
    padding: 20,
    marginBottom: 24,
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
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  scoutCard: {
    padding: 16,
    marginBottom: 12,
  },
  scoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoutInfo: {
    flex: 1,
  },
  scoutDetail: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
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
});
