import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Image } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedCard, AnimatedPressable } from '@/src/shared/animations';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { NotificationsModal } from '@/src/features/notifications/components/notifications-modal';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ChallengeService } from '@/services/challenge-service';
import { EventService } from '@/services/event-service';
import { EventAttendanceService } from '@/services/event-attendance-service';
import { UnitService } from '@/services/unit-service';
import { LeaderboardService } from '@/services/leaderboard-service';
import { ChannelService } from '@/src/shared/services/channel-service';
import { Animator, Unit, UserRole, Event, Section } from '@/types';
import { SectionService } from '@/services/section-service';
import { BrandColors } from '@/constants/theme';
import { Radius, Spacing } from '@/constants/design-tokens';
import { getDisplayName, getUserTotemEmoji } from '@/src/shared/utils/totem-utils';
import { WeatherService, WeatherForecast } from '@/src/shared/services/weather-service';
import { BirthdayService, BirthdayInfo } from '@/src/shared/services/birthday-service';
import { formatShortDate } from '@/src/shared/utils/date-utils';
import { PartnerService } from '@/services/partner-service';
import { PartnerOffer, Partner } from '@/types/partners';

// Types pour le dashboard
interface LeaderboardUser {
  id: string;
  firstName: string;
  lastName: string;
  totemAnimal?: string;
  totemEmoji?: string;
  points: number;
  avatarUrl?: string;
}

export default function AnimatorDashboardScreen() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    totalNotificationsCount,
    missingHealthRecordsCount,
    pendingAuthorizationsCount
  } = useNotifications();
  const animator = user as Animator;
  const [unit, setUnit] = useState<Unit | null>(null);
  const [scoutsCount, setScoutsCount] = useState(0);
  const [animatorsCount, setAnimatorsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [challengesCount, setChallengesCount] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState<(Event & { attendeesCount?: number })[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [topScouts, setTopScouts] = useState<LeaderboardUser[]>([]);
  const [unitBalance, setUnitBalance] = useState(0);
  const [featuredOffers, setFeaturedOffers] = useState<(PartnerOffer & { partner: Partner })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [section, setSection] = useState<Section | null>(null);

  // Vérification de sécurité
  useEffect(() => {
    if (!isAuthLoading && user && user.role !== UserRole.ANIMATOR && user.role !== 'animator') {
      if (user.role === UserRole.SCOUT || user.role === 'scout') {
        router.replace('/(scout)/dashboard');
      } else if (user.role === UserRole.PARENT || user.role === 'parent') {
        router.replace('/(parent)/dashboard');
      }
    }
  }, [user, isAuthLoading]);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  useEffect(() => {
    loadDashboardData();
  }, [animator?.unitId]);

  // Charger les données de la section
  useEffect(() => {
    const loadSection = async () => {
      console.log('[Dashboard] animator.sectionId:', animator?.sectionId);
      if (animator?.sectionId) {
        try {
          const sectionData = await SectionService.getSectionById(animator.sectionId);
          console.log('[Dashboard] Section chargée:', sectionData?.name);
          setSection(sectionData);
        } catch (error) {
          console.error('Erreur chargement section:', error);
        }
      } else {
        console.log('[Dashboard] Pas de sectionId pour cet animateur');
      }
    };
    loadSection();
  }, [animator?.sectionId]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      if (animator?.unitId) {
        const unitData = await UnitService.getUnitById(animator.unitId);
        setUnit(unitData);

        if (unitData) {
          // Charger scouts et animateurs en parallèle
          const [scouts, animators] = await Promise.all([
            UnitService.getScoutsByUnit(unitData.id),
            UnitService.getAnimatorsByUnit(unitData.id),
          ]);
          setScoutsCount(scouts.length);
          setAnimatorsCount(animators.length);

          // Charger le classement
          try {
            const leaderboard = await LeaderboardService.getLeaderboardByUnit(unitData.id);
            setTopScouts(leaderboard.slice(0, 3).map(entry => ({
              id: entry.scout.id,
              firstName: entry.scout.firstName,
              lastName: entry.scout.lastName,
              totemAnimal: entry.scout.totemAnimal,
              totemEmoji: entry.scout.totemEmoji,
              points: entry.points,
              avatarUrl: entry.scout.profilePicture,
            })));
          } catch (error) {
            console.error('Erreur leaderboard:', error);
          }
        }

        // Charger les messages récents
        try {
          const channels = await ChannelService.getChannelsByUnit(animator.unitId);
          const messagesPromises = channels.slice(0, 3).map(async (channel) => {
            const messages = await ChannelService.getMessages(channel.id, 1);
            if (messages.length > 0) {
              return { channel, lastMessage: messages[0] };
            }
            return null;
          });
          const messagesResults = await Promise.all(messagesPromises);
          setRecentMessages(messagesResults.filter(Boolean));
        } catch (error) {
          console.error('Erreur chargement messages:', error);
        }
      }

      // Charger les événements avec le nombre d'inscrits
      try {
        const allEvents = await EventService.getUpcomingEvents(animator?.unitId);
        setEventsCount(allEvents.length);

        // Charger le nombre d'inscrits pour chaque événement affiché
        const eventsWithAttendees = await Promise.all(
          allEvents.slice(0, 4).map(async (event) => {
            try {
              const attendances = await EventAttendanceService.getAttendanceByEvent(event.id);
              return { ...event, attendeesCount: attendances.length };
            } catch {
              return { ...event, attendeesCount: 0 };
            }
          })
        );
        setUpcomingEvents(eventsWithAttendees);
      } catch (error) {
        setEventsCount(0);
      }

      // Charger le nombre de défis actifs
      try {
        const allChallenges = await ChallengeService.getActiveChallenges();
        const unitChallenges = animator?.unitId
          ? allChallenges.filter(c => c.unitId === animator.unitId)
          : allChallenges;
        setChallengesCount(unitChallenges.length);
      } catch (error) {
        setChallengesCount(0);
      }

      // Charger les récompenses partenaires
      if (animator?.unitId) {
        try {
          const [balance, offers] = await Promise.all([
            PartnerService.getUnitPointsBalance(animator.unitId),
            PartnerService.getAllActiveOffers(),
          ]);
          setUnitBalance(balance);
          setFeaturedOffers(offers.slice(0, 3));
        } catch (error) {
          console.error('Erreur chargement récompenses:', error);
        }
      }

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}j`;
    if (hours > 0) return `${hours}h`;
    return 'maintenant';
  };

  const formatEventDate = (date: Date) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return { day: days[date.getDay()], date: date.getDate() };
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with gradient */}
        <Animated.View entering={FadeIn.duration(400)}>
          <LinearGradient
            colors={[BrandColors.primary[600], BrandColors.primary[500]]}
            style={styles.headerGradient}
          >
            {/* Title row with actions */}
            <View style={styles.titleRow}>
              <ThemedText type="title" style={styles.pageTitle}>Accueil</ThemedText>
              <View style={styles.topBarRight}>
                <TouchableOpacity
                  style={styles.notificationButton}
                  onPress={() => setShowNotificationsModal(true)}
                >
                  <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                  {totalNotificationsCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <ThemedText style={styles.notificationBadgeText}>
                        {totalNotificationsCount > 9 ? '9+' : totalNotificationsCount}
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.avatarButton}
                  onPress={() => router.push('/(animator)/profile')}
                >
                  {animator?.profilePicture ? (
                    <Image source={{ uri: animator.profilePicture }} style={styles.avatarImage} />
                  ) : (
                    <ThemedText style={styles.avatarEmoji}>{getUserTotemEmoji(animator) || '👤'}</ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Greeting section */}
            <View style={styles.greetingContainer}>
              <ThemedText style={styles.greeting}>
                Bonjour {getDisplayName(animator, { firstNameOnly: true })} 👋
              </ThemedText>
              {section && (
                <TouchableOpacity
                  style={styles.sectionBadge}
                  onPress={() => router.push('/(animator)/unit-overview')}
                  activeOpacity={0.7}
                >
                  {section.logoUrl ? (
                    <Image source={{ uri: section.logoUrl }} style={styles.sectionBadgeLogo} />
                  ) : null}
                  <ThemedText style={styles.sectionBadgeText}>
                    {section.name}
                  </ThemedText>
                </TouchableOpacity>
              )}
              {unit && !section && (
                <View style={styles.unitBadge}>
                  <TouchableOpacity
                    onPress={() => router.push('/(animator)/unit-logo')}
                    activeOpacity={0.7}
                  >
                    {unit.logoUrl ? (
                      <View style={styles.unitBadgeLogoContainer}>
                        <Image source={{ uri: unit.logoUrl }} style={styles.unitBadgeLogo} resizeMode="contain" />
                      </View>
                    ) : (
                      <View style={styles.unitBadgeLogoPlaceholder}>
                        <Ionicons name="image-outline" size={32} color="rgba(255,255,255,0.7)" />
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/(animator)/unit-overview')}
                    activeOpacity={0.7}
                  >
                    <ThemedText style={styles.unitName}>{unit.name}</ThemedText>
                    {unit.scoutGroup?.name && (
                      <ThemedText style={styles.unitGroup}>{unit.scoutGroup.name}</ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <AnimatedPressable style={styles.statCard} onPress={() => router.push('/(animator)/scouts')}>
                <ThemedText style={styles.statValue}>
                  {isLoading ? '...' : scoutsCount + animatorsCount}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Membres</ThemedText>
              </AnimatedPressable>
              <AnimatedPressable style={styles.statCard} onPress={() => router.push('/(animator)/events')}>
                <ThemedText style={styles.statValue}>{isLoading ? '...' : eventsCount}</ThemedText>
                <ThemedText style={styles.statLabel}>Événements</ThemedText>
              </AnimatedPressable>
              <AnimatedPressable style={styles.statCard} onPress={() => router.push('/(animator)/challenges')}>
                <ThemedText style={styles.statValue}>{isLoading ? '...' : challengesCount}</ThemedText>
                <ThemedText style={styles.statLabel}>Défis</ThemedText>
              </AnimatedPressable>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Alerts Section - Only pending authorizations (health records are in notifications) */}
        {pendingAuthorizationsCount > 0 && (
          <Animated.View entering={FadeInUp.duration(400).delay(100)}>
            <TouchableOpacity
              style={[styles.alertCard, { backgroundColor: '#FFFBEB' }]}
              onPress={() => router.push('/(animator)/documents/authorizations')}
              activeOpacity={0.7}
            >
              <View style={[styles.alertIcon, { backgroundColor: '#FEF3C7' }]}>
                <ThemedText style={styles.alertEmoji}>📋</ThemedText>
              </View>
              <ThemedText style={[styles.alertText, { color: '#D97706' }]}>
                {pendingAuthorizationsCount} {pendingAuthorizationsCount === 1 ? 'autorisation à signer' : 'autorisations à signer'}
              </ThemedText>
              <View style={[styles.alertButton, { backgroundColor: '#FDE68A' }]}>
                <ThemedText style={[styles.alertButtonText, { color: '#D97706' }]}>Voir</ThemedText>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.duration(400).delay(150)}>
          <View style={styles.quickActions}>
            <AnimatedPressable
              style={[styles.primaryAction, { backgroundColor: BrandColors.accent[500] }]}
              onPress={() => router.push('/(animator)/events/create')}
              animationOptions={{ scaleValue: 0.95 }}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <ThemedText style={styles.primaryActionText}>Événement</ThemedText>
            </AnimatedPressable>
            <AnimatedPressable
              style={[styles.secondaryAction, { backgroundColor: cardColor, borderColor: cardBorder }]}
              onPress={() => router.push('/(animator)/messages')}
            >
              <Ionicons name="megaphone-outline" size={20} color={textColor} />
              <ThemedText style={[styles.secondaryActionText, { color: textColor }]}>Annonce</ThemedText>
            </AnimatedPressable>
            <AnimatedPressable
              style={[styles.moreAction, { backgroundColor: cardColor, borderColor: cardBorder }]}
              onPress={() => router.push('/(animator)/management')}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={textSecondary} />
            </AnimatedPressable>
          </View>
        </Animated.View>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <Animated.View entering={FadeInUp.duration(400).delay(200)}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Prochains événements</ThemedText>
              <TouchableOpacity onPress={() => router.push('/(animator)/events')} style={styles.seeAllButton}>
                <ThemedText style={[styles.seeAllText, { color: BrandColors.accent[500] }]}>Tout voir</ThemedText>
                <Ionicons name="chevron-forward" size={16} color={BrandColors.accent[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsScroll}>
              {upcomingEvents.map((event, index) => {
                const eventDate = formatEventDate(new Date(event.startDate));
                return (
                  <AnimatedCard
                    key={event.id}
                    index={index}
                    staggerDelay={80}
                    style={[styles.eventCard, { backgroundColor: cardColor, borderColor: cardBorder }]}
                    onPress={() => router.push('/(animator)/events')}
                  >
                    <View style={styles.eventCardContent}>
                      <View style={[styles.eventDateBadge, { backgroundColor: `${BrandColors.primary[500]}10` }]}>
                        <ThemedText style={[styles.eventDateDay, { color: BrandColors.primary[500] }]}>{eventDate.day}</ThemedText>
                        <ThemedText style={[styles.eventDateNumber, { color: BrandColors.primary[500] }]}>{eventDate.date}</ThemedText>
                      </View>
                      <View style={styles.eventInfo}>
                        <ThemedText style={[styles.eventTitle, { color: textColor }]} numberOfLines={1}>{event.title}</ThemedText>
                        <ThemedText style={[styles.eventMeta, { color: textSecondary }]}>
                          {new Date(event.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {event.type || 'Activité'}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.eventAttendees}>
                      <Ionicons name="person-outline" size={14} color={textSecondary} />
                      <ThemedText style={[styles.eventAttendeesText, { color: textSecondary }]}>{event.attendeesCount || 0} inscrits</ThemedText>
                    </View>
                  </AnimatedCard>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* Messages Section */}
        <Animated.View entering={FadeInUp.duration(400).delay(250)}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Messages récents</ThemedText>
            <TouchableOpacity onPress={() => router.push('/(animator)/messages')} style={styles.seeAllButton}>
              <ThemedText style={[styles.seeAllText, { color: BrandColors.accent[500] }]}>Messagerie</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={BrandColors.accent[500]} />
            </TouchableOpacity>
          </View>

          <View style={[styles.messagesCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            {recentMessages.length === 0 ? (
              <ThemedText style={[styles.emptyText, { color: textSecondary }]}>Aucun message récent</ThemedText>
            ) : (
              recentMessages.map((item, index) => {
                return (
                  <TouchableOpacity
                    key={item.channel.id}
                    style={[styles.messageItem, index < recentMessages.length - 1 && { borderBottomWidth: 1, borderBottomColor: cardBorder }]}
                    onPress={() => router.push('/(animator)/messages')}
                  >
                    <View style={styles.messageContent}>
                      <ThemedText style={[styles.channelName, { color: textColor }]}>#{item.channel.name}</ThemedText>
                      <ThemedText style={[styles.messagePreview, { color: textSecondary }]} numberOfLines={1}>
                        {item.lastMessage?.content || 'Nouveau canal'}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.messageTime, { color: textSecondary }]}>
                      {item.lastMessage?.createdAt ? formatTimeAgo(new Date(item.lastMessage.createdAt)) : ''}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </Animated.View>

        {/* Challenges & Leaderboard Section */}
        <Animated.View entering={FadeInUp.duration(400).delay(300)}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Défis & Classement</ThemedText>
            <TouchableOpacity onPress={() => router.push('/(animator)/challenges')} style={styles.seeAllButton}>
              <ThemedText style={[styles.seeAllText, { color: BrandColors.accent[500] }]}>Tout voir</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={BrandColors.accent[500]} />
            </TouchableOpacity>
          </View>

          {/* Top 3 Leaderboard */}
          <View style={[styles.leaderboardCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
              <ThemedText style={[styles.cardSubtitle, { color: textSecondary }]}>TOP 3 🏆</ThemedText>
              {topScouts.length === 0 ? (
                <ThemedText style={[styles.emptySmall, { color: textSecondary }]}>Pas de classement</ThemedText>
              ) : (
                topScouts.map((scout, index) => (
                  <View key={scout.id} style={styles.leaderboardItem}>
                    <ThemedText style={[styles.leaderboardRank, { color: BrandColors.accent[500] }]}>{index + 1}.</ThemedText>
                    <ThemedText style={styles.leaderboardEmoji}>{getUserTotemEmoji(scout) || '👤'}</ThemedText>
                    <ThemedText style={[styles.leaderboardName, { color: textColor }]} numberOfLines={1}>
                      {getDisplayName(scout, { firstNameOnly: true, lastNameInitial: true })}
                    </ThemedText>
                    <ThemedText style={[styles.leaderboardPoints, { color: BrandColors.accent[500] }]}>{scout.points}</ThemedText>
                  </View>
                ))
              )}
          </View>
        </Animated.View>

        {/* Weather & Birthday Widgets */}
        <Animated.View entering={FadeInUp.duration(400).delay(350)}>
          <View style={styles.widgetsRow}>
            <WeatherWidgetCompact location="Belgique" />
            {animator?.unitId && <BirthdayWidgetCompact unitId={animator.unitId} />}
          </View>
        </Animated.View>

        {/* Rewards Section */}
        <Animated.View entering={FadeInUp.duration(400).delay(400)}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Récompenses</ThemedText>
            <TouchableOpacity onPress={() => router.push('/(animator)/partners')} style={styles.seeAllButton}>
              <ThemedText style={[styles.seeAllText, { color: BrandColors.accent[500] }]}>Voir les offres</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={BrandColors.accent[500]} />
            </TouchableOpacity>
          </View>

          <View style={[styles.rewardsCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            {/* Balance Header */}
            <View style={styles.rewardsHeader}>
              <View style={styles.rewardsBalance}>
                <ThemedText style={styles.rewardsEmoji}>🎁</ThemedText>
                <View>
                  <ThemedText style={[styles.rewardsBalanceLabel, { color: textSecondary }]}>Solde de l'unité</ThemedText>
                  <ThemedText style={[styles.rewardsBalanceValue, { color: BrandColors.accent[500] }]}>
                    {unitBalance.toLocaleString('fr-FR')} pts
                  </ThemedText>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.rewardsHistoryButton, { backgroundColor: `${BrandColors.accent[500]}15` }]}
                onPress={() => router.push('/(animator)/partners/history')}
              >
                <Ionicons name="time-outline" size={16} color={BrandColors.accent[500]} />
              </TouchableOpacity>
            </View>

            {/* Featured Offers */}
            {featuredOffers.length > 0 ? (
              <View style={styles.featuredOffers}>
                {featuredOffers.map((offer) => (
                  <TouchableOpacity
                    key={offer.id}
                    style={[styles.featuredOfferItem, { borderColor: cardBorder }]}
                    onPress={() => router.push(`/(animator)/partners/offer/${offer.id}`)}
                  >
                    {offer.partner.logo?.startsWith('http') ? (
                      <Image source={{ uri: offer.partner.logo }} style={styles.featuredOfferLogoImage} />
                    ) : (
                      <ThemedText style={styles.featuredOfferLogo}>{offer.partner.logo}</ThemedText>
                    )}
                    <View style={styles.featuredOfferInfo}>
                      <ThemedText style={[styles.featuredOfferTitle, { color: textColor }]} numberOfLines={1}>
                        {offer.title}
                      </ThemedText>
                      <ThemedText style={[styles.featuredOfferPartner, { color: textSecondary }]}>
                        {offer.partner.name}
                      </ThemedText>
                    </View>
                    <View style={[styles.featuredOfferCost, { backgroundColor: `${BrandColors.primary[500]}10` }]}>
                      <ThemedText style={[styles.featuredOfferCostText, { color: BrandColors.primary[600] }]}>
                        {offer.pointsCost} pts
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.rewardsEmpty}>
                <ThemedText style={[styles.rewardsEmptyText, { color: textSecondary }]}>
                  Aucune offre disponible
                </ThemedText>
              </View>
            )}
          </View>
        </Animated.View>

      </ScrollView>

      {/* Notifications Modal */}
      <NotificationsModal
        visible={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      />
    </ThemedView>
  );
}

// Compact Weather Widget - Connected to real API
function WeatherWidgetCompact({ location }: { location: string }) {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWeather = async () => {
      try {
        const coords = await WeatherService.getCoordinates(location);
        if (coords) {
          const data = await WeatherService.getForecast(coords.latitude, coords.longitude, 3);
          setForecast(data);
        }
      } catch (error) {
        console.error('Erreur météo:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadWeather();
  }, [location]);

  // Trouver le prochain jour de pluie
  const getRainInfo = () => {
    if (!forecast) return null;
    const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    for (const day of forecast.daily.slice(1)) {
      if (day.precipitationProbability > 30) {
        return `🌧️ ${day.precipitationProbability}% · Pluie prévue ${DAYS[day.date.getDay()].toLowerCase()}`;
      }
    }
    return null;
  };

  if (isLoading || !forecast) {
    return (
      <LinearGradient colors={[BrandColors.primary[500], BrandColors.primary[600]]} style={styles.weatherWidget}>
        <View style={styles.weatherHeader}>
          <ThemedText style={styles.weatherIcon}>☁️</ThemedText>
          <ThemedText style={styles.weatherTemp}>--°</ThemedText>
        </View>
        <ThemedText style={styles.weatherDesc}>Chargement...</ThemedText>
      </LinearGradient>
    );
  }

  const rainInfo = getRainInfo();

  return (
    <LinearGradient colors={[BrandColors.primary[500], BrandColors.primary[600]]} style={styles.weatherWidget}>
      <View style={styles.weatherHeader}>
        <ThemedText style={styles.weatherIcon}>{WeatherService.getWeatherIcon(forecast.current.weatherCode)}</ThemedText>
        <ThemedText style={styles.weatherTemp}>{forecast.current.temperature}°</ThemedText>
      </View>
      <ThemedText style={styles.weatherDesc}>{WeatherService.getWeatherDescription(forecast.current.weatherCode)}</ThemedText>
      {rainInfo && <ThemedText style={styles.weatherRain}>{rainInfo}</ThemedText>}
    </LinearGradient>
  );
}

// Compact Birthday Widget - Connected to Firebase
function BirthdayWidgetCompact({ unitId }: { unitId: string }) {
  const [birthday, setBirthday] = useState<BirthdayInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  useEffect(() => {
    const loadBirthday = async () => {
      try {
        const birthdays = await BirthdayService.getUpcomingBirthdays(unitId, 30);
        if (birthdays.length > 0) {
          setBirthday(birthdays[0]); // Le plus proche
        }
      } catch (error) {
        console.error('Erreur anniversaires:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBirthday();
  }, [unitId]);

  if (isLoading) {
    return (
      <View style={[styles.birthdayWidget, { backgroundColor: cardColor, borderColor: cardBorder }]}>
        <View style={styles.birthdayHeader}>
          <ThemedText style={styles.birthdayEmoji}>🎂</ThemedText>
          <ThemedText style={[styles.birthdayLabel, { color: BrandColors.accent[500] }]}>Anniversaire</ThemedText>
        </View>
        <ThemedText style={[styles.birthdayName, { color: textSecondary }]}>Chargement...</ThemedText>
      </View>
    );
  }

  if (!birthday) {
    return (
      <View style={[styles.birthdayWidget, { backgroundColor: cardColor, borderColor: cardBorder }]}>
        <View style={styles.birthdayHeader}>
          <ThemedText style={styles.birthdayEmoji}>🎂</ThemedText>
          <ThemedText style={[styles.birthdayLabel, { color: BrandColors.accent[500] }]}>Anniversaire</ThemedText>
        </View>
        <ThemedText style={[styles.birthdayName, { color: textSecondary }]}>Aucun ce mois</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.birthdayWidget, { backgroundColor: cardColor, borderColor: cardBorder }]}>
      <View style={styles.birthdayHeader}>
        <ThemedText style={styles.birthdayEmoji}>🎂</ThemedText>
        <ThemedText style={[styles.birthdayLabel, { color: BrandColors.accent[500] }]}>Anniversaire</ThemedText>
      </View>
      <ThemedText style={[styles.birthdayName, { color: textColor }]}>
        {birthday.firstName} {birthday.lastName}
      </ThemedText>
      <ThemedText style={[styles.birthdayDate, { color: textSecondary }]}>
        {formatShortDate(birthday.dateOfBirth)} · {birthday.age} ans
      </ThemedText>
      <View style={[styles.birthdayBadge, { backgroundColor: birthday.isToday ? BrandColors.accent[500] : `${BrandColors.accent[500]}20` }]}>
        <ThemedText style={[styles.birthdayBadgeText, { color: birthday.isToday ? '#FFFFFF' : BrandColors.accent[500] }]}>
          {BirthdayService.getBirthdayLabel(birthday.daysUntil)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // Header
  headerGradient: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 80,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    direction: 'ltr',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    direction: 'ltr',
  },
  greetingContainer: { flex: 1, marginTop: Spacing.sm },
  greeting: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.xs, writingDirection: 'ltr' },
  unitName: { fontSize: 26, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.5, writingDirection: 'ltr', marginTop: 2 },
  unitGroup: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2, writingDirection: 'ltr' },
  sectionBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  sectionBadgeLogo: { width: 24, height: 24, borderRadius: 6 },
  sectionBadgeText: { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
  unitBadge: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 },
  unitBadgeLogoContainer: {
    width: 72, height: 72, borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  unitBadgeLogo: { width: '100%', height: '100%', borderRadius: 10 },
  unitBadgeLogoPlaceholder: {
    width: 72, height: 72, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, direction: 'ltr' },
  notificationButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute', top: 4, right: 4,
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: BrandColors.accent[500],
    borderWidth: 2, borderColor: BrandColors.primary[600],
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 11, fontWeight: '700', color: '#FFFFFF', lineHeight: 14,
  },
  avatarButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  avatarEmoji: { fontSize: 24 },

  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg, direction: 'ltr' },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.lg, paddingTop: 18, paddingBottom: 14, alignItems: 'center',
    overflow: 'visible',
  },
  statValue: { fontSize: 24, fontWeight: '600', color: '#FFFFFF', writingDirection: 'ltr' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2, writingDirection: 'ltr' },
  membersBreakdown: { flexDirection: 'row', gap: 8, marginTop: 4 },
  membersScouts: { fontSize: 10, color: '#FFFFFF', fontWeight: '500' },
  membersAnimators: { fontSize: 10, color: BrandColors.accent[400], fontWeight: '600' },

  // Alerts
  alertCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.xl, marginTop: Spacing.md,
    padding: Spacing.md, borderRadius: Radius.lg, gap: Spacing.md,
    direction: 'ltr',
  },
  alertIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  alertEmoji: { fontSize: 20 },
  alertText: { flex: 1, fontSize: 14, fontWeight: '500' },
  alertButton: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md },
  alertButtonText: { fontSize: 13, fontWeight: '600' },

  // Quick Actions
  quickActions: { flexDirection: 'row', paddingHorizontal: Spacing.xl, marginTop: Spacing.xl, gap: Spacing.md, direction: 'ltr' },
  primaryAction: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: Radius.xl, gap: Spacing.sm,
  },
  primaryActionText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  secondaryAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, borderRadius: Radius.xl, borderWidth: 1, gap: Spacing.sm,
  },
  secondaryActionText: { fontSize: 15, fontWeight: '500' },
  moreAction: {
    width: 48, height: 48, borderRadius: Radius.xl, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  // Section
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, marginTop: Spacing.xl, marginBottom: Spacing.md,
    direction: 'ltr',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, writingDirection: 'ltr' },
  seeAllButton: { flexDirection: 'row', alignItems: 'center', gap: 2, direction: 'ltr' },
  seeAllText: { fontSize: 14, fontWeight: '500', writingDirection: 'ltr' },

  // Events
  eventsScroll: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  eventCard: {
    width: 220,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  eventCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    direction: 'ltr',
  },
  eventDateBadge: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDateDay: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  eventDateNumber: { fontSize: 24, fontWeight: '700', marginTop: -2 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  eventMeta: { fontSize: 13 },
  eventAttendees: { flexDirection: 'row', alignItems: 'center', gap: 6, direction: 'ltr' },
  eventAttendeesText: { fontSize: 13 },

  // Messages
  messagesCard: { marginHorizontal: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden' },
  messageItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md, direction: 'ltr' },
  messageContent: { flex: 1 },
  channelName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  messagePreview: { fontSize: 13 },
  messageTime: { fontSize: 12 },
  emptyText: { textAlign: 'center', padding: Spacing.xl },

  // Leaderboard
  leaderboardCard: { marginHorizontal: Spacing.xl, padding: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1 },
  cardSubtitle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: Spacing.md },
  emptySmall: { fontSize: 12, textAlign: 'center', paddingVertical: Spacing.lg },
  leaderboardItem: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm, direction: 'ltr' },
  leaderboardRank: { fontSize: 14, fontWeight: '700', width: 20 },
  leaderboardEmoji: { fontSize: 20 },
  leaderboardName: { flex: 1, fontSize: 13, fontWeight: '500' },
  leaderboardPoints: { fontSize: 14, fontWeight: '700' },

  // Widgets Row
  widgetsRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, marginTop: Spacing.xl, gap: Spacing.md, direction: 'ltr' },

  // Weather Widget
  weatherWidget: { flex: 1, borderRadius: Radius.xl, padding: Spacing.lg, minHeight: 120, overflow: 'hidden' },
  weatherHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs, direction: 'ltr' },
  weatherIcon: { fontSize: 32, lineHeight: 40, textAlign: 'center' },
  weatherTemp: { fontSize: 36, fontWeight: '300', color: '#FFFFFF', lineHeight: 42 },
  weatherDesc: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: Spacing.sm, lineHeight: 18 },
  weatherRain: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 16 },

  // Birthday Widget
  birthdayWidget: { flex: 1, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1 },
  birthdayHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm, direction: 'ltr' },
  birthdayEmoji: { fontSize: 20 },
  birthdayLabel: { fontSize: 12, fontWeight: '600' },
  birthdayName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  birthdayDate: { fontSize: 12, marginBottom: Spacing.sm },
  birthdayBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  birthdayBadgeText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },

  // Rewards Section
  rewardsCard: { marginHorizontal: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.lg, overflow: 'hidden' },
  rewardsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg, direction: 'ltr' },
  rewardsBalance: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, direction: 'ltr' },
  rewardsEmoji: { fontSize: 28, lineHeight: 36, textAlign: 'center' },
  rewardsBalanceLabel: { fontSize: 12, marginBottom: 2 },
  rewardsBalanceValue: { fontSize: 20, fontWeight: '700' },
  rewardsHistoryButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  featuredOffers: { gap: Spacing.sm },
  featuredOfferItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, gap: Spacing.md, direction: 'ltr' },
  featuredOfferLogo: { fontSize: 24 },
  featuredOfferLogoImage: { width: 40, height: 40, borderRadius: 8 },
  featuredOfferInfo: { flex: 1 },
  featuredOfferTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  featuredOfferPartner: { fontSize: 12 },
  featuredOfferCost: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.md },
  featuredOfferCostText: { fontSize: 12, fontWeight: '600' },
  rewardsEmpty: { paddingVertical: Spacing.xl, alignItems: 'center' },
  rewardsEmptyText: { fontSize: 14 },
});
