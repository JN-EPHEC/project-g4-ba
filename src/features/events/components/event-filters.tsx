import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export type EventTypeFilter = 'all' | 'meeting' | 'camp' | 'activity' | 'training';

interface EventFiltersProps {
  selectedFilter: EventTypeFilter;
  onFilterChange: (filter: EventTypeFilter) => void;
}

const FILTERS = [
  { id: 'all' as EventTypeFilter, label: 'Tous', icon: '📅' },
  { id: 'meeting' as EventTypeFilter, label: 'Réunions', icon: '📋' },
  { id: 'camp' as EventTypeFilter, label: 'Camps', icon: '⛺' },
  { id: 'activity' as EventTypeFilter, label: 'Activités', icon: '🎯' },
  { id: 'training' as EventTypeFilter, label: 'Formations', icon: '📚' },
];

export function EventFilters({ selectedFilter, onFilterChange }: EventFiltersProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTERS.map((filter) => {
          const isSelected = selectedFilter === filter.id;
          return (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                isSelected && styles.filterButtonSelected,
              ]}
              onPress={() => onFilterChange(filter.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.filterIcon}>{filter.icon}</Text>
              <Text
                style={[
                  styles.filterLabel,
                  isSelected && styles.filterLabelSelected,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    gap: 8,
  },
  filterButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterIcon: {
    fontSize: 16,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  filterLabelSelected: {
    color: '#FFFFFF',
  },
});
