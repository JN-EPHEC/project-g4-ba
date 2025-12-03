import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInLeft, ZoomIn } from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { Scout } from '@/types';
import { useEvents } from '@/src/features/events/hooks/use-events';
import { useChallenges } from '@/src/features/challenges/hooks/use-challenges';
import { useAllChallengeProgress } from '@/src/features/challenges/hooks/use-all-challenge-progress';

export default function ScoutDashboardScreen() {
  const { user } = useAuth();
  const scout = user as Scout;
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { events } = useEvents();
  const { challenges } = useChallenges();
  const { completedCount } = useAllChallengeProgress();

  const isTablet = width >= 768;
  const isDesktop = width >= 1024;

  // Prendre les 2 prochains événements
  const upcomingEvents = events.slice(0, 2);
  // Prendre les 2 premiers défis actifs
  const activeChallenges = challenges.slice(0, 2);

  const stats = {
    points: scout?.points || 0,
    rank: 5,
    completedChallenges: completedCount,
    upcomingEvents: events.length,
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet,
          isDesktop && styles.scrollContentDesktop
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* Stats Cards - Apple Style Grid with Animations */}
        <View style={[
          styles.statsSection,
          isTablet && styles.statsSectionTablet,
          isDesktop && styles.statsSectionDesktop
        ]}>
          <Animated.View
            entering={FadeInUp.duration(400).delay(0)}
            style={[styles.statCard, isTablet && styles.statCardTablet]}
          >
            <TouchableOpacity
              onPress={() => router.push('/(scout)/leaderboard')}
              activeOpacity={0.7}
              style={styles.statCardContent}
            >
              <View style={styles.statIconContainer}>
                <View style={[styles.statIcon, { backgroundColor: '#007AFF15' }]}>
                  <Ionicons name="trophy" size={isTablet ? 28 : 24} color="#007AFF" />
                </View>
              </View>
              <View style={styles.statInfo}>
                <ThemedText style={[styles.statValue, isTablet && styles.statValueTablet]}>
                  {stats.points}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Points</ThemedText>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(400).delay(100)}
            style={[styles.statCard, isTablet && styles.statCardTablet]}
          >
            <TouchableOpacity
              onPress={() => router.push('/(scout)/leaderboard')}
              activeOpacity={0.7}
              style={styles.statCardContent}
            >
              <View style={styles.statIconContainer}>
                <View style={[styles.statIcon, { backgroundColor: '#FF950015' }]}>
                  <Ionicons name="ribbon" size={isTablet ? 28 : 24} color="#FF9500" />
                </View>
              </View>
              <View style={styles.statInfo}>
                <ThemedText style={[styles.statValue, isTablet && styles.statValueTablet]}>
                  #{stats.rank}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Classement</ThemedText>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(400).delay(200)}
            style={[styles.statCard, isTablet && styles.statCardTablet]}
          >
            <TouchableOpacity
              onPress={() => router.push('/(scout)/challenges')}
              activeOpacity={0.7}
              style={styles.statCardContent}
            >
              <View style={styles.statIconContainer}>
                <View style={[styles.statIcon, { backgroundColor: '#34C75915' }]}>
                  <Ionicons name="checkmark-circle" size={isTablet ? 28 : 24} color="#34C759" />
                </View>
              </View>
              <View style={styles.statInfo}>
                <ThemedText style={[styles.statValue, isTablet && styles.statValueTablet]}>
                  {stats.completedChallenges}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Défis</ThemedText>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(400).delay(300)}
            style={[styles.statCard, isTablet && styles.statCardTablet]}
          >
            <TouchableOpacity
              onPress={() => router.push('/(scout)/events')}
              activeOpacity={0.7}
              style={styles.statCardContent}
            >
              <View style={styles.statIconContainer}>
                <View style={[styles.statIcon, { backgroundColor: '#AF52DE15' }]}>
                  <Ionicons name="calendar" size={isTablet ? 28 : 24} color="#AF52DE" />
                </View>
              </View>
              <View style={styles.statInfo}>
                <ThemedText style={[styles.statValue, isTablet && styles.statValueTablet]}>
                  {stats.upcomingEvents}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Événements</ThemedText>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Défis Section - Apple Style */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>
              Défis en cours
            </ThemedText>
            <TouchableOpacity
              onPress={() => router.push('/(scout)/challenges')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.seeAllButton}>
                <ThemedText style={styles.seeAllText}>Tout voir</ThemedText>
                <Ionicons name="chevron-forward" size={16} color="#666666" />
              </View>
            </TouchableOpacity>
          </View>

          {activeChallenges.length === 0 ? (
            <View style={styles.emptyChallengesContainer}>
              <ThemedText style={styles.emptyChallengesText}>
                Aucun défi actif pour le moment
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.challengesGrid, isTablet && styles.challengesGridTablet]}>
              {activeChallenges.map((challenge, index) => {
                const daysRemaining = Math.ceil(
                  (new Date(challenge.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );

                // Icône et couleur par difficulté
                const difficultyConfig = {
                  easy: { emoji: '🌱', bgColor: '#34C75915' },
                  medium: { emoji: '⭐', bgColor: '#FF950015' },
                  hard: { emoji: '🏆', bgColor: '#FF3B3015' },
                };
                const config = difficultyConfig[challenge.difficulty];

                return (
                  <Animated.View
                    key={challenge.id}
                    entering={ZoomIn.duration(400).delay(400 + index * 100)}
                  >
                    <TouchableOpacity
                      style={[styles.challengeCard, isTablet && styles.challengeCardTablet]}
                      onPress={() => router.push('/(scout)/challenges')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.challengeIconContainer}>
                        <View style={[styles.challengeIcon, { backgroundColor: config.bgColor }]}>
                          <ThemedText style={styles.challengeEmoji}>{config.emoji}</ThemedText>
                        </View>
                      </View>
                      <View style={styles.challengeContent}>
                        <ThemedText style={styles.challengeTitle}>{challenge.title}</ThemedText>
                        <ThemedText style={styles.challengeDescription} numberOfLines={2}>
                          {challenge.description}
                        </ThemedText>
                        <View style={styles.challengeFooter}>
                          <View style={styles.challengePoints}>
                            <Ionicons name="star" size={14} color="#FF9500" />
                            <ThemedText style={styles.challengePointsText}>{challenge.points} pts</ThemedText>
                          </View>
                          <ThemedText style={styles.challengeDays}>
                            {daysRemaining > 0 ? `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}` : 'Dernier jour'}
                          </ThemedText>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>

        {/* Events Section - Apple Style */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>
              Prochains événements
            </ThemedText>
            <TouchableOpacity
              onPress={() => router.push('/(scout)/events')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.seeAllButton}>
                <ThemedText style={styles.seeAllText}>Tout voir</ThemedText>
                <Ionicons name="chevron-forward" size={16} color="#666666" />
              </View>
            </TouchableOpacity>
          </View>

          {upcomingEvents.length === 0 ? (
            <View style={styles.emptyEventsContainer}>
              <ThemedText style={styles.emptyEventsText}>
                Aucun événement à venir
              </ThemedText>
            </View>
          ) : (
            upcomingEvents.map((event, index) => {
              const eventDate = new Date(event.startDate);
              const day = eventDate.getDate();
              const month = eventDate.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
              const startTime = eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              const endTime = new Date(event.endDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

              // Couleur selon le type d'événement
              const eventColors = {
                meeting: '#007AFF',
                camp: '#34C759',
                activity: '#FF9500',
                training: '#AF52DE',
                other: '#8E8E93',
              };
              const backgroundColor = eventColors[event.type] || eventColors.other;

              return (
                <Animated.View
                  key={event.id}
                  entering={FadeInLeft.duration(400).delay(600 + index * 100)}
                >
                  <TouchableOpacity
                    style={styles.eventCard}
                    onPress={() => router.push('/(scout)/events')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.eventDate, { backgroundColor }]}>
                      <ThemedText style={styles.eventDay}>{day}</ThemedText>
                      <ThemedText style={styles.eventMonth}>{month}</ThemedText>
                    </View>
                    <View style={styles.eventContent}>
                      <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>
                      <View style={styles.eventDetail}>
                        <Ionicons name="time-outline" size={14} color="#8E8E93" />
                        <ThemedText style={styles.eventDetailText}>
                          {startTime} - {endTime}
                        </ThemedText>
                      </View>
                      <View style={styles.eventDetail}>
                        <Ionicons name="location-outline" size={14} color="#8E8E93" />
                        <ThemedText style={styles.eventDetailText} numberOfLines={1}>
                          {event.location}
                        </ThemedText>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </View>
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
    paddingBottom: 40,
  },
  scrollContentTablet: {
    padding: 32,
    paddingTop: 32,
  },
  scrollContentDesktop: {
    padding: 40,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },

  // Stats Section
  statsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 40,
  },
  statsSectionTablet: {
    gap: 20,
  },
  statsSectionDesktop: {
    gap: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 12,
    borderWidth: 1,
  },
  statCardTablet: {
    minWidth: 200,
    maxWidth: 240,
  },
  statCardContent: {
    padding: 24,
  },
  statIconContainer: {
    marginBottom: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    gap: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  statValueTablet: {
    fontSize: 32,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Section Headers - Skool Style
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  sectionTitleTablet: {
    fontSize: 24,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Challenges Grid
  challengesGrid: {
    gap: 16,
  },
  challengesGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  challengeCard: {
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    gap: 16,
    borderWidth: 1,
  },
  challengeCardTablet: {
    flex: 1,
    minWidth: 340,
  },
  challengeIconContainer: {
    justifyContent: 'center',
  },
  challengeIcon: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeEmoji: {
    fontSize: 28,
  },
  challengeContent: {
    flex: 1,
    gap: 8,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  challengeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  challengeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  challengePoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  challengePointsText: {
    fontSize: 14,
    fontWeight: '700',
  },
  challengeDays: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Events
  eventCard: {
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  eventDate: {
    width: 64,
    height: 64,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDay: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  eventMonth: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  eventContent: {
    flex: 1,
    gap: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
  },

  // Empty States
  emptyEventsContainer: {
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyEventsText: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Empty Challenges
  emptyChallengesContainer: {
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyChallengesText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
