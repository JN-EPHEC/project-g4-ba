import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { UnitService } from '@/services/unit-service';
import { Animator, Unit } from '@/types';

export default function AnimatorDashboardScreen() {
  const { user } = useAuth();
  const animator = user as Animator;
  const [unit, setUnit] = useState<Unit | null>(null);
  const [scoutsCount, setScoutsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUnitData();
  }, [animator?.unitId]);

  const loadUnitData = async () => {
    if (!animator?.unitId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const unitData = await UnitService.getUnitById(animator.unitId);
      setUnit(unitData);

      if (unitData) {
        const scouts = await UnitService.getScoutsByUnit(unitData.id);
        setScoutsCount(scouts.length);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de l\'unité:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Bonjour {animator?.firstName} 👋
        </ThemedText>

        {unit && (
          <Card style={styles.unitCard}>
            <ThemedText type="subtitle" style={styles.unitTitle}>
              {unit.name}
            </ThemedText>
            {unit.description && (
              <ThemedText style={styles.unitDescription}>
                {unit.description}
              </ThemedText>
            )}
          </Card>
        )}

        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText type="title" style={styles.statValue}>
                {isLoading ? '...' : scoutsCount}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Scouts</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="title" style={styles.statValue}>0</ThemedText>
              <ThemedText style={styles.statLabel}>Événements</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="title" style={styles.statValue}>0</ThemedText>
              <ThemedText style={styles.statLabel}>Défis actifs</ThemedText>
            </View>
          </View>
        </Card>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Actions rapides
        </ThemedText>

        <Card style={styles.actionCard}>
          <Ionicons name="add-circle" size={24} color="#3b82f6" />
          <View style={styles.actionContent}>
            <ThemedText type="defaultSemiBold">Créer un événement</ThemedText>
            <ThemedText style={styles.actionDescription}>
              Planifier une nouvelle activité
            </ThemedText>
          </View>
        </Card>

        <Card style={styles.actionCard}>
          <Ionicons name="flash" size={24} color="#f59e0b" />
          <View style={styles.actionContent}>
            <ThemedText type="defaultSemiBold">Créer un défi</ThemedText>
            <ThemedText style={styles.actionDescription}>
              Lancer un nouveau défi pour les scouts
            </ThemedText>
          </View>
        </Card>

        <Card style={styles.actionCard}>
          <Ionicons name="document-text" size={24} color="#8b5cf6" />
          <View style={styles.actionContent}>
            <ThemedText type="defaultSemiBold">Partager un document</ThemedText>
            <ThemedText style={styles.actionDescription}>
              Ajouter un document à signer
            </ThemedText>
          </View>
        </Card>
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
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.7,
    textAlign: 'center',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  actionCard: {
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionDescription: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  unitCard: {
    padding: 16,
    marginBottom: 20,
  },
  unitTitle: {
    marginBottom: 4,
  },
  unitDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
});
