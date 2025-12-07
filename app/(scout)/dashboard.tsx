import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInLeft, ZoomIn } from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Scout, UserRole } from '@/types';
import { useEvents } from '@/src/features/events/hooks/use-events';
import { useChallenges } from '@/src/features/challenges/hooks/use-challenges';
import { useAllChallengeProgress } from '@/src/features/challenges/hooks/use-all-challenge-progress';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { Radius, Spacing } from '@/constants/design-tokens';

// Import des nouveaux widgets
import {
  UnreadMessagesWidget,
  ActivityWidget,
  ChallengeProgressWidget,
  WeatherWidget,
} from '@/src/features/dashboard/components';
import { getCountdownLabel, getCountdownColor } from '@/src/shared/utils/date-utils';

export default function ScoutDashboardScreen() {
  const { user } = useAuth();
  const scout = user as Scout;
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { events } = useEvents();
  const { challenges } = useChallenges();
  const { completedCount } = useAllChallengeProgress();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');

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
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet,
          isDesktop && styles.scrollContentDesktop
        ]}
        showsVerticalScrollIndicator={true}
      >

        {/* Stats Cards - Nature Theme with Orange Accents */}
        <View style={[
          styles.statsSection,
          isTablet && styles.statsSectionTablet,
          isDesktop && styles.statsSectionDesktop
        ]}>
          {/* Points - Orange accent */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(0)}
            style={[
              styles.statCard,
              isTablet && styles.statCardTablet,
              { backgroundColor: BrandColors.accent[500] }
            ]}
          >
            <TouchableOpacity
              onPress={() => router.push('/(scout)/leaderboard')}
              activeOpacity={0.7}
              style={styles.statCardContent}
            >
              <View style={styles.statIconContainer}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="trophy" size={isTablet ? 28 : 24} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.statInfo}>
                <ThemedText style={[styles.statValue, isTablet && styles.statValueTablet, { color: '#FFFFFF' }]}>
                  {stats.points}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: 'rgba(255,255,255,0.8)' }]}>Points</ThemedText>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Classement - Green primary */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(100)}
            style={[
              styles.statCard,
              isTablet && styles.statCardTablet,
              { backgroundColor: BrandColors.primary[500] }
            ]}
          >
            <TouchableOpacity
              onPress={() => router.push('/(scout)/leaderboard')}
              activeOpacity={0.7}
              style={styles.statCardContent}
            >
              <View style={styles.statIconContainer}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="ribbon" size={isTablet ? 28 : 24} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.statInfo}>
                <ThemedText style={[styles.statValue, isTablet && styles.statValueTablet, { color: '#FFFFFF' }]}>
                  #{stats.rank}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: 'rgba(255,255,255,0.8)' }]}>Classement</ThemedText>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Défis - Card style with orange icon */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(200)}
            style={[
              styles.statCard,
              isTablet && styles.statCardTablet,
              { backgroundColor: cardColor, borderColor: cardBorder, borderWidth: 1 }
            ]}
          >
            <TouchableOpacity
              onPress={() => router.push('/(scout)/challenges')}
              activeOpacity={0.7}
              style={styles.statCardContent}
            >
              <View style={styles.statIconContainer}>
                <View style={[styles.statIcon, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
                  <Ionicons name="checkmark-circle" size={isTablet ? 28 : 24} color={BrandColors.accent[500]} />
                </View>
              </View>
              <View style={styles.statInfo}>
                <ThemedText style={[styles.statValue, isTablet && styles.statValueTablet, { color: textColor }]}>
                  {stats.completedChallenges}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Défis</ThemedText>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Événements - Card style with green icon */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(300)}
            style={[
              styles.statCard,
              isTablet && styles.statCardTablet,
              { backgroundColor: cardColor, borderColor: cardBorder, borderWidth: 1 }
            ]}
          >
            <TouchableOpacity
              onPress={() => router.push('/(scout)/events')}
              activeOpacity={0.7}
              style={styles.statCardContent}
            >
              <View style={styles.statIconContainer}>
                <View style={[styles.statIcon, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                  <Ionicons name="calendar" size={isTablet ? 28 : 24} color={BrandColors.primary[500]} />
                </View>
              </View>
              <View style={styles.statInfo}>
                <ThemedText style={[styles.statValue, isTablet && styles.statValueTablet, { color: textColor }]}>
                  {stats.upcomingEvents}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Événements</ThemedText>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Défis Section - Nature Theme */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { borderBottomColor: cardBorder }]}>
            <ThemedText style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet, { color: textColor }]}>
              Défis en cours
            </ThemedText>
            <TouchableOpacity
              onPress={() => router.push('/(scout)/challenges')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[styles.seeAllButton, { backgroundColor: BrandColors.accent[500] }]}>
                <ThemedText style={[styles.seeAllText, { color: '#FFFFFF' }]}>Tout voir</ThemedText>
                <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

          {activeChallenges.length === 0 ? (
            <View style={[styles.emptyChallengesContainer, { backgroundColor: cardColor, borderColor: cardBorder }]}>
              <ThemedText style={[styles.emptyChallengesText, { color: textSecondary }]}>
                Aucun défi actif pour le moment
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.challengesGrid, isTablet && styles.challengesGridTablet]}>
              {activeChallenges.map((challenge, index) => {
                const daysRemaining = Math.ceil(
                  (new Date(challenge.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );

                // Icône et couleur par difficulté - Nature theme
                const difficultyConfig = {
                  easy: { emoji: '🌱', bgColor: `${BrandColors.primary[500]}15` },
                  medium: { emoji: '⭐', bgColor: `${BrandColors.accent[500]}15` },
                  hard: { emoji: '🏆', bgColor: `${BrandColors.accent[600]}15` },
                };
                const config = difficultyConfig[challenge.difficulty];

                return (
                  <Animated.View
                    key={challenge.id}
                    entering={ZoomIn.duration(400).delay(400 + index * 100)}
                  >
                    <TouchableOpacity
                      style={[
                        styles.challengeCard,
                        isTablet && styles.challengeCardTablet,
                        { backgroundColor: cardColor, borderColor: cardBorder }
                      ]}
                      onPress={() => router.push('/(scout)/challenges')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.challengeIconContainer}>
                        <View style={[styles.challengeIcon, { backgroundColor: config.bgColor }]}>
                          <ThemedText style={styles.challengeEmoji}>{config.emoji}</ThemedText>
                        </View>
                      </View>
                      <View style={styles.challengeContent}>
                        <ThemedText style={[styles.challengeTitle, { color: textColor }]}>{challenge.title}</ThemedText>
                        <ThemedText style={[styles.challengeDescription, { color: textSecondary }]} numberOfLines={2}>
                          {challenge.description}
                        </ThemedText>
                        <View style={[styles.challengeFooter, { borderTopColor: cardBorder }]}>
                          <View style={[styles.challengePoints, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
                            <Ionicons name="star" size={14} color={BrandColors.accent[500]} />
                            <ThemedText style={[styles.challengePointsText, { color: BrandColors.accent[500] }]}>{challenge.points} pts</ThemedText>
                          </View>
                          <ThemedText style={[styles.challengeDays, { color: textSecondary }]}>
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

        {/* Events Section - Nature Theme */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { borderBottomColor: cardBorder }]}>
            <ThemedText style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet, { color: textColor }]}>
              Prochains événements
            </ThemedText>
            <TouchableOpacity
              onPress={() => router.push('/(scout)/events')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[styles.seeAllButton, { backgroundColor: BrandColors.primary[500] }]}>
                <ThemedText style={[styles.seeAllText, { color: '#FFFFFF' }]}>Tout voir</ThemedText>
                <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

          {upcomingEvents.length === 0 ? (
            <View style={[styles.emptyEventsContainer, { backgroundColor: cardColor, borderColor: cardBorder }]}>
              <ThemedText style={[styles.emptyEventsText, { color: textSecondary }]}>
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
              const countdownLabel = getCountdownLabel(eventDate);
              const countdownColor = getCountdownColor(eventDate);

              // Couleur selon le type d'événement - Nature theme
              const eventColors: Record<string, string> = {
                meeting: BrandColors.primary[500],
                camp: BrandColors.primary[600],
                activity: BrandColors.accent[500],
                training: BrandColors.secondary[500],
                other: NeutralColors.gray[500],
              };
              const eventBgColor = eventColors[event.type] || eventColors.other;

              return (
                <Animated.View
                  key={event.id}
                  entering={FadeInLeft.duration(400).delay(600 + index * 100)}
                >
                  <TouchableOpacity
                    style={[styles.eventCard, { backgroundColor: cardColor, borderColor: cardBorder }]}
                    onPress={() => router.push('/(scout)/events')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.eventDate, { backgroundColor: eventBgColor }]}>
                      <ThemedText style={styles.eventDay}>{day}</ThemedText>
                      <ThemedText style={styles.eventMonth}>{month}</ThemedText>
                    </View>
                    <View style={styles.eventContent}>
                      <View style={styles.eventTitleRow}>
                        <ThemedText style={[styles.eventTitle, { color: textColor }]}>{event.title}</ThemedText>
                        <View style={[styles.countdownBadge, { backgroundColor: `${countdownColor}20` }]}>
                          <ThemedText style={[styles.countdownText, { color: countdownColor }]}>
                            {countdownLabel}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.eventDetail}>
                        <Ionicons name="time-outline" size={14} color={textSecondary} />
                        <ThemedText style={[styles.eventDetailText, { color: textSecondary }]}>
                          {startTime} - {endTime}
                        </ThemedText>
                      </View>
                      <View style={styles.eventDetail}>
                        <Ionicons name="location-outline" size={14} color={textSecondary} />
                        <ThemedText style={[styles.eventDetailText, { color: textSecondary }]} numberOfLines={1}>
                          {event.location}
                        </ThemedText>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={textSecondary} />
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </View>

        {/* Widgets supplémentaires */}
        {scout?.id && scout?.unitId && (
          <>
            {/* Widget Progression défis */}
            <ChallengeProgressWidget
              scoutId={scout.id}
              unitId={scout.unitId}
              delay={700}
            />

            {/* Widget Messages non lus */}
            <UnreadMessagesWidget
              userId={scout.id}
              unitId={scout.unitId}
              userRole={UserRole.SCOUT}
              delay={750}
            />

            {/* Widget Activité récente */}
            <ActivityWidget unitId={scout.unitId} delay={800} />

            {/* Widget Météo */}
            <WeatherWidget location="Belgique" delay={850} />
          </>
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
    padding: Spacing.lg,
    paddingTop: 60,
    paddingBottom: 100,
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
    gap: Spacing.md,
    marginBottom: 40,
  },
  statsSectionTablet: {
    gap: Spacing.lg,
  },
  statsSectionDesktop: {
    gap: Spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: Radius.xl,
  },
  statCardTablet: {
    minWidth: 200,
    maxWidth: 240,
  },
  statCardContent: {
    padding: Spacing.xl,
  },
  statIconContainer: {
    marginBottom: Spacing.md,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
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

  // Section Headers
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.sm,
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Challenges Grid
  challengesGrid: {
    gap: Spacing.md,
  },
  challengesGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  challengeCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
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
    borderRadius: Radius.md,
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
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  challengePoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
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
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  eventDate: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDay: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  eventMonth: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
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
    borderRadius: Radius.xl,
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
    borderRadius: Radius.xl,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyChallengesText: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Countdown badge
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  countdownBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
