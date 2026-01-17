import React, { useState, useCallback } from 'react';
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
import { ParentScoutService } from '@/services/parent-scout-service';
import { EventAttendanceService } from '@/services/event-attendance-service';
import { useEventAttendance } from '@/src/features/events/hooks/use-event-attendance';
import { Event, EventType } from '@/types/event';
import { Scout, Parent } from '@/types';
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

export default function ParentEventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { user } = useAuth();
  const parent = user as Parent;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [unitName, setUnitName] = useState<string>('');
  const [creatorName, setCreatorName] = useState<string>('');
  const [registeredScouts, setRegisteredScouts] = useState<Scout[]>([]);
  const [linkedScouts, setLinkedScouts] = useState<Scout[]>([]);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const loadEvent = useCallback(async () => {
    if (!eventId || !parent?.id) return;

    try {
      setLoading(true);

      // Charger l'événement
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

        // Charger les scouts liés au parent
        const parentScouts = await ParentScoutService.getScoutsByParent(parent.id);
        setLinkedScouts(parentScouts);

        // Vérifier quels scouts sont inscrits à cet événement
        const attendances = await EventAttendanceService.getAttendanceByEvent(eventId);
        const registeredScoutIds = attendances.map(a => a.scoutId);
        const registered = parentScouts.filter(scout => registeredScoutIds.includes(scout.id));
        setRegisteredScouts(registered);
      }
    } catch (error) {
      console.error('Erreur chargement événement:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId, parent?.id]);

  useFocusEffect(
    useCallback(() => {
      loadEvent();
    }, [loadEvent])
  );

  // Utiliser le hook d'attendance pour les stats
  const { participantCount } = useEventAttendance(eventId || '');

  const handleShare = async () => {
    if (!event) return;

    try {
      await Share.share({
        title: event.title,
        message: `${event.title}\n\n📅 ${formatFullDate(event.startDate)}\n📍 ${event.location}\n\nÉvénement scout`,
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
          {/* Scouts inscrits (mes enfants) */}
          {linkedScouts.length > 0 && (
            <View style={[styles.infoCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
              <View style={styles.infoCardHeader}>
                <View style={[styles.infoIconContainer, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                  <Ionicons name="people" size={24} color={BrandColors.primary[500]} />
                </View>
                <View style={styles.infoCardContent}>
                  <ThemedText type="defaultSemiBold" style={styles.infoCardTitle}>
                    Mes scouts
                  </ThemedText>
                  <ThemedText style={[styles.infoCardText, { color: textSecondary }]}>
                    {registeredScouts.length > 0
                      ? `${registeredScouts.length} inscrit${registeredScouts.length > 1 ? 's' : ''}`
                      : 'Aucun inscrit'}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.scoutsList}>
                {linkedScouts.map((scout) => {
                  const isRegistered = registeredScouts.some(s => s.id === scout.id);
                  return (
                    <View
                      key={scout.id}
                      style={[
                        styles.scoutItem,
                        { backgroundColor: isRegistered ? `${BrandColors.primary[500]}10` : `${NeutralColors.gray[500]}10` }
                      ]}
                    >
                      <View style={styles.scoutItemLeft}>
                        <ThemedText style={styles.scoutName}>
                          {scout.firstName} {scout.lastName}
                        </ThemedText>
                      </View>
                      <View style={[
                        styles.scoutStatus,
                        { backgroundColor: isRegistered ? BrandColors.primary[500] : NeutralColors.gray[400] }
                      ]}>
                        <Ionicons
                          name={isRegistered ? "checkmark" : "close"}
                          size={14}
                          color="#FFFFFF"
                        />
                        <Text style={styles.scoutStatusText}>
                          {isRegistered ? 'Inscrit' : 'Non inscrit'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

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

          {/* Participants Card */}
          <View style={[styles.infoCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
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
              {isFull && (
                <View style={styles.fullBadge}>
                  <Text style={styles.fullBadgeText}>COMPLET</Text>
                </View>
              )}
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
              </View>
            )}
          </View>

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

          {/* Note pour les parents */}
          <View style={[styles.noteCard, { backgroundColor: `${BrandColors.accent[500]}10`, borderColor: `${BrandColors.accent[500]}30` }]}>
            <Ionicons name="information-circle" size={20} color={BrandColors.accent[500]} />
            <ThemedText style={[styles.noteText, { color: BrandColors.accent[600] }]}>
              L'inscription aux événements se fait depuis le compte de votre scout.
            </ThemedText>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
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
    lineHeight: 20,
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
    lineHeight: 20,
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
    lineHeight: 72,
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

  // Scouts list
  scoutsList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  scoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  scoutItemLeft: {
    flex: 1,
  },
  scoutName: {
    fontSize: 15,
    fontWeight: '500',
  },
  scoutStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  scoutStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
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
  fullBadge: {
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

  // Note card
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
