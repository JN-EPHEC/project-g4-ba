import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

export type ChallengeFilter = 'all' | 'in_progress' | 'completed' | 'new';

interface FilterTabsProps {
  activeFilter: ChallengeFilter;
  onFilterChange: (filter: ChallengeFilter) => void;
  counts?: {
    all: number;
    in_progress: number;
    completed: number;
    new: number;
  };
}

const FILTER_LABELS: Record<ChallengeFilter, string> = {
  all: 'Tous',
  in_progress: 'En cours',
  completed: 'Complétés',
  new: 'Nouveaux',
};

export function ChallengesFilterTabs({ activeFilter, onFilterChange, counts }: FilterTabsProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const filters: ChallengeFilter[] = ['all', 'in_progress', 'completed', 'new'];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter;
          const count = counts?.[filter];

          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.tab,
                { backgroundColor: isActive ? BrandColors.primary[500] : cardColor },
                { borderColor: isActive ? BrandColors.primary[500] : cardBorderColor },
              ]}
              onPress={() => onFilterChange(filter)}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  { color: isActive ? '#FFFFFF' : textSecondary },
                ]}
              >
                {FILTER_LABELS[filter]}
              </ThemedText>
              {count !== undefined && count > 0 && (
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : `${BrandColors.primary[500]}15` },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.countText,
                      { color: isActive ? '#FFFFFF' : BrandColors.primary[500] },
                    ]}
                  >
                    {count}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
