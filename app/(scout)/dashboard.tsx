import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { Scout, UserRole, HealthRecord, Section } from '@/types';
import { useEvents } from '@/src/features/events/hooks/use-events';
import { useChallenges } from '@/src/features/challenges/hooks/use-challenges';
import { useAllChallengeProgress } from '@/src/features/challenges/hooks/use-all-challenge-progress';
import { useScoutLevel } from '@/src/features/challenges/hooks/use-scout-level';
import { LeaderboardService, LeaderboardEntry } from '@/services/leaderboard-service';
import { ChannelService } from '@/src/shared/services/channel-service';
import { UserService } from '@/services/user-service';
import { HealthService } from '@/services/health-service';
import { SectionService } from '@/services/section-service';
import { ChallengeSubmissionService } from '@/services/challenge-submission-service';
import { ChallengeService } from '@/services/challenge-service';
import { ChallengeStatus } from '@/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { getCountdownLabel, getCountdownColor } from '@/src/shared/utils/date-utils';
import { getUserTotemEmoji, getDisplayName } from '@/src/shared/utils/totem-utils';
import { useThemeColor } from '@/hooks/use-theme-color';

// Import des widgets existants
import {
  ActivityWidget,
  WeatherWidget,
} from '@/src/features/dashboard/components';

// Types
interface RecentChannel {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageAt: Date;
  unread: boolean;
}

export default function ScoutDashboardScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { events } = useEvents();
  const { challenges } = useChallenges();
  const { completedCount, isStarted, startedCount } = useAllChallengeProgress();

  const scout = user as Scout;
  const { currentLevel } = useScoutLevel({ points: scout?.points || 0 });

  // Couleurs dynamiques pour le thème
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');

  // State pour le classement et messages
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [scoutRank, setScoutRank] = useState<number>(1);
  const [recentChannels, setRecentChannels] = useState<RecentChannel[]>([]);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [newMembers, setNewMembers] = useState<{ id: string; firstName: string; lastName: string; validatedAt: Date }[]>([]);
  const [validatedChallenges, setValidatedChallenges] = useState<{ id: string; challengeId: string; title: string; points: number; validatedAt: Date }[]>([]);

  // State pour la fiche santé
  const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null);
  const [healthRecordLoading, setHealthRecordLoading] = useState(true);

  // State pour la section
  const [section, setSection] = useState<Section | null>(null);

  // Filtrer les nouveautés non vues
  const lastNewsViewedAt = scout?.lastNewsViewedAt || new Date(0);

  const newChallenges = challenges.filter(c => {
    const createdAt = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
    return createdAt > lastNewsViewedAt;
  });

  const newEvents = events.filter(e => {
    const createdAt = e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt);
    return createdAt > lastNewsViewedAt;
  });

  const totalNewItems = newChallenges.length + newEvents.length + newMembers.length + validatedChallenges.length;

  // Fonction pour marquer les nouveautés comme vues
  const markNewsAsViewed = async () => {
    if (!scout?.id) return;
    try {
      await UserService.updateUser(scout.id, {
        lastNewsViewedAt: new Date(),
      });
    } catch (error) {
      console.error('Erreur mise à jour lastNewsViewedAt:', error);
    }
  };

  // Fermer le modal et marquer comme vu
  const closeNewsModal = () => {
    setShowNewsModal(false);
    if (totalNewItems > 0) {
      markNewsAsViewed();
    }
  };

  // Ouvrir automatiquement le modal si nouvelles non vues à la connexion
  const [hasAutoOpenedNews, setHasAutoOpenedNews] = useState(false);

  useEffect(() => {
    // Ouvrir le modal automatiquement une seule fois par session
    // quand les données sont chargées et qu'il y a des nouveautés
    if (!hasAutoOpenedNews && !isLoading && scout?.id && totalNewItems > 0) {
      // Petit délai pour laisser le dashboard se charger
      const timer = setTimeout(() => {
        setShowNewsModal(true);
        setHasAutoOpenedNews(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [hasAutoOpenedNews, isLoading, scout?.id, totalNewItems]);

  // Vérification de sécurité - rediriger si ce n'est pas un scout
  useEffect(() => {
    if (!isLoading && user && user.role !== UserRole.SCOUT && user.role !== 'scout') {
      if (user.role === UserRole.ANIMATOR || user.role === 'animator') {
        router.replace('/(animator)/dashboard');
      } else if (user.role === UserRole.PARENT || user.role === 'parent') {
        router.replace('/(parent)/dashboard');
      }
    }
  }, [user, isLoading, router]);

  // Charger le classement et les nouveaux membres
  useEffect(() => {
    if (scout?.unitId) {
      loadLeaderboard();
      loadScoutRank();
      loadRecentChannels();
      loadNewMembers();
    }
  }, [scout?.unitId, scout?.id]);

  // Charger les données de la section
  useEffect(() => {
    const loadSection = async () => {
      if (scout?.sectionId) {
        try {
          const sectionData = await SectionService.getSectionById(scout.sectionId);
          setSection(sectionData);
        } catch (error) {
          console.error('Erreur chargement section:', error);
        }
      }
    };
    loadSection();
  }, [scout?.sectionId]);

  // Charger les défis validés récemment
  useEffect(() => {
    if (scout?.id) {
      loadValidatedChallenges();
    }
  }, [scout?.id, lastNewsViewedAt]);

  // Charger la fiche santé (et recharger quand l'écran revient au focus)
  const loadHealthRecord = useCallback(async () => {
    if (!scout?.id) {
      setHealthRecordLoading(false);
      return;
    }
    try {
      const record = await HealthService.getHealthRecord(scout.id);
      setHealthRecord(record);
    } catch (error) {
      console.error('Erreur chargement fiche santé:', error);
    } finally {
      setHealthRecordLoading(false);
    }
  }, [scout?.id]);

  // Recharger la fiche santé quand l'écran revient au premier plan
  useFocusEffect(
    useCallback(() => {
      loadHealthRecord();
    }, [loadHealthRecord])
  );

  const loadLeaderboard = async () => {
    if (!scout?.unitId) return;
    const entries = await LeaderboardService.getLeaderboardByUnit(scout.unitId, 3);
    setLeaderboard(entries);
  };

  const loadScoutRank = async () => {
    if (!scout?.id || !scout?.unitId) return;
    const rank = await LeaderboardService.getScoutRank(scout.id, scout.unitId);
    setScoutRank(rank);
  };

  const loadRecentChannels = async () => {
    if (!scout?.unitId) return;
    try {
      const channels = await ChannelService.getChannelsByUnit(scout.unitId);
      const recent: RecentChannel[] = channels.slice(0, 2).map(ch => ({
        id: ch.id,
        name: ch.name,
        lastMessage: ch.lastMessage || 'Aucun message',
        lastMessageAt: ch.lastMessageAt || new Date(),
        unread: false, // TODO: implémenter la logique de non-lu
      }));
      setRecentChannels(recent);
    } catch (error) {
      console.error('Erreur chargement channels:', error);
    }
  };

  // Charger les nouveaux membres de l'unité (validés récemment)
  const loadNewMembers = async () => {
    if (!scout?.unitId || !scout?.id) return;
    try {
      // Requête simplifiée avec une seule condition pour éviter les problèmes d'index
      const scoutsQuery = query(
        collection(db, 'users'),
        where('unitId', '==', scout.unitId)
      );
      const snapshot = await getDocs(scoutsQuery);
      const members: { id: string; firstName: string; lastName: string; validatedAt: Date }[] = [];

      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        // Filtrage côté client: scouts validés uniquement
        if (
          docSnapshot.id !== scout.id &&
          data.role === 'scout' &&
          data.validated === true &&
          data.validatedAt
        ) {
          const validatedAt = data.validatedAt.toDate();
          if (validatedAt > lastNewsViewedAt) {
            members.push({
              id: docSnapshot.id,
              firstName: data.firstName,
              lastName: data.lastName,
              validatedAt,
            });
          }
        }
      });

      // Trier par date (plus récent en premier)
      members.sort((a, b) => b.validatedAt.getTime() - a.validatedAt.getTime());
      setNewMembers(members.slice(0, 5));
    } catch (error) {
      console.error('Erreur chargement nouveaux membres:', error);
    }
  };

  // Charger les défis validés récemment (pour ce scout)
  const loadValidatedChallenges = async () => {
    if (!scout?.id) return;
    try {
      // Récupérer toutes les soumissions du scout
      const submissions = await ChallengeSubmissionService.getSubmissionsByScout(scout.id);

      // Filtrer les soumissions validées après lastNewsViewedAt
      const recentlyValidated = submissions.filter(s =>
        s.status === ChallengeStatus.COMPLETED &&
        s.validatedAt &&
        s.validatedAt > lastNewsViewedAt
      );

      // Récupérer les infos des défis correspondants
      const validatedWithDetails: { id: string; challengeId: string; title: string; points: number; validatedAt: Date }[] = [];

      for (const submission of recentlyValidated) {
        const challenge = await ChallengeService.getChallengeById(submission.challengeId);
        if (challenge && submission.validatedAt) {
          validatedWithDetails.push({
            id: submission.id,
            challengeId: submission.challengeId,
            title: challenge.title,
            points: challenge.points,
            validatedAt: submission.validatedAt,
          });
        }
      }

      // Trier par date (plus récent en premier)
      validatedWithDetails.sort((a, b) => b.validatedAt.getTime() - a.validatedAt.getTime());
      setValidatedChallenges(validatedWithDetails.slice(0, 5));
    } catch (error) {
      console.error('Erreur chargement défis validés:', error);
    }
  };

  // Données
  const upcomingEvents = events.slice(0, 2);
  // Filtrer uniquement les défis que le scout a manuellement commencés (status STARTED)
  const startedChallenges = challenges.filter(c => isStarted(c.id)).slice(0, 3);

  const stats = [
    { value: scout?.points || 0, label: 'Points', isAccent: true },
    { value: `#${scoutRank}`, label: 'Rang', isAccent: false },
    { value: completedCount.toString(), label: 'Défis', isAccent: false },
    { value: events.length.toString(), label: 'Événements', isAccent: false },
  ];

  // Vérifier si la fiche santé est manquante ou incomplète
  // On utilise hasBasicHealthInfo pour ne pas bloquer le scout avant la signature parent
  const isHealthRecordMissing = !healthRecordLoading && healthRecord === null;
  const isHealthRecordIncomplete = !healthRecordLoading && healthRecord !== null && !HealthService.hasBasicHealthInfo(healthRecord);
  const needsParentSignature = !healthRecordLoading && healthRecord !== null && HealthService.needsParentSignature(healthRecord);
  const showHealthAlert = isHealthRecordMissing || isHealthRecordIncomplete;

  // Helper pour obtenir l'avatar ou l'emoji
  const getAvatarContent = () => {
    if (scout?.profilePicture) {
      return (
        <Image
          source={{ uri: scout.profilePicture }}
          style={styles.avatarImage}
        />
      );
    }
    return (
      <ThemedText style={styles.avatarEmoji}>
        {getUserTotemEmoji(scout) || '🦊'}
      </ThemedText>
    );
  };

  // Helper pour le temps relatif
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `Il y a ${days}j`;
    if (hours > 0) return `Il y a ${hours}h`;
    return 'À l\'instant';
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ==================== HEADER IMMERSIF ==================== */}
        <LinearGradient
          colors={[BrandColors.primary[500], BrandColors.primary[400]]}
          style={styles.header}
        >
          {/* Cercles décoratifs */}
          <View style={[styles.decorativeCircle, styles.decorativeCircle1]} />
          <View style={[styles.decorativeCircle, styles.decorativeCircle2]} />

          {/* Top Row - Profile & Notifications */}
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => router.push('/(scout)/profile')}
              activeOpacity={0.8}
            >
              {getAvatarContent()}
            </TouchableOpacity>

            <View style={styles.headerInfo}>
              <ThemedText style={styles.headerGreeting}>
                Salut, {scout?.firstName} ! 👋
              </ThemedText>
              <ThemedText style={styles.headerTotem}>
                {scout?.totemAnimal ? `${getUserTotemEmoji(scout) || ''} ${scout.totemAnimal}`.trim() : getDisplayName(scout)}
              </ThemedText>
              {section && (
                <TouchableOpacity
                  style={styles.sectionBadge}
                  onPress={() => router.push('/(scout)/section')}
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
              <View style={styles.headerBadges}>
                <View style={styles.levelBadge}>
                  <ThemedText style={styles.levelBadgeText}>
                    {currentLevel?.name || 'Explorateur'}
                  </ThemedText>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => setShowNewsModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="sparkles" size={22} color="#FFFFFF" />
              {totalNewItems > 0 && (
                <View style={styles.notificationDot} />
              )}
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {stats.map((stat, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.statCard,
                  stat.isAccent ? styles.statCardAccent : styles.statCardTransparent
                ]}
                onPress={() => {
                  if (stat.label === 'Points' || stat.label === 'Rang') {
                    router.push('/(scout)/leaderboard');
                  } else if (stat.label === 'Défis') {
                    router.push('/(scout)/challenges');
                  } else if (stat.label === 'Événements') {
                    router.push('/(scout)/events');
                  }
                }}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
                <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        {/* Contenu principal */}
        <View style={styles.content}>
          {/* ==================== ALERTE FICHE SANTÉ MANQUANTE (ROUGE) ==================== */}
          {showHealthAlert && (
            <Animated.View entering={FadeInUp.duration(400)} style={styles.healthAlertSection}>
              <TouchableOpacity
                style={styles.healthAlertCard}
                onPress={() => router.push('/(scout)/health/edit')}
                activeOpacity={0.8}
              >
                <View style={styles.healthAlertIconContainer}>
                  <Ionicons name="medical" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.healthAlertContent}>
                  <ThemedText style={styles.healthAlertTitle}>
                    {isHealthRecordMissing ? 'Fiche santé manquante' : 'Fiche santé incomplète'}
                  </ThemedText>
                  <ThemedText style={styles.healthAlertDescription}>
                    {isHealthRecordMissing
                      ? 'Tu dois remplir ta fiche santé pour participer aux activités.'
                      : 'Ajoute au moins un contact d\'urgence pour compléter ta fiche.'}
                  </ThemedText>
                </View>
                <View style={styles.healthAlertArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ==================== ALERTE SIGNATURE PARENT (ORANGE) ==================== */}
          {needsParentSignature && !showHealthAlert && (
            <Animated.View entering={FadeInUp.duration(400)} style={styles.healthAlertSection}>
              <TouchableOpacity
                style={styles.signatureAlertCard}
                onPress={() => router.push('/(scout)/health')}
                activeOpacity={0.8}
              >
                <View style={styles.signatureAlertIconContainer}>
                  <Ionicons name="create-outline" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.healthAlertContent}>
                  <ThemedText style={styles.healthAlertTitle}>
                    Signature parent requise
                  </ThemedText>
                  <ThemedText style={styles.healthAlertDescription}>
                    Ta fiche santé doit être signée par un parent ou tuteur.
                  </ThemedText>
                </View>
                <View style={styles.signatureAlertArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ==================== PROCHAINS ÉVÉNEMENTS ==================== */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Prochains événements</ThemedText>
              <TouchableOpacity
                style={styles.seeAllButtonGreen}
                onPress={() => router.push('/(scout)/events')}
              >
                <ThemedText style={styles.seeAllText}>Tout voir</ThemedText>
                <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {upcomingEvents.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
                <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                  Aucun événement à venir
                </ThemedText>
              </View>
            ) : (
              <View style={styles.eventsList}>
                {upcomingEvents.map((event) => {
                  const eventDate = new Date(event.startDate);
                  const day = eventDate.getDate().toString().padStart(2, '0');
                  const month = eventDate.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
                  const startTime = eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  const endTime = new Date(event.endDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  const countdownLabel = getCountdownLabel(eventDate);
                  const countdownColor = getCountdownColor(eventDate);

                  return (
                    <TouchableOpacity
                      key={event.id}
                      style={[styles.eventCard, { backgroundColor: cardColor, borderColor: cardBorderColor }]}
                      onPress={() => router.push('/(scout)/events')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.eventDateBadge}>
                        <ThemedText style={styles.eventDay}>{day}</ThemedText>
                        <ThemedText style={styles.eventMonth}>{month}</ThemedText>
                      </View>
                      <View style={styles.eventContent}>
                        <View style={styles.eventTitleRow}>
                          <ThemedText style={[styles.eventTitle, { color: textColor }]} numberOfLines={1}>
                            {event.title}
                          </ThemedText>
                          <View style={[styles.countdownBadge, { backgroundColor: `${countdownColor}15` }]}>
                            <ThemedText style={[styles.countdownText, { color: countdownColor }]}>
                              {countdownLabel}
                            </ThemedText>
                          </View>
                        </View>
                        <View style={styles.eventDetail}>
                          <Ionicons name="time-outline" size={12} color={textSecondary} />
                          <ThemedText style={[styles.eventDetailText, { color: textSecondary }]}>
                            {startTime} - {endTime}
                          </ThemedText>
                        </View>
                        <View style={styles.eventDetail}>
                          <Ionicons name="location-outline" size={12} color={textSecondary} />
                          <ThemedText style={[styles.eventDetailText, { color: textSecondary }]} numberOfLines={1}>
                            {event.location}
                          </ThemedText>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={textSecondary} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Animated.View>

          {/* ==================== DÉFIS EN COURS ==================== */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Défis en cours</ThemedText>
              <TouchableOpacity
                style={styles.seeAllButtonOrange}
                onPress={() => router.push('/(scout)/challenges')}
              >
                <ThemedText style={styles.seeAllText}>Tout voir</ThemedText>
                <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {startedChallenges.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
                <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                  Tu n'as pas encore commencé de défi
                </ThemedText>
              </View>
            ) : (
              <View style={styles.challengesList}>
                {startedChallenges.map((challenge) => {
                  const daysRemaining = challenge.endDate
                    ? Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                    : null;

                  return (
                    <TouchableOpacity
                      key={challenge.id}
                      style={[styles.challengeCard, { backgroundColor: cardColor, borderColor: cardBorderColor }]}
                      onPress={() => router.push(`/(scout)/challenges/${challenge.id}`)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.challengeIconContainer}>
                        <ThemedText style={styles.challengeEmoji}>
                          {challenge.emoji || '🎯'}
                        </ThemedText>
                      </View>
                      <View style={styles.challengeContent}>
                        <View style={styles.challengeHeader}>
                          <ThemedText style={[styles.challengeTitle, { color: textColor }]} numberOfLines={1}>
                            {challenge.title}
                          </ThemedText>
                          {daysRemaining !== null && (
                            <ThemedText style={[styles.challengeDays, { color: textSecondary }]}>
                              {daysRemaining}j restant{daysRemaining > 1 ? 's' : ''}
                            </ThemedText>
                          )}
                        </View>
                        <ThemedText style={[styles.challengeDescription, { color: textSecondary }]} numberOfLines={2}>
                          {challenge.description}
                        </ThemedText>
                        <View style={styles.challengeFooter}>
                          <View style={styles.startedBadge}>
                            <Ionicons name="play-circle" size={14} color={BrandColors.primary[500]} />
                            <ThemedText style={styles.startedBadgeText}>En cours</ThemedText>
                          </View>
                          <ThemedText style={styles.challengePoints}>
                            ⭐ {challenge.points} pts
                          </ThemedText>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Animated.View>

          {/* ==================== MINI CLASSEMENT ==================== */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>🏆 Classement</ThemedText>
              <TouchableOpacity
                onPress={() => router.push('/(scout)/leaderboard')}
              >
                <View style={styles.linkButton}>
                  <ThemedText style={styles.linkText}>Voir tout</ThemedText>
                  <Ionicons name="chevron-forward" size={14} color={BrandColors.primary[500]} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.leaderboardCard, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
              {leaderboard.length === 0 ? (
                <ThemedText style={[styles.emptyText, { color: textSecondary }]}>Chargement...</ThemedText>
              ) : (
                leaderboard.map((entry, index) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const isCurrentUser = entry.scout.id === scout?.id;

                  return (
                    <View
                      key={entry.scout.id}
                      style={[
                        styles.leaderboardEntry,
                        isCurrentUser && styles.leaderboardEntryHighlight,
                        index < leaderboard.length - 1 && [styles.leaderboardEntryBorder, { borderBottomColor: cardBorderColor }]
                      ]}
                    >
                      <ThemedText style={styles.leaderboardMedal}>
                        {medals[index]}
                      </ThemedText>
                      <View style={[
                        styles.leaderboardAvatar,
                        isCurrentUser && styles.leaderboardAvatarHighlight
                      ]}>
                        <ThemedText style={styles.leaderboardAvatarText}>
                          {getUserTotemEmoji(entry.scout) || entry.scout.firstName?.charAt(0) || '?'}
                        </ThemedText>
                      </View>
                      <View style={styles.leaderboardInfo}>
                        <ThemedText style={[
                          styles.leaderboardName,
                          { color: textColor },
                          isCurrentUser && styles.leaderboardNameHighlight
                        ]}>
                          {entry.scout.firstName || 'Scout'} {isCurrentUser && '(toi)'}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.leaderboardPoints}>
                        {entry.points} pts
                      </ThemedText>
                    </View>
                  );
                })
              )}
            </View>
          </Animated.View>

          {/* ==================== MESSAGES RÉCENTS ==================== */}
          <Animated.View entering={FadeInUp.duration(400).delay(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>💬 Messages récents</ThemedText>
              <TouchableOpacity
                onPress={() => router.push('/(scout)/messages')}
              >
                <View style={styles.linkButton}>
                  <ThemedText style={styles.linkText}>Messagerie</ThemedText>
                  <Ionicons name="chevron-forward" size={14} color={BrandColors.primary[500]} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.messagesCard, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
              {recentChannels.length === 0 ? (
                <ThemedText style={[styles.emptyText, { padding: 16, color: textSecondary }]}>Aucun message récent</ThemedText>
              ) : (
                recentChannels.map((channel, index) => (
                  <TouchableOpacity
                    key={channel.id}
                    style={[
                      styles.messageEntry,
                      index < recentChannels.length - 1 && [styles.messageEntryBorder, { borderBottomColor: cardBorderColor }]
                    ]}
                    onPress={() => router.push('/(scout)/messages')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.messageIcon}>
                      <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.messageContent}>
                      <View style={styles.messageHeader}>
                        <ThemedText style={[styles.channelName, { color: textColor }]}>{channel.name}</ThemedText>
                        {channel.unread && <View style={styles.unreadDot} />}
                      </View>
                      <ThemedText style={[styles.lastMessage, { color: textSecondary }]} numberOfLines={1}>
                        {channel.lastMessage}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.messageTime, { color: textSecondary }]}>
                      {getRelativeTime(channel.lastMessageAt)}
                    </ThemedText>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </Animated.View>

          {/* ==================== WIDGETS EXISTANTS ==================== */}
          {scout?.unitId && (
            <>
              <WeatherWidget location="Belgique" delay={500} />
              <ActivityWidget unitId={scout.unitId} delay={600} />
            </>
          )}
        </View>
      </ScrollView>

      {/* ==================== MODAL NOUVEAUTÉS ==================== */}
      <Modal
        visible={showNewsModal}
        transparent
        animationType="slide"
        onRequestClose={closeNewsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: cardBorderColor }]}>
              <View style={styles.modalTitleRow}>
                <ThemedText style={[styles.modalTitle, { color: textColor }]}>✨ Nouveautés</ThemedText>
                <TouchableOpacity
                  onPress={closeNewsModal}
                  style={[styles.modalCloseButton, { backgroundColor: cardBorderColor }]}
                >
                  <Ionicons name="close" size={24} color={textSecondary} />
                </TouchableOpacity>
              </View>
              <ThemedText style={[styles.modalSubtitle, { color: textSecondary }]}>
                {totalNewItems > 0
                  ? `${totalNewItems} nouvelle${totalNewItems > 1 ? 's' : ''} depuis ta dernière visite`
                  : 'Aucune nouvelle depuis ta dernière visite'}
              </ThemedText>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Nouveaux défis */}
              {newChallenges.length > 0 && (
                <View style={styles.newsSection}>
                  <ThemedText style={[styles.newsSectionTitle, { color: textColor }]}>🎯 Nouveaux défis</ThemedText>
                  {newChallenges.slice(0, 3).map((challenge) => (
                    <TouchableOpacity
                      key={challenge.id}
                      style={[styles.newsItem, { backgroundColor: cardBorderColor }]}
                      onPress={() => {
                        closeNewsModal();
                        router.push(`/(scout)/challenges/${challenge.id}`);
                      }}
                    >
                      <View style={[styles.newsIcon, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
                        <ThemedText style={styles.newsEmoji}>🎯</ThemedText>
                      </View>
                      <View style={styles.newsContent}>
                        <ThemedText style={[styles.newsTitle, { color: textColor }]} numberOfLines={1}>
                          {challenge.title}
                        </ThemedText>
                        <ThemedText style={[styles.newsDescription, { color: textSecondary }]} numberOfLines={1}>
                          {challenge.points} pts • {challenge.difficulty === 'easy' ? 'Facile' : challenge.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                        </ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Nouveaux événements */}
              {newEvents.length > 0 && (
                <View style={styles.newsSection}>
                  <ThemedText style={[styles.newsSectionTitle, { color: textColor }]}>📅 Nouveaux événements</ThemedText>
                  {newEvents.slice(0, 3).map((event) => {
                    const eventDate = new Date(event.startDate);
                    const formattedDate = eventDate.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short'
                    });
                    return (
                      <TouchableOpacity
                        key={event.id}
                        style={[styles.newsItem, { backgroundColor: cardBorderColor }]}
                        onPress={() => {
                          closeNewsModal();
                          router.push('/(scout)/events');
                        }}
                      >
                        <View style={[styles.newsIcon, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                          <ThemedText style={styles.newsEmoji}>📅</ThemedText>
                        </View>
                        <View style={styles.newsContent}>
                          <ThemedText style={[styles.newsTitle, { color: textColor }]} numberOfLines={1}>
                            {event.title}
                          </ThemedText>
                          <ThemedText style={[styles.newsDescription, { color: textSecondary }]} numberOfLines={1}>
                            {formattedDate} • {event.location}
                          </ThemedText>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={textSecondary} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Défis validés */}
              {validatedChallenges.length > 0 && (
                <View style={styles.newsSection}>
                  <ThemedText style={[styles.newsSectionTitle, { color: textColor }]}>🏆 Défis validés</ThemedText>
                  {validatedChallenges.slice(0, 3).map((validated) => (
                    <TouchableOpacity
                      key={validated.id}
                      style={[styles.newsItem, { backgroundColor: cardBorderColor }]}
                      onPress={() => {
                        closeNewsModal();
                        router.push(`/(scout)/challenges/${validated.challengeId}`);
                      }}
                    >
                      <View style={[styles.newsIcon, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                        <ThemedText style={styles.newsEmoji}>✅</ThemedText>
                      </View>
                      <View style={styles.newsContent}>
                        <ThemedText style={[styles.newsTitle, { color: textColor }]} numberOfLines={1}>
                          {validated.title}
                        </ThemedText>
                        <ThemedText style={[styles.newsDescription, { color: textSecondary }]} numberOfLines={1}>
                          +{validated.points} pts gagnés !
                        </ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Nouveaux membres */}
              {newMembers.length > 0 && (
                <View style={styles.newsSection}>
                  <ThemedText style={[styles.newsSectionTitle, { color: textColor }]}>👋 Nouveaux membres</ThemedText>
                  {newMembers.slice(0, 3).map((member) => (
                    <View
                      key={member.id}
                      style={[styles.newsItem, { backgroundColor: cardBorderColor }]}
                    >
                      <View style={[styles.newsIcon, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                        <ThemedText style={styles.newsEmoji}>🎉</ThemedText>
                      </View>
                      <View style={styles.newsContent}>
                        <ThemedText style={[styles.newsTitle, { color: textColor }]} numberOfLines={1}>
                          {member.firstName} {member.lastName}
                        </ThemedText>
                        <ThemedText style={[styles.newsDescription, { color: textSecondary }]} numberOfLines={1}>
                          A rejoint WeCamp !
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Message si pas de nouveautés */}
              {newChallenges.length === 0 && newEvents.length === 0 && newMembers.length === 0 && validatedChallenges.length === 0 && (
                <View style={styles.emptyNewsState}>
                  <ThemedText style={styles.emptyNewsEmoji}>🌲</ThemedText>
                  <ThemedText style={[styles.emptyNewsText, { color: textColor }]}>
                    Pas de nouveautés pour le moment
                  </ThemedText>
                  <ThemedText style={[styles.emptyNewsSubtext, { color: textSecondary }]}>
                    Reviens bientôt pour découvrir les prochaines activités !
                  </ThemedText>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <TouchableOpacity
              style={styles.modalFooterButton}
              onPress={closeNewsModal}
            >
              <ThemedText style={styles.modalFooterButtonText}>Fermer</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // ==================== HEADER ====================
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorativeCircle1: {
    width: 120,
    height: 120,
    top: -30,
    right: -30,
  },
  decorativeCircle2: {
    width: 100,
    height: 100,
    bottom: 20,
    left: -40,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  headerInfo: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  headerTotem: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  sectionBadgeLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  sectionBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BrandColors.accent[500],
    borderWidth: 2,
    borderColor: BrandColors.primary[500],
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  statCardAccent: {
    backgroundColor: BrandColors.accent[500],
    shadowColor: BrandColors.accent[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardTransparent: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },

  // ==================== CONTENT ====================
  content: {
    padding: 24,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: NeutralColors.gray[900],
  },
  seeAllButtonOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BrandColors.accent[500],
  },
  seeAllButtonGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BrandColors.primary[500],
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.primary[500],
  },

  // ==================== CHALLENGES ====================
  challengesList: {
    gap: 12,
  },
  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    borderWidth: 1,
    borderColor: NeutralColors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  challengeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: `${BrandColors.accent[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeEmoji: {
    fontSize: 26,
  },
  challengeContent: {
    flex: 1,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: NeutralColors.gray[900],
    flex: 1,
  },
  challengeDays: {
    fontSize: 12,
    color: NeutralColors.gray[500],
  },
  challengeDescription: {
    fontSize: 12,
    color: NeutralColors.gray[500],
    lineHeight: 18,
    marginBottom: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: NeutralColors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BrandColors.primary[500],
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.primary[500],
    minWidth: 32,
  },
  challengePoints: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.accent[500],
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  startedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: `${BrandColors.primary[500]}15`,
  },
  startedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.primary[500],
  },

  // ==================== EVENTS ====================
  eventsList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: NeutralColors.gray[200],
  },
  eventDateBadge: {
    width: 56,
    height: 64,
    borderRadius: 14,
    backgroundColor: BrandColors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDay: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  eventMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
  eventContent: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: NeutralColors.gray[900],
    flex: 1,
  },
  countdownBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countdownText: {
    fontSize: 10,
    fontWeight: '700',
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  eventDetailText: {
    fontSize: 12,
    color: NeutralColors.gray[500],
  },

  // ==================== LEADERBOARD ====================
  leaderboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: NeutralColors.gray[200],
  },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  leaderboardEntryHighlight: {
    backgroundColor: `${BrandColors.primary[500]}08`,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  leaderboardEntryBorder: {
    borderBottomWidth: 1,
    borderBottomColor: NeutralColors.gray[100],
  },
  leaderboardMedal: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NeutralColors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardAvatarHighlight: {
    backgroundColor: `${BrandColors.primary[500]}20`,
    borderWidth: 2,
    borderColor: BrandColors.primary[500],
  },
  leaderboardAvatarText: {
    fontSize: 20,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 14,
    fontWeight: '600',
    color: NeutralColors.gray[900],
  },
  leaderboardNameHighlight: {
    fontWeight: '700',
    color: BrandColors.primary[500],
  },
  leaderboardPoints: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.accent[500],
  },

  // ==================== MESSAGES ====================
  messagesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: NeutralColors.gray[200],
    overflow: 'hidden',
  },
  messageEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  messageEntryBorder: {
    borderBottomWidth: 1,
    borderBottomColor: NeutralColors.gray[100],
  },
  messageIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BrandColors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelName: {
    fontSize: 14,
    fontWeight: '600',
    color: NeutralColors.gray[900],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.accent[500],
  },
  lastMessage: {
    fontSize: 13,
    color: NeutralColors.gray[500],
    marginTop: 2,
  },
  messageTime: {
    fontSize: 11,
    color: NeutralColors.gray[400],
  },

  // ==================== EMPTY STATES ====================
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: NeutralColors.gray[200],
  },
  emptyText: {
    fontSize: 14,
    color: NeutralColors.gray[500],
    textAlign: 'center',
  },

  // ==================== MODAL NOUVEAUTÉS ====================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  modalHeader: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: NeutralColors.gray[100],
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: NeutralColors.gray[900],
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NeutralColors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: NeutralColors.gray[500],
    marginTop: 4,
  },
  modalScrollView: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  newsSection: {
    marginBottom: 24,
  },
  newsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: NeutralColors.gray[800],
    marginBottom: 12,
  },
  newsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: NeutralColors.gray[50],
    borderRadius: 14,
    marginBottom: 8,
  },
  newsIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsEmoji: {
    fontSize: 22,
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: NeutralColors.gray[900],
  },
  newsDescription: {
    fontSize: 13,
    color: NeutralColors.gray[500],
    marginTop: 2,
  },
  emptyNewsState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyNewsEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyNewsText: {
    fontSize: 18,
    fontWeight: '600',
    color: NeutralColors.gray[700],
    marginBottom: 4,
  },
  emptyNewsSubtext: {
    fontSize: 14,
    color: NeutralColors.gray[500],
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalFooterButton: {
    marginHorizontal: 24,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: BrandColors.primary[500],
    alignItems: 'center',
  },
  modalFooterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ==================== ALERTE FICHE SANTÉ ====================
  healthAlertSection: {
    marginBottom: 24,
  },
  healthAlertCard: {
    backgroundColor: '#DC2626',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  healthAlertIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthAlertContent: {
    flex: 1,
  },
  healthAlertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  healthAlertDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  healthAlertArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ==================== ALERTE SIGNATURE PARENT (ORANGE) ====================
  signatureAlertCard: {
    backgroundColor: BrandColors.accent[500],
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: BrandColors.accent[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signatureAlertIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureAlertArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
