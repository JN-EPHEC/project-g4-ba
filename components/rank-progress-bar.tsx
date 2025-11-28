import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from './themed-text';
import { getRankByXP, getNextRank, getProgressToNextRank } from '@/constants/ranks';

interface RankProgressBarProps {
  xp: number;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

export function RankProgressBar({ xp, size = 'medium', showDetails = true }: RankProgressBarProps) {
  const currentRank = getRankByXP(xp);
  const nextRank = getNextRank(currentRank);
  const progress = getProgressToNextRank(xp);

  const iconSize = size === 'small' ? 20 : size === 'medium' ? 24 : 32;
  const barHeight = size === 'small' ? 6 : size === 'medium' ? 8 : 12;

  return (
    <View style={styles.container}>
      {/* Rank actuel avec icône */}
      <View style={styles.currentRank}>
        <View style={[styles.iconContainer, { backgroundColor: currentRank.color + '20' }]}>
          <Ionicons name={currentRank.icon as any} size={iconSize} color={currentRank.color} />
        </View>
        <View style={styles.rankInfo}>
          <ThemedText style={[styles.rankName, { color: currentRank.color }]}>
            {currentRank.name}
          </ThemedText>
          <ThemedText style={styles.rankDescription}>
            {currentRank.description}
          </ThemedText>
        </View>
      </View>

      {/* Barre de progression */}
      <View style={[styles.progressBarContainer, { height: barHeight }]}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${progress.percentage}%`,
              backgroundColor: currentRank.color,
              height: barHeight
            }
          ]}
        />
      </View>

      {/* Détails XP */}
      {showDetails && (
        <View style={styles.details}>
          <ThemedText style={styles.xpText}>
            {progress.current} / {progress.required} XP
          </ThemedText>
          {nextRank ? (
            <ThemedText style={styles.nextRank}>
              Prochain : {nextRank.name}
            </ThemedText>
          ) : (
            <ThemedText style={[styles.nextRank, { color: currentRank.color }]}>
              ✨ Rang maximum !
            </ThemedText>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  currentRank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontSize: 18,
    fontWeight: '700',
  },
  rankDescription: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  progressBarContainer: {
    width: '100%',
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: 999,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
  },
  nextRank: {
    fontSize: 12,
    opacity: 0.7,
  },
});
