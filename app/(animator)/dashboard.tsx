import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInLeft } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { ChallengeService } from '@/services/challenge-service';
import { EventService } from '@/services/event-service';
import { UnitService } from '@/services/unit-service';
import { Animator, Unit } from '@/types';

export default function AnimatorDashboardScreen() {
  const { user } = useAuth();
  const animator = user as Animator;
  const [unit, setUnit] = useState<Unit | null>(null);
  const [scoutsCount, setScoutsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [challengesCount, setChallengesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [animator?.unitId]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Charger l'unité et les scouts
      if (animator?.unitId) {
        const unitData = await UnitService.getUnitById(animator.unitId);
        setUnit(unitData);

        if (unitData) {
          const scouts = await UnitService.getScoutsByUnit(unitData.id);
          setScoutsCount(scouts.length);
        }
      }

      // Charger les événements (tous les événements créés par cet animateur)
      try {
        const allEvents = await EventService.getUpcomingEvents(animator?.unitId);
        setEventsCount(allEvents.length);
      } catch (error) {
        console.error('Erreur lors du chargement des événements:', error);
        setEventsCount(0);
      }

      // Charger les défis actifs
      try {
        const allChallenges = await ChallengeService.getActiveChallenges();
        // Filtrer les défis de l'unité de l'animateur
        const unitChallenges = animator?.unitId
          ? allChallenges.filter(c => c.unitId === animator.unitId)
          : allChallenges;
        setChallengesCount(unitChallenges.length);
      } catch (error) {
        console.error('Erreur lors du chargement des défis:', error);
        setChallengesCount(0);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données du dashboard:', error);
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
          <Animated.View entering={FadeIn.duration(400).delay(0)}>
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
          </Animated.View>
        )}

        <Animated.View entering={FadeIn.duration(400).delay(100)}>
          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText type="title" style={styles.statValue}>
                  {isLoading ? '...' : scoutsCount}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Scouts</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type="title" style={styles.statValue}>
                  {isLoading ? '...' : eventsCount}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Événements</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type="title" style={styles.statValue}>
                  {isLoading ? '...' : challengesCount}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Défis actifs</ThemedText>
              </View>
            </View>
          </Card>
        </Animated.View>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Actions rapides
        </ThemedText>

        <Animated.View entering={FadeInLeft.duration(400).delay(200)}>
          <TouchableOpacity onPress={() => router.push('/(animator)/events/create')}>
            <Card style={styles.actionCard}>
              <Ionicons name="add-circle" size={24} color="#3b82f6" />
              <View style={styles.actionContent}>
                <ThemedText type="defaultSemiBold">Créer un événement</ThemedText>
                <ThemedText style={styles.actionDescription}>
                  Planifier une nouvelle activité
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </Card>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInLeft.duration(400).delay(300)}>
          <TouchableOpacity onPress={() => router.push('/(animator)/challenges/create')}>
            <Card style={styles.actionCard}>
              <Ionicons name="flash" size={24} color="#f59e0b" />
              <View style={styles.actionContent}>
                <ThemedText type="defaultSemiBold">Créer un défi</ThemedText>
                <ThemedText style={styles.actionDescription}>
                  Lancer un nouveau défi pour les scouts
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </Card>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInLeft.duration(400).delay(400)}>
          <TouchableOpacity onPress={() => router.push('/(animator)/scouts')}>
            <Card style={styles.actionCard}>
              <Ionicons name="people" size={24} color="#10b981" />
              <View style={styles.actionContent}>
                <ThemedText type="defaultSemiBold">Gérer les scouts</ThemedText>
                <ThemedText style={styles.actionDescription}>
                  Voir et gérer les scouts de votre unité
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </Card>
          </TouchableOpacity>
        </Animated.View>
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
    borderWidth: 1,
    // background is provided by Card (themed)
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
    // color comes from ThemedText
    textAlign: 'center',
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 20,
    fontWeight: '700',
  },
  actionCard: {
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
  },
  actionContent: {
    flex: 1,
  },
  actionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  unitCard: {
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  unitTitle: {
    marginBottom: 4,
  },
  unitDescription: {
    fontSize: 14,
    // themed
  },
});
