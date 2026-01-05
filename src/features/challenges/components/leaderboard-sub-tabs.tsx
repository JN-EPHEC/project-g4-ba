import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

export type LeaderboardTab = 'individual' | 'sections';

interface LeaderboardSubTabsProps {
  activeTab: LeaderboardTab;
  onTabChange: (tab: LeaderboardTab) => void;
}

const TABS: { key: LeaderboardTab; label: string; icon: string }[] = [
  { key: 'individual', label: 'Individuel', icon: '👤' },
  { key: 'sections', label: 'Sections', icon: '🏕️' },
];

export function LeaderboardSubTabs({ activeTab, onTabChange }: LeaderboardSubTabsProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <View style={[styles.container, { backgroundColor: cardBorderColor }]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              isActive && styles.activeTab,
              isActive && { backgroundColor: cardColor },
            ]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.tabIcon}>{tab.icon}</ThemedText>
            <ThemedText
              style={[
                styles.tabLabel,
                { color: isActive ? BrandColors.primary[700] : textSecondary },
                isActive && { fontWeight: '700' },
              ]}
            >
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 9,
    gap: 6,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
