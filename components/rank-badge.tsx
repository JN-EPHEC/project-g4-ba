import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from './themed-text';
import { getRankByXP } from '@/constants/ranks';

interface RankBadgeProps {
  xp: number;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
}

/**
 * Badge de rank pour afficher dans les interactions communautaires (style Skool)
 */
export function RankBadge({ xp, size = 'medium', showName = false }: RankBadgeProps) {
  const rank = getRankByXP(xp);

  const iconSize = size === 'small' ? 16 : size === 'medium' ? 24 : 32;
  const paddingValue = size === 'small' ? 6 : size === 'medium' ? 8 : 10;
  const fontSize = size === 'small' ? 10 : size === 'medium' ? 12 : 14;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: rank.color + '20',
          borderColor: rank.color,
          padding: paddingValue,
        }
      ]}
    >
      <Ionicons name={rank.icon as any} size={iconSize} color={rank.color} />
      {showName && (
        <ThemedText
          style={[
            styles.rankName,
            {
              color: rank.color,
              fontSize,
            }
          ]}
        >
          {rank.name}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  rankName: {
    fontWeight: '700',
  },
});
