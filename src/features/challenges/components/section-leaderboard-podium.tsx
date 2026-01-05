import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { SectionLeaderboardItem } from '../hooks/use-section-leaderboard';

const COLORS = {
  gold: BrandColors.accent[500],
  goldLight: BrandColors.accent[50],
  silver: BrandColors.secondary[400],
  bronze: BrandColors.accent[600],
  primary: BrandColors.primary[500],
  primaryLight: BrandColors.primary[400],
};

interface SectionLeaderboardPodiumProps {
  sections: SectionLeaderboardItem[];
}

export function SectionLeaderboardPodium({ sections }: SectionLeaderboardPodiumProps) {
  const cardColor = useThemeColor({}, 'card');
  const mist = useThemeColor({}, 'cardBorder');

  if (sections.length < 3) return null;

  const [first, second, third] = sections;

  const renderSectionLogo = (section: SectionLeaderboardItem, size: 'large' | 'small') => {
    const isLarge = size === 'large';
    const logoSize = isLarge ? 36 : 28;

    if (section.logoUrl) {
      return (
        <Image
          source={{ uri: section.logoUrl }}
          style={isLarge ? styles.logoImageFirst : styles.logoImage}
        />
      );
    }

    return (
      <ThemedText style={isLarge ? styles.logoEmojiFirst : styles.logoEmoji}>
        {section.logo}
      </ThemedText>
    );
  };

  return (
    <View style={styles.container}>
      {/* 2nd Place */}
      <View style={styles.podiumItem}>
        <View style={[styles.logoContainer, styles.logoSecond, { borderColor: COLORS.silver }]}>
          {renderSectionLogo(second, 'small')}
        </View>
        <ThemedText style={styles.name} numberOfLines={1}>{second.name}</ThemedText>
        <ThemedText style={[styles.points, { color: COLORS.silver }]}>{second.totalPoints} pts</ThemedText>
        <ThemedText style={styles.scoutsCount}>{second.scoutsCount} scouts</ThemedText>
        <View style={[styles.podiumBase, styles.podiumSecond, { backgroundColor: COLORS.silver }]}>
          <ThemedText style={styles.medal}>🥈</ThemedText>
        </View>
      </View>

      {/* 1st Place */}
      <View style={styles.podiumItem}>
        <View style={[styles.logoContainer, styles.logoFirst, { borderColor: COLORS.gold, backgroundColor: COLORS.goldLight }]}>
          {renderSectionLogo(first, 'large')}
        </View>
        <ThemedText style={[styles.name, styles.nameFirst]}>{first.name}</ThemedText>
        <ThemedText style={[styles.points, styles.pointsFirst, { color: COLORS.gold }]}>{first.totalPoints} pts</ThemedText>
        <ThemedText style={[styles.scoutsCount, styles.scoutsCountFirst]}>{first.scoutsCount} scouts</ThemedText>
        <LinearGradient
          colors={[BrandColors.accent[500], BrandColors.accent[700]]}
          style={[styles.podiumBase, styles.podiumFirst]}
        >
          <ThemedText style={styles.medalFirst}>🥇</ThemedText>
        </LinearGradient>
      </View>

      {/* 3rd Place */}
      <View style={styles.podiumItem}>
        <View style={[
          styles.logoContainer,
          styles.logoThird,
          {
            borderColor: COLORS.bronze,
            backgroundColor: third.isMySection ? `${COLORS.primary}30` : mist,
          }
        ]}>
          {renderSectionLogo(third, 'small')}
        </View>
        <ThemedText style={[styles.name, third.isMySection && { color: COLORS.primary }]} numberOfLines={1}>
          {third.name}
        </ThemedText>
        <ThemedText style={[styles.points, { color: COLORS.bronze }]}>{third.totalPoints} pts</ThemedText>
        <ThemedText style={styles.scoutsCount}>{third.scoutsCount} scouts</ThemedText>
        <View style={[styles.podiumBase, styles.podiumThird, { backgroundColor: COLORS.bronze }]}>
          <ThemedText style={styles.medal}>🥉</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 12,
    paddingVertical: 24,
    marginBottom: 32,
  },
  podiumItem: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  logoFirst: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 4,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoSecond: {
    backgroundColor: BrandColors.secondary[100],
  },
  logoThird: {
    backgroundColor: BrandColors.secondary[100],
  },
  logoEmoji: {
    fontSize: 28,
  },
  logoEmojiFirst: {
    fontSize: 36,
  },
  logoImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  logoImageFirst: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 70,
    textAlign: 'center',
  },
  nameFirst: {
    fontSize: 14,
    fontWeight: '700',
    maxWidth: 80,
  },
  points: {
    fontSize: 12,
    fontWeight: '700',
  },
  pointsFirst: {
    fontSize: 14,
  },
  scoutsCount: {
    fontSize: 10,
    color: BrandColors.secondary[500],
    marginTop: 2,
  },
  scoutsCountFirst: {
    fontSize: 11,
  },
  podiumBase: {
    marginTop: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumFirst: {
    width: 80,
    height: 80,
  },
  podiumSecond: {
    width: 70,
    height: 60,
  },
  podiumThird: {
    width: 70,
    height: 40,
  },
  medal: {
    fontSize: 24,
  },
  medalFirst: {
    fontSize: 32,
  },
});
