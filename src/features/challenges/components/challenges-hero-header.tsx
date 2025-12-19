import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { LevelService } from '@/services/level-service';
import { ScoutLevelInfo } from '@/types';

// Couleurs Gold de la mockup (fallback)
const GOLD_COLORS = {
  primary: '#F5A623',
  dark: '#D4920A',
  light: '#FFB84D',
};

interface ChallengesHeroHeaderProps {
  totalPoints: number;
  level: string;
  levelIcon?: string;
  levelColor?: string;
  nextLevel: string;
  nextLevelIcon?: string;
  levelProgress: number; // 0-100
  pointsToNextLevel?: number;
  isMaxLevel?: boolean;
  rank: number | null;
  streak: number;
  completedCount: number;
  inProgressCount: number;
  onRankPress?: () => void;
  onLevelPress?: () => void;
}

export function ChallengesHeroHeader({
  totalPoints,
  level,
  levelIcon,
  levelColor,
  nextLevel,
  nextLevelIcon,
  levelProgress,
  pointsToNextLevel,
  isMaxLevel = false,
  rank,
  streak,
  completedCount,
  inProgressCount,
  onRankPress,
  onLevelPress,
}: ChallengesHeroHeaderProps) {
  // Utiliser la couleur du niveau ou fallback sur gold
  const gradientColors: [string, string] = levelColor
    ? [levelColor, adjustColorBrightness(levelColor, -30)]
    : [GOLD_COLORS.primary, GOLD_COLORS.dark];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Decorative circles */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      {/* Top Row: Level + Points | Rank */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.leftSection}
          onPress={onLevelPress}
          activeOpacity={0.7}
        >
          <View style={styles.levelRow}>
            {levelIcon && <ThemedText style={styles.levelIcon}>{levelIcon}</ThemedText>}
            <ThemedText style={styles.levelLabel}>Niveau : {level}</ThemedText>
            <View style={styles.levelArrow}>
              <ThemedText style={styles.arrowText}>›</ThemedText>
            </View>
          </View>
          <View style={styles.pointsRow}>
            <ThemedText style={styles.pointsValue}>{totalPoints}</ThemedText>
            <ThemedText style={styles.pointsLabel}>pts</ThemedText>
          </View>
        </TouchableOpacity>

        {/* Rank Badge */}
        <TouchableOpacity
          style={styles.rankBadge}
          onPress={onRankPress}
          activeOpacity={0.8}
        >
          <View style={styles.trophyCircle}>
            <ThemedText style={styles.trophyEmoji}>🏆</ThemedText>
          </View>
          <ThemedText style={styles.rankValue}>#{rank || '-'}</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Progress Bar to Next Level - dans un conteneur arrondi */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabelRow}>
          {isMaxLevel ? (
            <ThemedText style={styles.progressLabel}>🎉 Niveau maximum atteint !</ThemedText>
          ) : (
            <View style={styles.nextLevelRow}>
              {nextLevelIcon && <ThemedText style={styles.nextLevelIcon}>{nextLevelIcon}</ThemedText>}
              <ThemedText style={styles.progressLabel}>
                Prochain : {nextLevel}
                {pointsToNextLevel !== undefined && ` (${pointsToNextLevel} pts)`}
              </ThemedText>
            </View>
          )}
          <ThemedText style={styles.progressPercent}>{Math.round(levelProgress)}%</ThemedText>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${levelProgress}%` }]} />
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statValueRow}>
            <ThemedText style={styles.statValue}>{streak}</ThemedText>
            <ThemedText style={styles.statEmoji}>🔥</ThemedText>
          </View>
          <ThemedText style={styles.statLabel}>Série</ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>{completedCount}</ThemedText>
          <ThemedText style={styles.statLabel}>Complétés</ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>{inProgressCount}</ThemedText>
          <ThemedText style={styles.statLabel}>En cours</ThemedText>
        </View>
      </View>
    </LinearGradient>
  );
}

// Helper pour ajuster la luminosité d'une couleur
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Helper function to get level info based on points - utilise LevelService
export function getScoutLevelInfo(points: number): {
  level: string;
  levelIcon: string;
  levelColor: string;
  nextLevel: string;
  nextLevelIcon: string;
  progress: number;
  pointsToNextLevel: number;
  isMaxLevel: boolean;
} {
  const info = LevelService.getScoutLevelInfoSync(points);

  return {
    level: info.currentLevel.name,
    levelIcon: info.currentLevel.icon,
    levelColor: info.currentLevel.color,
    nextLevel: info.nextLevel?.name || info.currentLevel.name,
    nextLevelIcon: info.nextLevel?.icon || info.currentLevel.icon,
    progress: info.progress,
    pointsToNextLevel: info.pointsToNextLevel,
    isMaxLevel: info.isMaxLevel,
  };
}

// Keep old function for backwards compatibility
export function getScoutLevel(points: number): string {
  return getScoutLevelInfo(points).level;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 32,
    padding: 24,
    paddingTop: 32,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: '20%',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    position: 'relative',
    zIndex: 1,
  },
  leftSection: {
    flex: 1,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  levelIcon: {
    fontSize: 18,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  levelArrow: {
    marginLeft: 4,
  },
  arrowText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pointsLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  rankBadge: {
    alignItems: 'center',
    gap: 4,
  },
  trophyCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  trophyEmoji: {
    fontSize: 28,
  },
  rankValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  nextLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextLevelIcon: {
    fontSize: 12,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    position: 'relative',
    zIndex: 1,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statEmoji: {
    fontSize: 14,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
