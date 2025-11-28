import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, ActivityIndicator } from 'react-native';
import { EventCard } from '@/src/features/events/components/event-card';
import { EventFilters, EventTypeFilter } from '@/src/features/events/components/event-filters';
import { EventsHeader } from '@/src/features/events/components/events-header';
import { useEvents } from '@/src/features/events/hooks/use-events';

export default function AnimatorEventsScreen() {
  const { width } = useWindowDimensions();
  const { events, loading, error } = useEvents();
  const [selectedFilter, setSelectedFilter] = useState<EventTypeFilter>('all');

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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des événements...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <EventsHeader totalEvents={filteredEvents.length} />

        {/* Filters */}
        <EventFilters
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>Aucun événement</Text>
            <Text style={styles.emptyText}>
              {selectedFilter === 'all'
                ? 'Créez un nouvel événement depuis l\'onglet Gestion !'
                : 'Aucun événement de ce type'}
            </Text>
          </View>
        ) : (
          <View style={[styles.eventsGrid, { gap: 20 }]}>
            {filteredEvents.map((event) => (
              <View
                key={event.id}
                style={[
                  styles.eventItem,
                  {
                    width: width >= 900
                      ? `${100 / numColumns - 2}%`
                      : '100%',
                    minWidth: width >= 900 ? 280 : undefined,
                  },
                ]}
              >
                <EventCard event={event} onPress={() => {}} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#666666',
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
    color: '#1A1A1A',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
});
