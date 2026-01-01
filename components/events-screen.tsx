import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { EventCard } from '@/src/features/events/components/event-card';
import { EventFilters, EventTypeFilter } from '@/src/features/events/components/event-filters';
import { EventForm, EventFormData } from '@/src/features/events/components/event-form';
import { ParticipantsModal, ParticipantInfo } from '@/src/features/events/components/participants-modal';
import { useEvents } from '@/src/features/events/hooks/use-events';
import { useEventAttendance } from '@/src/features/events/hooks/use-event-attendance';
import { EventService } from '@/services/event-service';
import { UserService } from '@/services/user-service';
import { Event, UserRole } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { Spacing, Radius } from '@/constants/design-tokens';

interface EventsScreenProps {
  userRole: UserRole;
  canCreate?: boolean;
  canDelete?: boolean;
}

// Jours de la semaine en français
const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function getWeekDays(selectedDate: Date): Date[] {
  const days: Date[] = [];
  const today = new Date(selectedDate);

  // Trouver le lundi de la semaine
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);

  // Générer les 7 jours de la semaine
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }

  return days;
}

function isSameDay(date1: Date | null, date2: Date | null): boolean {
  if (!date1 || !date2) return false;
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

export function EventsScreen({ userRole, canCreate = false, canDelete = false }: EventsScreenProps) {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { events, loading, error, refetch } = useEvents();
  const [selectedFilter, setSelectedFilter] = useState<EventTypeFilter>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Theme colors
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  // Week days for the calendar (toujours basé sur aujourd'hui)
  const today = new Date();
  const weekDays = useMemo(() => getWeekDays(today), []);

  // Calculer le nombre de colonnes en fonction de la largeur
  const getColumns = () => {
    if (width >= 1200) return 3;
    if (width >= 900) return 2;
    return 1;
  };

  const numColumns = getColumns();

  // Filtrer les événements
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filtrer par date sélectionnée (si une date est sélectionnée)
    if (selectedDate) {
      filtered = filtered.filter((event) => {
        const eventDate = event.startDate instanceof Date
          ? event.startDate
          : (event.startDate as any)?.toDate?.() || new Date(event.startDate);
        return isSameDay(eventDate, selectedDate);
      });
    }

    // Filtrer par type si ce n'est pas 'all'
    if (selectedFilter !== 'all') {
      filtered = filtered.filter((event) => {
        const eventType = event.type.toLowerCase();
        return eventType === selectedFilter;
      });
    }

    return filtered;
  }, [events, selectedFilter, selectedDate]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleCreateEvent = async (eventData: EventFormData) => {
    if (!user) return;

    const unitId = (user as any).unitId;
    if (!unitId) {
      throw new Error('Unité non trouvée');
    }

    await EventService.createEvent(
      eventData.title,
      eventData.description,
      eventData.type,
      eventData.startDate,
      eventData.endDate,
      eventData.location,
      user.id,
      unitId,
      false,
      eventData.maxParticipants
    );

    await refetch();
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await EventService.deleteEvent(eventId);
      console.log('[Events] Événement supprimé:', eventId);
      await refetch();
    } catch (err) {
      console.error('[Events] Erreur lors de la suppression:', err);
      alert('Erreur lors de la suppression de l\'événement');
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary[500]} />
          <ThemedText style={styles.loadingText}>Chargement des événements...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={BrandColors.primary[500]}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <ThemedText style={styles.title}>Événements</ThemedText>
            <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
              {events.length} événement{events.length !== 1 ? 's' : ''} à venir
            </ThemedText>
          </View>
          {canCreate && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateForm(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Créer</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Week Calendar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.weekCalendar}
          contentContainerStyle={styles.weekCalendarContent}
        >
          {weekDays.map((day, index) => {
            const isToday = isSameDay(day, today);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const dayName = DAYS_SHORT[day.getDay()];

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCard,
                  { backgroundColor: cardColor, borderColor: cardBorder },
                  isSelected && styles.dayCardSelected,
                  isToday && !isSelected && styles.dayCardToday,
                ]}
                onPress={() => {
                  // Si on clique sur le jour déjà sélectionné, on désélectionne
                  if (isSelected) {
                    setSelectedDate(null);
                  } else {
                    setSelectedDate(day);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayName,
                  { color: textSecondary },
                  isSelected && styles.dayNameSelected,
                ]}>
                  {dayName}
                </Text>
                <Text style={[
                  styles.dayNumber,
                  { color: textColor },
                  isSelected && styles.dayNumberSelected,
                ]}>
                  {day.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Filters */}
        <EventFilters
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />

        {/* Events Grid or Empty State */}
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            {/* Calendar illustration */}
            <View style={[styles.calendarIllustration, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
              <Text style={[styles.calendarMonth, { color: BrandColors.primary[500] }]}>
                {MONTHS_FR[(selectedDate || today).getMonth()].toUpperCase()}
              </Text>
              <Text style={[styles.calendarDay, { color: textColor }]}>{(selectedDate || today).getDate()}</Text>
              <Text style={[styles.calendarWeekday, { color: textSecondary }]}>
                {DAYS_FR[(selectedDate || today).getDay()]}
              </Text>
            </View>

            <ThemedText style={styles.emptyTitle}>Aucun événement</ThemedText>
            <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
              {selectedDate
                ? 'Aucun événement prévu ce jour'
                : selectedFilter === 'all'
                  ? canCreate
                    ? 'Créez votre premier événement pour commencer à organiser vos activités'
                    : 'Aucun événement à venir pour le moment'
                  : 'Aucun événement de ce type'}
            </ThemedText>
            {canCreate && selectedFilter === 'all' && (
              <TouchableOpacity
                style={styles.emptyCreateButton}
                onPress={() => setShowCreateForm(true)}
              >
                <Ionicons name="add" size={24} color={BrandColors.primary[600]} />
                <Text style={styles.emptyCreateButtonText}>Créer un événement</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={[styles.eventsGrid, { gap: 20 }]}>
            {filteredEvents.map((event) => (
              <EventCardWithAttendance
                key={event.id}
                event={event}
                numColumns={numColumns}
                width={width}
                canDelete={canDelete}
                onDelete={() => handleDeleteEvent(event.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Event Modal */}
      <EventForm
        visible={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateEvent}
      />
    </ThemedView>
  );
}

// Composant wrapper pour gérer l'attendance de chaque événement
function EventCardWithAttendance({
  event,
  numColumns,
  width,
  canDelete,
  onDelete,
}: {
  event: Event;
  numColumns: number;
  width: number;
  canDelete?: boolean;
  onDelete?: () => void;
}) {
  const { isRegistered, participantCount, attendances, toggleAttendance } = useEventAttendance(event.id);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const handleViewParticipants = async () => {
    setShowParticipants(true);
    setLoadingParticipants(true);

    try {
      const participantPromises = attendances.map(async (attendance) => {
        const user = await UserService.getUserById(attendance.scoutId);
        if (user) {
          return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
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

  return (
    <View
      style={[
        styles.eventItem,
        {
          width: width >= 900 ? `${100 / numColumns - 2}%` : '100%',
          minWidth: width >= 900 ? 400 : undefined,
        },
      ]}
    >
      <EventCard
        id={event.id}
        title={event.title}
        type={event.type as 'meeting' | 'camp' | 'activity' | 'training'}
        date={event.startDate}
        location={event.location}
        participantCount={participantCount}
        maxParticipants={event.maxParticipants}
        isRegistered={isRegistered}
        onPress={() => {
          console.log(`Event ${event.title} clicked`);
        }}
        onAttendancePress={toggleAttendance}
        canDelete={canDelete}
        onDelete={onDelete}
        onViewParticipants={handleViewParticipants}
      />

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
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    direction: 'ltr',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
    writingDirection: 'ltr',
  },
  subtitle: {
    fontSize: 15,
    letterSpacing: -0.3,
    writingDirection: 'ltr',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.accent[500],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    gap: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  // Week Calendar
  weekCalendar: {
    marginBottom: Spacing.md,
  },
  weekCalendarContent: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  dayCard: {
    width: 60,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  dayCardSelected: {
    backgroundColor: BrandColors.primary[500],
    borderColor: BrandColors.primary[500],
  },
  dayCardToday: {
    borderColor: BrandColors.accent[500],
    borderWidth: 2,
  },
  dayName: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  dayNameSelected: {
    color: '#FFFFFF',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  // Loading and Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#999999',
    letterSpacing: -0.3,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  // Events Grid
  eventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  eventItem: {
    marginBottom: 20,
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  calendarIllustration: {
    width: 140,
    height: 160,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  calendarMonth: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  calendarDay: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  calendarWeekday: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: Spacing.lg,
    lineHeight: 22,
    maxWidth: 280,
  },
  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: `${BrandColors.primary[500]}15`,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: BrandColors.primary[500],
  },
  emptyCreateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.primary[600],
  },
});
