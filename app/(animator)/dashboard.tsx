import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeInLeft } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ChallengeService } from '@/services/challenge-service';
import { EventService } from '@/services/event-service';
import { UnitService } from '@/services/unit-service';
import { ChannelService } from '@/src/shared/services/channel-service';
import { Animator, Unit } from '@/types';
import { BrandColors } from '@/constants/theme';
import { Radius, Spacing } from '@/constants/design-tokens';

// Import des widgets
import { WeatherWidget, BirthdaysWidget } from '@/src/features/dashboard/components';

export default function AnimatorDashboardScreen() {
  const { user } = useAuth();
  const animator = user as Animator;
  const [unit, setUnit] = useState<Unit | null>(null);
  const [scoutsCount, setScoutsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [challengesCount, setChallengesCount] = useState(0);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');

  useEffect(() => {
    loadDashboardData();
  }, [animator?.unitId]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      if (animator?.unitId) {
        const unitData = await UnitService.getUnitById(animator.unitId);
        setUnit(unitData);

        if (unitData) {
          const scouts = await UnitService.getScoutsByUnit(unitData.id);
          setScoutsCount(scouts.length);
        }

        // Charger les messages récents
        try {
          const channels = await ChannelService.getChannelsByUnit(animator.unitId);
          const messagesPromises = channels.slice(0, 3).map(async (channel) => {
            const messages = await ChannelService.getMessages(channel.id, 1);
            if (messages.length > 0) {
              return {
                channel,
                lastMessage: messages[0],
              };
            }
            return null;
          });
          const messagesResults = await Promise.all(messagesPromises);
          setRecentMessages(messagesResults.filter(Boolean));
        } catch (error) {
          console.error('Erreur chargement messages:', error);
        }
      }

      // Charger les événements
      try {
        const allEvents = await EventService.getUpcomingEvents(animator?.unitId);
        setEventsCount(allEvents.length);
      } catch (error) {
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
        setChallengesCount(0);
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'announcements':
        return 'notifications-outline';
      case 'general':
        return 'chatbubble-outline';
      case 'parents':
        return 'people-outline';
      default:
        return 'chatbubble-outline';
    }
  };

  const getChannelColor = (type: string) => {
    switch (type) {
      case 'announcements':
        return BrandColors.accent[500];
      case 'general':
        return BrandColors.primary[500];
      case 'parents':
        return BrandColors.secondary[500];
      default:
        return BrandColors.primary[400];
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Il y a ${hours}h`;
    return 'À l\'instant';
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)}>
          <ThemedText style={[styles.greeting, { color: textSecondary }]}>
            Bonjour {animator?.firstName} 👋
          </ThemedText>
          {unit && (
            <>
              <ThemedText style={[styles.unitName, { color: textColor }]}>
                {unit.name}
              </ThemedText>
              {unit.description && (
                <ThemedText style={[styles.unitDescription, { color: textSecondary }]}>
                  {unit.description}
                </ThemedText>
              )}
            </>
          )}
        </Animated.View>

        {/* Stats Card - Vert forêt */}
        <Animated.View entering={FadeInUp.duration(400).delay(100)}>
          <View style={[styles.statsCard, { backgroundColor: BrandColors.primary[500] }]}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>
                  {isLoading ? '...' : scoutsCount}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Scouts</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>
                  {isLoading ? '...' : eventsCount}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Événements</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>
                  {isLoading ? '...' : challengesCount}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Défis actifs</ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Messages Section */}
        <Animated.View entering={FadeInUp.duration(400).delay(200)}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              Messages récents
            </ThemedText>
            <TouchableOpacity
              onPress={() => router.push('/(animator)/messages')}
              style={styles.seeAllButton}
            >
              <ThemedText style={[styles.seeAllText, { color: textSecondary }]}>
                Messagerie
              </ThemedText>
              <Ionicons name="chevron-forward" size={16} color={textSecondary} />
            </TouchableOpacity>
          </View>

          {recentMessages.length === 0 ? (
            <View style={[styles.messageCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
              <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                Aucun message récent
              </ThemedText>
            </View>
          ) : (
            recentMessages.map((item, index) => {
              const channelColor = getChannelColor(item.channel.type);
              const hasUnread = item.channel.type === 'announcements';

              return (
                <Animated.View
                  key={item.channel.id}
                  entering={FadeInLeft.duration(300).delay(250 + index * 50)}
                >
                  <TouchableOpacity
                    style={[
                      styles.messageCard,
                      {
                        backgroundColor: cardColor,
                        borderColor: hasUnread ? channelColor : cardBorder,
                        borderWidth: hasUnread ? 1.5 : 1,
                      }
                    ]}
                    onPress={() => router.push('/(animator)/messages')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.messageIcon, { backgroundColor: `${channelColor}15` }]}>
                      <Ionicons
                        name={getChannelIcon(item.channel.type)}
                        size={20}
                        color={channelColor}
                      />
                    </View>
                    <View style={styles.messageContent}>
                      <View style={styles.messageHeader}>
                        <ThemedText style={[styles.channelName, { color: textColor }]}>
                          {item.channel.name}
                        </ThemedText>
                        <ThemedText style={[styles.messageTime, { color: textSecondary }]}>
                          {item.lastMessage?.createdAt
                            ? formatTimeAgo(new Date(item.lastMessage.createdAt))
                            : 'Hier'
                          }
                        </ThemedText>
                      </View>
                      <ThemedText
                        style={[styles.messagePreview, { color: textSecondary }]}
                        numberOfLines={1}
                      >
                        {item.lastMessage?.content || 'Nouveau canal'}
                      </ThemedText>
                    </View>
                    {hasUnread && (
                      <View style={[styles.unreadDot, { backgroundColor: BrandColors.accent[500] }]} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </Animated.View>

        {/* Widget Météo */}
        <WeatherWidget location="Belgique" delay={400} />

        {/* Actions rapides */}
        <Animated.View entering={FadeInUp.duration(400).delay(500)}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              Actions rapides
            </ThemedText>
          </View>

          {/* Bouton principal orange */}
          <TouchableOpacity
            style={[styles.primaryActionCard, { backgroundColor: BrandColors.accent[500] }]}
            onPress={() => router.push('/(animator)/events/create')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="calendar-outline" size={24} color={BrandColors.accent[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText style={styles.primaryActionTitle}>Créer un événement</ThemedText>
              <ThemedText style={styles.primaryActionSubtitle}>
                Planifier une nouvelle activité
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {/* Actions secondaires */}
          <TouchableOpacity
            style={[styles.secondaryActionCard, { backgroundColor: cardColor, borderColor: cardBorder }]}
            onPress={() => router.push('/(animator)/challenges/create')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: surfaceSecondary }]}>
              <Ionicons name="star-outline" size={22} color={textSecondary} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText style={[styles.secondaryActionTitle, { color: textColor }]}>
                Créer un défi
              </ThemedText>
              <ThemedText style={[styles.secondaryActionSubtitle, { color: textSecondary }]}>
                Lancer un nouveau défi pour les scouts
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryActionCard, { backgroundColor: cardColor, borderColor: cardBorder }]}
            onPress={() => router.push('/(animator)/scouts')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: surfaceSecondary }]}>
              <Ionicons name="people-outline" size={22} color={textSecondary} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText style={[styles.secondaryActionTitle, { color: textColor }]}>
                Gérer les scouts
              </ThemedText>
              <ThemedText style={[styles.secondaryActionSubtitle, { color: textSecondary }]}>
                Voir et gérer les scouts de votre unité
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Widget Anniversaires */}
        {animator?.unitId && (
          <BirthdaysWidget unitId={animator.unitId} delay={600} />
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
    padding: Spacing.xl,
    paddingTop: Spacing['4xl'],
    paddingBottom: 100,
  },
  greeting: {
    fontSize: 15,
    marginBottom: Spacing.xs,
  },
  unitName: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  unitDescription: {
    fontSize: 14,
    marginBottom: Spacing.xl,
  },

  // Stats Card
  statsCard: {
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
    marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing.xs,
    fontWeight: '500',
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Message Cards
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  messageIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  channelName: {
    fontSize: 15,
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 12,
  },
  messagePreview: {
    fontSize: 14,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyText: {
    textAlign: 'center',
    padding: Spacing.xl,
  },

  // Actions
  primaryActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  primaryActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  primaryActionSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  secondaryActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  secondaryActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  secondaryActionSubtitle: {
    fontSize: 13,
  },
});
