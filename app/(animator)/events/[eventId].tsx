import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  ImageBackground,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { EventService } from '@/services/event-service';
import { UserService } from '@/services/user-service';
import { UnitService } from '@/services/unit-service';
import { useEventAttendance } from '@/src/features/events/hooks/use-event-attendance';
import { ParticipantsModal, ParticipantInfo } from '@/src/features/events/components/participants-modal';
import { Event, EventType } from '@/types/event';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { Spacing, Radius } from '@/constants/design-tokens';

const EVENT_TYPE_CONFIG = {
  [EventType.MEETING]: {
    label: 'Réunion',
    color: BrandColors.primary[500],
    bgColor: `${BrandColors.primary[500]}20`,
    icon: '📋',
    description: 'Réunion de groupe',
  },
  [EventType.CAMP]: {
    label: 'Camp',
    color: BrandColors.primary[600],
    bgColor: `${BrandColors.primary[600]}20`,
    icon: '⛺',
    description: 'Aventure en plein air',
  },
  [EventType.ACTIVITY]: {
    label: 'Activité',
    color: BrandColors.accent[500],
    bgColor: `${BrandColors.accent[500]}20`,
    icon: '🎯',
    description: 'Activité spéciale',
  },
  [EventType.TRAINING]: {
    label: 'Formation',
    color: BrandColors.secondary[500],
    bgColor: `${BrandColors.secondary[500]}20`,
    icon: '📚',
    description: 'Session de formation',
  },
  [EventType.OTHER]: {
    label: 'Autre',
    color: NeutralColors.gray[500],
    bgColor: `${NeutralColors.gray[500]}20`,
    icon: '📌',
    description: 'Événement',
  },
};

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [unitName, setUnitName] = useState<string>('');
  const [creatorName, setCreatorName] = useState<string>('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const loadEvent = useCallback(async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      const eventData = await EventService.getEventById(eventId);
      if (eventData) {
        setEvent(eventData);

        // Charger le nom de l'unité
        if (eventData.unitId) {
          const unit = await UnitService.getUnitById(eventData.unitId);
          if (unit) setUnitName(unit.name);
        }

        // Charger le nom du créateur
        if (eventData.createdBy) {
          const creator = await UserService.getUserById(eventData.createdBy);
          if (creator) setCreatorName(`${creator.firstName} ${creator.lastName}`);
        }
      }
    } catch (error) {
      console.error('Erreur chargement événement:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useFocusEffect(
    useCallback(() => {
      loadEvent();
    }, [loadEvent])
  );

  // Utiliser le hook d'attendance
  const { isRegistered, participantCount, attendances, toggleAttendance } = useEventAttendance(eventId || '');

  const handleViewParticipants = async () => {
    setShowParticipants(true);
    setLoadingParticipants(true);

    try {
      const participantPromises = attendances.map(async (attendance) => {
        const userData = await UserService.getUserById(attendance.scoutId);
        if (userData) {
          return {
            id: userData.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
          };
        }
        return null;
      });

      const results = await Promise.all(participantPromises);
      setParticipants(results.filter((p): p is ParticipantInfo => p !== null));
    } catch (error) {
      console.error('Erreur lors du chargement des participants:', error);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleDelete = () => {
    if (!event) return;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
        deleteEvent();
      }
    } else {
      Alert.alert(
        'Supprimer l\'événement',
        'Êtes-vous sûr de vouloir supprimer cet événement ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: deleteEvent },
        ]
      );
    }
  };

  const deleteEvent = async () => {
    if (!event) return;
    try {
      await EventService.deleteEvent(event.id);
      router.back();
    } catch (error) {
      console.error('Erreur suppression:', error);
      Alert.alert('Erreur', 'Impossible de supprimer l\'événement');
    }
  };

  const handleShare = async () => {
    if (!event) return;

    try {
      await Share.share({
        title: event.title,
        message: `${event.title}\n\n📅 ${formatFullDate(event.startDate)}\n📍 ${event.location}\n\nRejoins-nous pour cet événement !`,
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const formatFullDate = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    const dayName = DAYS_FR[d.getDay()];
    const day = d.getDate();
    const month = MONTHS_FR[d.getMonth()];
    const year = d.getFullYear();
    return `${dayName} ${day} ${month} ${year}`;
  };

  const formatTime = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (start: Date, end: Date) => {
    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
    return `${diffHours}h`;
  };

  const getTimeLabel = (eventDate: Date): string | null => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const d = eventDate instanceof Date ? eventDate : new Date(eventDate);
    const eventDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (eventDay.getTime() === today.getTime()) {
      return "AUJOURD'HUI";
    } else if (eventDay.getTime() === tomorrow.getTime()) {
      return 'DEMAIN';
    }
    return null;
  };

  // Vérifier si l'animateur peut modifier cet événement
  const canEdit = event && user && event.unitId === (user as any).unitId;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Événement</ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={textSecondary} />
          <ThemedText style={styles.emptyStateText}>Événement introuvable</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG[EventType.OTHER];
  const timeLabel = getTimeLabel(event.startDate);
  const isFull = event.maxParticipants ? participantCount >= event.maxParticipants : false;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        {event.imageUrl ? (
          <ImageBackground
            source={{ uri: event.imageUrl }}
            style={styles.heroImage}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
              locations={[0, 0.3, 1]}
              style={styles.heroGradient}
            >
              {/* Header buttons */}
              <SafeAreaView edges={['top']}>
                <View style={styles.heroHeader}>
                  <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.heroButton}
                  >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <View style={styles.heroHeaderRight}>
                    <TouchableOpacity
                      onPress={handleShare}
                      style={styles.heroButton}
                    >
                      <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    {canEdit && (
                      <>
                        <TouchableOpacity
                          onPress={() => router.push(`/(animator)/events/${eventId}/edit`)}
                          style={[styles.heroButton, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
                        >
                          <Ionicons name="create-outline" size={24} color={BrandColors.primary[600]} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleDelete}
                          style={[styles.heroButton, { backgroundColor: 'rgba(255,59,48,0.9)' }]}
                        >
                          <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </SafeAreaView>

              {/* Time label badge */}
              {timeLabel && (
                <View style={styles.timeLabelContainer}>
                  <View style={styles.timeLabelBadge}>
                    <Text style={styles.timeLabelText}>{timeLabel}</Text>
                  </View>
                </View>
              )}

              {/* Hero content */}
              <View style={styles.heroContent}>
                <View style={[styles.typeBadge, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
                  <Text style={styles.typeIcon}>{config.icon}</Text>
                  <Text style={[styles.typeLabel, { color: config.color }]}>{config.label}</Text>
                </View>
                <Text style={styles.heroTitle}>{event.title}</Text>
                {unitName && (
                  <View style={styles.unitBadgeHero}>
                    <Text style={styles.unitIcon}>🏕️</Text>
                    <Text style={styles.unitText}>{unitName}</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </ImageBackground>
        ) : (
          <SafeAreaView edges={['top']} style={[styles.heroNoImage, { backgroundColor: config.color }]}>
            <View style={styles.heroHeader}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.heroButton}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.heroHeaderRight}>
                <TouchableOpacity
                  onPress={handleShare}
                  style={styles.heroButton}
                >
                  <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                {canEdit && (
                  <>
                    <TouchableOpacity
                      onPress={() => router.push(`/(animator)/events/${eventId}/edit`)}
                      style={[styles.heroButton, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
                    >
                      <Ionicons name="create-outline" size={24} color={BrandColors.primary[600]} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleDelete}
                      style={[styles.heroButton, { backgroundColor: 'rgba(255,59,48,0.9)' }]}
                    >
                      <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
            <View style={styles.heroContentNoImage}>
              <Text style={styles.heroIconLarge}>{config.icon}</Text>
              {timeLabel && (
                <View style={[styles.timeLabelBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.timeLabelText}>{timeLabel}</Text>
                </View>
              )}
              <Text style={styles.heroTitle}>{event.title}</Text>
              {unitName && (
                <View style={styles.unitBadgeHero}>
                  <Text style={styles.unitIcon}>🏕️</Text>
                  <Text style={styles.unitText}>{unitName}</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Date & Time Card */}
          <View style={[styles.infoCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            <View style={styles.infoCardHeader}>
              <View style={[styles.infoIconContainer, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
                <Ionicons name="calendar" size={24} color={BrandColors.accent[500]} />
              </View>
              <View style={styles.infoCardContent}>
                <ThemedText type="defaultSemiBold" style={styles.infoCardTitle}>
                  Date et heure
                </ThemedText>
                <ThemedText style={[styles.infoCardText, { color: textSecondary }]}>
                  {formatFullDate(event.startDate)}
                </ThemedText>
              </View>
            </View>
            <View style={styles.timeRow}>
              <View style={styles.timeItem}>
                <ThemedText style={[styles.timeLabel, { color: textSecondary }]}>Début</ThemedText>
                <ThemedText type="defaultSemiBold">{formatTime(event.startDate)}</ThemedText>
              </View>
              <View style={[styles.timeDivider, { backgroundColor: cardBorder }]} />
              <View style={styles.timeItem}>
                <ThemedText style={[styles.timeLabel, { color: textSecondary }]}>Fin</ThemedText>
                <ThemedText type="defaultSemiBold">{formatTime(event.endDate)}</ThemedText>
              </View>
              <View style={[styles.timeDivider, { backgroundColor: cardBorder }]} />
              <View style={styles.timeItem}>
                <ThemedText style={[styles.timeLabel, { color: textSecondary }]}>Durée</ThemedText>
                <ThemedText type="defaultSemiBold">{formatDuration(event.startDate, event.endDate)}</ThemedText>
              </View>
            </View>
          </View>

          {/* Location Card */}
          <View style={[styles.infoCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            <View style={styles.infoCardHeader}>
              <View style={[styles.infoIconContainer, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                <Ionicons name="location" size={24} color={BrandColors.primary[500]} />
              </View>
              <View style={styles.infoCardContent}>
                <ThemedText type="defaultSemiBold" style={styles.infoCardTitle}>
                  Lieu
                </ThemedText>
                <ThemedText style={[styles.infoCardText, { color: textSecondary }]}>
                  {event.location}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Participants Card - Clickable for animators */}
          <TouchableOpacity
            style={[styles.infoCard, { backgroundColor: cardColor, borderColor: cardBorder }]}
            onPress={handleViewParticipants}
            activeOpacity={0.7}
          >
            <View style={styles.infoCardHeader}>
              <View style={[styles.infoIconContainer, { backgroundColor: `${BrandColors.secondary[500]}15` }]}>
                <Ionicons name="people" size={24} color={BrandColors.secondary[500]} />
              </View>
              <View style={styles.infoCardContent}>
                <ThemedText type="defaultSemiBold" style={styles.infoCardTitle}>
                  Participants
                </ThemedText>
                <ThemedText style={[styles.infoCardText, { color: textSecondary }]}>
                  {participantCount}{event.maxParticipants ? ` / ${event.maxParticipants}` : ''} inscrit{participantCount > 1 ? 's' : ''}
                </ThemedText>
              </View>
              <View style={styles.viewParticipantsHint}>
                <ThemedText style={[styles.viewParticipantsText, { color: BrandColors.primary[500] }]}>
                  Voir la liste
                </ThemedText>
                <Ionicons name="chevron-forward" size={18} color={BrandColors.primary[500]} />
              </View>
            </View>
            {/* Progress bar for participants */}
            {event.maxParticipants && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: `${BrandColors.secondary[500]}20` }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: isFull ? '#FF3B30' : BrandColors.secondary[500],
                        width: `${Math.min((participantCount / event.maxParticipants) * 100, 100)}%`,
                      },
                    ]}
                  />
                </View>
                {isFull && (
                  <View style={styles.fullBadgeInline}>
                    <Text style={styles.fullBadgeText}>COMPLET</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>

          {/* Description Card */}
          {event.description && (
            <View style={[styles.infoCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
              <View style={styles.infoCardHeader}>
                <View style={[styles.infoIconContainer, { backgroundColor: `${NeutralColors.gray[500]}15` }]}>
                  <Ionicons name="document-text" size={24} color={NeutralColors.gray[500]} />
                </View>
                <View style={styles.infoCardContent}>
                  <ThemedText type="defaultSemiBold" style={styles.infoCardTitle}>
                    Description
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.descriptionText, { color: textSecondary }]}>
                {event.description}
              </ThemedText>
            </View>
          )}

          {/* Organizer info */}
          {creatorName && (
            <View style={[styles.organizerCard, { backgroundColor: `${BrandColors.primary[500]}10` }]}>
              <Ionicons name="person-circle-outline" size={20} color={BrandColors.primary[500]} />
              <ThemedText style={[styles.organizerText, { color: BrandColors.primary[600] }]}>
                Organisé par {creatorName}
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: cardColor, borderTopColor: cardBorder }]}>
        <View style={styles.bottomBarContent}>
          <View style={styles.bottomBarInfo}>
            <ThemedText type="defaultSemiBold" style={styles.bottomBarTitle}>
              {participantCount} participant{participantCount > 1 ? 's' : ''}
            </ThemedText>
            <ThemedText style={[styles.bottomBarSubtitle, { color: textSecondary }]}>
              {formatFullDate(event.startDate)} à {formatTime(event.startDate)}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.attendanceButton, { backgroundColor: BrandColors.primary[500] }]}
            onPress={handleViewParticipants}
            activeOpacity={0.7}
          >
            <Ionicons name="people" size={20} color="#FFFFFF" />
            <Text style={styles.attendanceButtonText}>Voir les inscrits</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Participants Modal */}
      <ParticipantsModal
        visible={showParticipants}
        onClose={() => setShowParticipants(false)}
        eventTitle={event.title}
        participants={participants}
        loading={loadingParticipants}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Hero with image
  heroImage: {
    height: 320,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  heroHeaderRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  heroButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeLabelContainer: {
    alignItems: 'center',
  },
  timeLabelBadge: {
    backgroundColor: BrandColors.accent[500],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  timeLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    gap: 6,
  },
  typeIcon: {
    fontSize: 16,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 34,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  unitBadgeHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unitIcon: {
    fontSize: 16,
  },
  unitText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Hero without image
  heroNoImage: {
    paddingBottom: Spacing.xl,
  },
  heroContentNoImage: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  heroIconLarge: {
    fontSize: 64,
    marginBottom: Spacing.sm,
  },

  // Content
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
    marginTop: -Spacing.lg,
  },

  // Info Cards
  infoCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  infoCardText: {
    fontSize: 14,
  },

  // View participants hint
  viewParticipantsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewParticipantsText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Time row
  timeRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  timeDivider: {
    width: 1,
    height: '100%',
  },

  // Full badge
  fullBadgeInline: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: '#FF3B3020',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  fullBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF3B30',
    letterSpacing: 0.5,
  },

  // Progress bar
  progressContainer: {
    marginTop: Spacing.md,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Description
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: Spacing.md,
  },

  // Organizer
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  organizerText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomBarInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  bottomBarTitle: {
    fontSize: 16,
  },
  bottomBarSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
  },
  attendanceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
