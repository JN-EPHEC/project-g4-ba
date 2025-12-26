import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { UnitService } from '@/services/unit-service';
import { EventService } from '@/services/event-service';
import { ChallengeService } from '@/services/challenge-service';
import { Animator, Unit, Scout, Event, Challenge } from '@/types';
import { BrandColors } from '@/constants/theme';
import { LevelService } from '@/services/level-service';

export default function UnitOverviewScreen() {
  const { user } = useAuth();
  const animator = user as Animator;
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const cardColor = useThemeColor({}, 'card');

  const [unit, setUnit] = useState<Unit | null>(null);
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUnitData();
  }, [animator?.unitId]);

  const loadUnitData = async () => {
    try {
      setIsLoading(true);

      if (animator?.unitId) {
        // Charger l'unité
        const unitData = await UnitService.getUnitById(animator.unitId);
        setUnit(unitData);

        // Charger les scouts
        if (unitData) {
          const scoutsData = await UnitService.getScoutsByUnit(unitData.id);
          // Trier par points décroissants
          scoutsData.sort((a, b) => (b.points || 0) - (a.points || 0));
          setScouts(scoutsData);
        }

        // Charger les événements à venir
        try {
          const eventsData = await EventService.getUpcomingEvents(animator.unitId);
          setEvents(eventsData.slice(0, 3)); // Les 3 prochains
        } catch (error) {
          console.error('Erreur événements:', error);
        }

        // Charger les défis actifs
        try {
          const allChallenges = await ChallengeService.getActiveChallenges();
          const unitChallenges = allChallenges.filter(c => c.unitId === animator.unitId);
          setChallenges(unitChallenges.slice(0, 3)); // Les 3 premiers
        } catch (error) {
          console.error('Erreur défis:', error);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer les statistiques
  const totalPoints = scouts.reduce((sum, s) => sum + (s.points || 0), 0);
  const averagePoints = scouts.length > 0 ? Math.round(totalPoints / scouts.length) : 0;

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary[500]} />
          <ThemedText style={styles.loadingText}>Chargement...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={iconColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Mon unité</ThemedText>
          <View style={styles.placeholder} />
        </View>

        {/* Unit Info Card */}
        {unit && (
          <Card style={styles.unitCard}>
            <View style={styles.unitHeader}>
              <View style={[styles.unitIcon, { backgroundColor: `${BrandColors.primary[500]}20` }]}>
                <Ionicons name="shield" size={32} color={BrandColors.primary[500]} />
              </View>
              <View style={styles.unitInfo}>
                <ThemedText type="title" style={styles.unitName}>{unit.name}</ThemedText>
                {unit.description && (
                  <ThemedText style={styles.unitDescription}>{unit.description}</ThemedText>
                )}
              </View>
            </View>

            {/* Stats Row */}
            <View style={[styles.statsRow, { borderTopColor: borderColor }]}>
              <View style={styles.statItem}>
                <ThemedText type="title" style={[styles.statValue, { color: BrandColors.primary[500] }]}>
                  {scouts.length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Scouts</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
              <View style={styles.statItem}>
                <ThemedText type="title" style={[styles.statValue, { color: BrandColors.accent[500] }]}>
                  {totalPoints}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Points totaux</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
              <View style={styles.statItem}>
                <ThemedText type="title" style={[styles.statValue, { color: BrandColors.primary[500] }]}>
                  {averagePoints}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Moyenne</ThemedText>
              </View>
            </View>
          </Card>
        )}

        {/* Scouts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Scouts ({scouts.length})</ThemedText>
            <TouchableOpacity onPress={() => router.push('/(animator)/scouts')}>
              <ThemedText style={[styles.seeAll, { color: BrandColors.primary[500] }]}>
                Voir tout
              </ThemedText>
            </TouchableOpacity>
          </View>

          {scouts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="people-outline" size={32} color={iconColor} />
              <ThemedText style={styles.emptyText}>Aucun scout dans l'unité</ThemedText>
            </Card>
          ) : (
            <Card style={styles.listCard}>
              {scouts.slice(0, 5).map((scout, index) => {
                const levelInfo = LevelService.getScoutLevelInfoSync(scout.points || 0);
                return (
                  <TouchableOpacity
                    key={scout.id}
                    style={[
                      styles.scoutRow,
                      index < Math.min(scouts.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }
                    ]}
                    onPress={() => router.push(`/(animator)/scouts/${scout.id}`)}
                  >
                    <View style={styles.rankBadge}>
                      <ThemedText style={styles.rankText}>#{index + 1}</ThemedText>
                    </View>
                    <Avatar
                      uri={scout.profilePicture}
                      name={`${scout.firstName} ${scout.lastName}`}
                      size={40}
                    />
                    <View style={styles.scoutInfo}>
                      <ThemedText type="defaultSemiBold">
                        {scout.firstName} {scout.lastName}
                      </ThemedText>
                      <View style={styles.scoutMeta}>
                        <ThemedText style={styles.levelBadge}>
                          {levelInfo.currentLevel.icon} {levelInfo.currentLevel.name}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.pointsBadge}>
                      <ThemedText style={[styles.pointsText, { color: BrandColors.accent[500] }]}>
                        {scout.points || 0} pts
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </Card>
          )}
        </View>

        {/* Events Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Prochains événements</ThemedText>
            <TouchableOpacity onPress={() => router.push('/(animator)/events')}>
              <ThemedText style={[styles.seeAll, { color: BrandColors.primary[500] }]}>
                Voir tout
              </ThemedText>
            </TouchableOpacity>
          </View>

          {events.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={32} color={iconColor} />
              <ThemedText style={styles.emptyText}>Aucun événement à venir</ThemedText>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: BrandColors.primary[500] }]}
                onPress={() => router.push('/(animator)/events/create')}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <ThemedText style={styles.createButtonText}>Créer un événement</ThemedText>
              </TouchableOpacity>
            </Card>
          ) : (
            <Card style={styles.listCard}>
              {events.map((event, index) => {
                const eventDate = new Date(event.startDate);
                return (
                  <View
                    key={event.id}
                    style={[
                      styles.eventRow,
                      index < events.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }
                    ]}
                  >
                    <View style={[styles.dateBox, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                      <ThemedText style={[styles.dateDay, { color: BrandColors.primary[500] }]}>
                        {eventDate.getDate()}
                      </ThemedText>
                      <ThemedText style={[styles.dateMonth, { color: BrandColors.primary[500] }]}>
                        {eventDate.toLocaleDateString('fr-FR', { month: 'short' })}
                      </ThemedText>
                    </View>
                    <View style={styles.eventInfo}>
                      <ThemedText type="defaultSemiBold" numberOfLines={1}>
                        {event.title}
                      </ThemedText>
                      <ThemedText style={styles.eventMeta} numberOfLines={1}>
                        {event.location || 'Lieu non défini'}
                      </ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={iconColor} />
                  </View>
                );
              })}
            </Card>
          )}
        </View>

        {/* Challenges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Défis actifs</ThemedText>
            <TouchableOpacity onPress={() => router.push('/(animator)/challenges')}>
              <ThemedText style={[styles.seeAll, { color: BrandColors.primary[500] }]}>
                Voir tout
              </ThemedText>
            </TouchableOpacity>
          </View>

          {challenges.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="trophy-outline" size={32} color={iconColor} />
              <ThemedText style={styles.emptyText}>Aucun défi actif</ThemedText>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: BrandColors.accent[500] }]}
                onPress={() => router.push('/(animator)/challenges/create')}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <ThemedText style={styles.createButtonText}>Créer un défi</ThemedText>
              </TouchableOpacity>
            </Card>
          ) : (
            <Card style={styles.listCard}>
              {challenges.map((challenge, index) => (
                <View
                  key={challenge.id}
                  style={[
                    styles.challengeRow,
                    index < challenges.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }
                  ]}
                >
                  <View style={[styles.challengeEmoji, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
                    <ThemedText style={styles.emojiText}>{challenge.emoji || '🎯'}</ThemedText>
                  </View>
                  <View style={styles.challengeInfo}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1}>
                      {challenge.title}
                    </ThemedText>
                    <ThemedText style={styles.challengeMeta}>
                      +{challenge.points} pts
                    </ThemedText>
                  </View>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(challenge.difficulty) + '20' }]}>
                    <ThemedText style={[styles.difficultyText, { color: getDifficultyColor(challenge.difficulty) }]}>
                      {getDifficultyLabel(challenge.difficulty)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy': return '#10b981';
    case 'medium': return '#f59e0b';
    case 'hard': return '#ef4444';
    default: return '#6b7280';
  }
}

function getDifficultyLabel(difficulty: string): string {
  switch (difficulty) {
    case 'easy': return 'Facile';
    case 'medium': return 'Moyen';
    case 'hard': return 'Difficile';
    default: return difficulty;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    opacity: 0.7,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
  },
  placeholder: {
    width: 40,
  },
  unitCard: {
    padding: 20,
    marginBottom: 24,
  },
  unitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  unitIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitInfo: {
    flex: 1,
  },
  unitName: {
    fontSize: 22,
    marginBottom: 4,
  },
  unitDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    paddingTop: 20,
    borderTopWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    opacity: 0.7,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  scoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  rankBadge: {
    width: 28,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.5,
  },
  scoutInfo: {
    flex: 1,
  },
  scoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  levelBadge: {
    fontSize: 12,
    opacity: 0.7,
  },
  pointsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(217, 123, 74, 0.1)',
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '700',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  dateBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '700',
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  eventInfo: {
    flex: 1,
  },
  eventMeta: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  challengeEmoji: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 22,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeMeta: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
