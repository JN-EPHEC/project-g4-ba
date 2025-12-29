import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

export type MainTab = 'challenges' | 'achievements' | 'leaderboard' | 'badges';

interface ChallengesMainTabsProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

const TABS: { key: MainTab; label: string }[] = [
  { key: 'challenges', label: 'Défis' },
  { key: 'achievements', label: 'Réussites' },
  { key: 'leaderboard', label: 'Classement' },
  { key: 'badges', label: 'Badges' },
];

export function ChallengesMainTabs({ activeTab, onTabChange }: ChallengesMainTabsProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <View style={[styles.container, { backgroundColor: cardBorderColor, borderColor: cardBorderColor }]}>
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
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
