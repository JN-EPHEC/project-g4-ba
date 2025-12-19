import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

export type MainTab = 'challenges' | 'leaderboard' | 'badges';

interface ChallengesMainTabsProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

const TABS: { key: MainTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'challenges', label: 'Défis', icon: 'trophy' },
  { key: 'leaderboard', label: 'Classement', icon: 'podium' },
  { key: 'badges', label: 'Badges', icon: 'ribbon' },
];

export function ChallengesMainTabs({ activeTab, onTabChange }: ChallengesMainTabsProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <View style={[styles.container, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              isActive && styles.activeTab,
              isActive && { backgroundColor: BrandColors.primary[500] },
            ]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={isActive ? '#FFFFFF' : textSecondary}
            />
            <ThemedText
              style={[
                styles.tabLabel,
                { color: isActive ? '#FFFFFF' : textSecondary },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
