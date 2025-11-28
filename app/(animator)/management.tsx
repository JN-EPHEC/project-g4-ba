import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { UnitService } from '@/services/unit-service';
import { EventService } from '@/services/event-service';
import { ChallengeService } from '@/services/challenge-service';
import { Animator, Unit } from '@/types';

export default function ManagementScreen() {
  const { user } = useAuth();
  const { pendingChallengesCount, pendingScoutsCount } = useNotifications();
  const animator = user as Animator;
  const [unit, setUnit] = useState<Unit | null>(null);
  const [scoutsCount, setScoutsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [challengesCount, setChallengesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadManagementData();
  }, [animator?.unitId]);

  const loadManagementData = async () => {
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

      // Charger les événements
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
        const unitChallenges = animator?.unitId
          ? allChallenges.filter(c => c.unitId === animator.unitId)
          : allChallenges;
        setChallengesCount(unitChallenges.length);
      } catch (error) {
        console.error('Erreur lors du chargement des défis:', error);
        setChallengesCount(0);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de gestion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Gestion
        </ThemedText>

        {unit && (
          <Card style={styles.unitCard}>
            <View style={styles.unitHeader}>
              <Ionicons name="business" size={24} color="#3b82f6" />
              <View style={styles.unitInfo}>
                <ThemedText type="subtitle">{unit.name}</ThemedText>
                {unit.description && (
                  <ThemedText style={styles.unitDescription}>
                    {unit.description}
                  </ThemedText>
                )}
              </View>
            </View>
          </Card>
        )}

        <Card style={styles.statsCard}>
          <ThemedText type="defaultSemiBold" style={styles.statsTitle}>
            Statistiques
          </ThemedText>
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

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Créer
        </ThemedText>

        <TouchableOpacity onPress={() => router.push('/(animator)/events/create')}>
          <Card style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="add-circle" size={28} color="#3b82f6" />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Créer un événement</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Planifier un nouveau camp, sortie ou activité
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(animator)/challenges/create')}>
          <Card style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="flash" size={28} color="#f59e0b" />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Créer un défi</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Lancer un nouveau challenge pour les scouts
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </Card>
        </TouchableOpacity>

        <ThemedText type="subtitle" style={[styles.sectionTitle, { marginTop: 24 }]}>
          Consulter
        </ThemedText>

        <TouchableOpacity onPress={() => router.push('/(animator)/events')}>
          <Card style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="calendar" size={28} color="#3b82f6" />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Événements</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Voir tous les événements créés
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(animator)/challenges')}>
          <Card style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="trophy" size={28} color="#f59e0b" />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Défis</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Voir tous les défis actifs
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(animator)/scouts')}>
          <Card style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="people" size={28} color="#10b981" />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Scouts</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Voir et gérer les scouts de votre unité
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(animator)/validate-scouts')}>
          <Card style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="checkmark-done" size={28} color="#8b5cf6" />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Valider les inscriptions</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Approuver les nouveaux scouts
              </ThemedText>
            </View>
            <View style={styles.actionRight}>
              {pendingScoutsCount > 0 && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>{pendingScoutsCount}</ThemedText>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(animator)/validate-challenges')}>
          <Card style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="shield-checkmark" size={28} color="#ec4899" />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Valider les défis</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Approuver les soumissions de défis des scouts
              </ThemedText>
            </View>
            <View style={styles.actionRight}>
              {pendingChallengesCount > 0 && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>{pendingChallengesCount}</ThemedText>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </Card>
        </TouchableOpacity>
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
  unitCard: {
    padding: 16,
    marginBottom: 16,
  },
  unitHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  unitInfo: {
    flex: 1,
  },
  unitDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  statsCard: {
    padding: 20,
    marginBottom: 24,
  },
  statsTitle: {
    marginBottom: 16,
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
    gap: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionDescription: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
