import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { ThemedText } from '@/components/themed-text';
import { BrandColors } from '@/constants/theme';

const STATUS_BAR_HEIGHT = Platform.select({
  ios: Constants.statusBarHeight || 44,
  android: Constants.statusBarHeight || 24,
  web: 0,
  default: 0,
});

interface AnimatorHeroHeaderProps {
  activeChallengesCount: number;
  totalScouts: number;
  pendingValidations: number;
  participationRate: number;
  onValidationsPress?: () => void;
}

export function AnimatorHeroHeader({
  activeChallengesCount,
  totalScouts,
  pendingValidations,
  participationRate,
  onValidationsPress,
}: AnimatorHeroHeaderProps) {
  return (
    <LinearGradient
      colors={[BrandColors.primary[500], BrandColors.primary[700]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Decorative circles */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      {/* Title */}
      <View style={styles.titleRow}>
        <ThemedText style={styles.title}>Gestion des défis</ThemedText>
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>Animateur</ThemedText>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <ThemedText style={styles.statEmoji}>🎯</ThemedText>
          <ThemedText style={styles.statValue}>{activeChallengesCount}</ThemedText>
          <ThemedText style={styles.statLabel}>Défis actifs</ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={styles.statEmoji}>👥</ThemedText>
          <ThemedText style={styles.statValue}>{totalScouts}</ThemedText>
          <ThemedText style={styles.statLabel}>Scouts</ThemedText>
        </View>

        <TouchableOpacity
          style={[styles.statCard, pendingValidations > 0 && styles.statCardHighlight]}
          onPress={pendingValidations > 0 ? onValidationsPress : undefined}
          activeOpacity={pendingValidations > 0 ? 0.7 : 1}
          disabled={pendingValidations === 0}
        >
          <ThemedText style={styles.statEmoji}>⏳</ThemedText>
          <ThemedText style={styles.statValue}>{pendingValidations}</ThemedText>
          <ThemedText style={styles.statLabel}>À valider</ThemedText>
        </TouchableOpacity>

        <View style={styles.statCard}>
          <ThemedText style={styles.statEmoji}>📊</ThemedText>
          <ThemedText style={styles.statValue}>{participationRate}%</ThemedText>
          <ThemedText style={styles.statLabel}>Participation</ThemedText>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    padding: 24,
    paddingTop: STATUS_BAR_HEIGHT + 16,
    paddingBottom: 24,
    marginBottom: 16,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    position: 'relative',
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    position: 'relative',
    zIndex: 1,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  statCardHighlight: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
