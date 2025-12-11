import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { Spacing, Radius } from '@/constants/design-tokens';

export type EventTypeFilter = 'all' | 'meeting' | 'camp' | 'activity' | 'training';

interface EventFiltersProps {
  selectedFilter: EventTypeFilter;
  onFilterChange: (filter: EventTypeFilter) => void;
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const FILTERS: { id: EventTypeFilter; label: string; icon: IoniconsName }[] = [
  { id: 'all', label: 'Tous', icon: 'calendar' },
  { id: 'meeting', label: 'Réunions', icon: 'people' },
  { id: 'camp', label: 'Camps', icon: 'bonfire' },
  { id: 'activity', label: 'Sorties', icon: 'compass' },
  { id: 'training', label: 'Formations', icon: 'school' },
];

export function EventFilters({ selectedFilter, onFilterChange }: EventFiltersProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

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
                { backgroundColor: cardColor, borderColor: cardBorder },
                isSelected && styles.filterButtonSelected,
              ]}
              onPress={() => onFilterChange(filter.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={filter.icon}
                size={18}
                color={isSelected ? '#FFFFFF' : textSecondary}
              />
              <Text
                style={[
                  styles.filterLabel,
                  { color: textColor },
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
    marginBottom: Spacing.lg,
  },
  scrollContent: {
    gap: Spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  filterButtonSelected: {
    backgroundColor: BrandColors.primary[500],
    borderColor: BrandColors.primary[500],
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  filterLabelSelected: {
    color: '#FFFFFF',
  },
});
