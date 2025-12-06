import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { EventCard } from '@/src/features/events/components/event-card';
import { EventFilters, EventTypeFilter } from '@/src/features/events/components/event-filters';
import { EventsHeader } from '@/src/features/events/components/events-header';
import { EventForm, EventFormData } from '@/src/features/events/components/event-form';
import { ParticipantsModal, ParticipantInfo } from '@/src/features/events/components/participants-modal';
import { useEvents } from '@/src/features/events/hooks/use-events';
import { useEventAttendance } from '@/src/features/events/hooks/use-event-attendance';
import { EventService } from '@/services/event-service';
import { UserService } from '@/services/user-service';
import { Event, UserRole } from '@/types';
import { useAuth } from '@/context/auth-context';

interface EventsScreenProps {
  /** Rôle de l'utilisateur */
  userRole: UserRole;
  /** Si true, l'utilisateur peut créer des événements */
  canCreate?: boolean;
  /** Si true, l'utilisateur peut supprimer des événements */
  canDelete?: boolean;
}

export function EventsScreen({ userRole, canCreate = false, canDelete = false }: EventsScreenProps) {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { events, loading, error, refetch } = useEvents();
  const [selectedFilter, setSelectedFilter] = useState<EventTypeFilter>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculer le nombre de colonnes en fonction de la largeur
  const getColumns = () => {
    if (width >= 1200) return 3;
    if (width >= 900) return 2;
    return 1;
  };

  const numColumns = getColumns();

  // Filtrer les événements
  const filteredEvents = useMemo(() => {
    if (selectedFilter === 'all') return events;

    return events.filter((event) => {
      const eventType = event.type.toLowerCase();
      return eventType === selectedFilter;
    });
  }, [events, selectedFilter]);

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

    // Rafraîchir la liste
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
          <ActivityIndicator size="large" color="#3b82f6" />
          <ThemedText style={styles.loadingText}>Chargement des événements...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorIcon}>⚠️</ThemedText>
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
            tintColor="#3b82f6"
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <EventsHeader totalEvents={filteredEvents.length} />
          {canCreate && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateForm(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <ThemedText style={styles.createButtonText}>Créer</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <EventFilters
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyIcon}>📅</ThemedText>
            <ThemedText style={styles.emptyTitle}>Aucun événement</ThemedText>
            <ThemedText style={styles.emptyText}>
              {selectedFilter === 'all'
                ? canCreate
                  ? 'Créez votre premier événement !'
                  : 'Aucun événement à venir pour le moment'
                : 'Aucun événement de ce type'}
            </ThemedText>
            {canCreate && selectedFilter === 'all' && (
              <TouchableOpacity
                style={styles.emptyCreateButton}
                onPress={() => setShowCreateForm(true)}
              >
                <Ionicons name="add-circle" size={24} color="#3b82f6" />
                <ThemedText style={styles.emptyCreateButtonText}>Créer un événement</ThemedText>
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
      // Récupérer les infos de chaque participant
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
    marginBottom: 8,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
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
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  eventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  eventItem: {
    marginBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#999999',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 20,
  },
  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#3b82f620',
    borderRadius: 12,
  },
  emptyCreateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
  },
});
