import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, Avatar } from '@/components/ui';
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
        {/* Hero Section - Apple Style */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Avatar
              name={scout ? `${scout.firstName} ${scout.lastName}` : undefined}
              imageUrl={scout?.profilePicture}
              size={isTablet ? 'xlarge' : 'large'}
            />
            <View style={styles.heroText}>
              <ThemedText style={[styles.greeting, isTablet && styles.greetingTablet]}>
                Bonjour,
              </ThemedText>
              <ThemedText style={[styles.userName, isTablet && styles.userNameTablet]}>
                {scout?.firstName} 👋
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Stats Cards - Apple Style Grid */}
        <View style={[
          styles.statsSection,
          isTablet && styles.statsSectionTablet,
          isDesktop && styles.statsSectionDesktop
        ]}>
          <TouchableOpacity
            style={[styles.statCard, isTablet && styles.statCardTablet]}
            onPress={() => router.push('/(scout)/leaderboard')}
            activeOpacity={0.6}
          >
            <View style={styles.statCardContent}>
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
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, isTablet && styles.statCardTablet]}
            onPress={() => router.push('/(scout)/leaderboard')}
            activeOpacity={0.6}
          >
            <View style={styles.statCardContent}>
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
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, isTablet && styles.statCardTablet]}
            onPress={() => router.push('/(scout)/challenges')}
            activeOpacity={0.6}
          >
            <View style={styles.statCardContent}>
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
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, isTablet && styles.statCardTablet]}
            onPress={() => router.push('/(scout)/events')}
            activeOpacity={0.6}
          >
            <View style={styles.statCardContent}>
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
            </View>
          </TouchableOpacity>
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
                <Ionicons name="chevron-forward" size={16} color="#007AFF" />
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
              {activeChallenges.map((challenge) => {
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
                  <TouchableOpacity
                    key={challenge.id}
                    style={[styles.challengeCard, isTablet && styles.challengeCardTablet]}
                    onPress={() => router.push('/(scout)/challenges')}
                    activeOpacity={0.6}
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
                <Ionicons name="chevron-forward" size={16} color="#007AFF" />
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
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => router.push('/(scout)/events')}
                  activeOpacity={0.6}
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
                  <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>
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
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 40,
  },
  scrollContentTablet: {
    padding: 24,
    paddingTop: 70,
  },
  scrollContentDesktop: {
    padding: 32,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },

  // Hero Section - Apple Style
  heroSection: {
    marginBottom: 24,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroText: {
    flex: 1,
  },
  greeting: {
    fontSize: 17,
    color: '#8E8E93',
    marginBottom: 2,
  },
  greetingTablet: {
    fontSize: 20,
  },
  userName: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  userNameTablet: {
    fontSize: 42,
  },

  // Stats Section - Apple Grid
  statsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statsSectionTablet: {
    gap: 16,
  },
  statsSectionDesktop: {
    gap: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
    }),
  },
  statCardTablet: {
    minWidth: 200,
    maxWidth: 240,
  },
  statCardContent: {
    padding: 20,
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    gap: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statValueTablet: {
    fontSize: 36,
  },
  statLabel: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },

  // Section Headers - Apple Style
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  sectionTitleTablet: {
    fontSize: 26,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },

  // Challenges Grid - Apple Style
  challengesGrid: {
    gap: 12,
  },
  challengesGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
    }),
  },
  challengeCardTablet: {
    flex: 1,
    minWidth: 320,
  },
  challengeIconContainer: {
    justifyContent: 'center',
  },
  challengeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeEmoji: {
    fontSize: 32,
  },
  challengeContent: {
    flex: 1,
    gap: 6,
  },
  challengeTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  challengeDescription: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 20,
  },
  challengeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  challengePoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  challengePointsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF9500',
  },
  challengeDays: {
    fontSize: 13,
    color: '#8E8E93',
  },

  // Events - Apple List Style
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
    }),
  },
  eventDate: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDay: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  eventContent: {
    flex: 1,
    gap: 6,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventDetailText: {
    fontSize: 15,
    color: '#8E8E93',
  },

  // Empty Events
  emptyEventsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
    }),
  },
  emptyEventsText: {
    fontSize: 15,
    color: '#8E8E93',
  },

  // Empty Challenges
  emptyChallengesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
    }),
  },
  emptyChallengesText: {
    fontSize: 15,
    color: '#8E8E93',
  },
});
