import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

const COLORS = {
  gold: BrandColors.accent[500],
  goldLight: BrandColors.accent[50],
  silver: BrandColors.secondary[400],
  bronze: BrandColors.accent[600],
  primary: BrandColors.primary[500],
  primaryLight: BrandColors.primary[400],
};

export interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  avatar: string;
  profilePicture?: string;
  streak: number;
  isMe?: boolean;
}

interface LeaderboardPodiumProps {
  users: LeaderboardUser[];
}

export function LeaderboardPodium({ users }: LeaderboardPodiumProps) {
  const cardColor = useThemeColor({}, 'card');
  const mist = useThemeColor({}, 'cardBorder');

  if (users.length < 3) return null;

  const [first, second, third] = users;

  return (
    <View style={styles.container}>
      {/* 2nd Place */}
      <View style={styles.podiumItem}>
        <View style={[styles.avatar, styles.avatarSecond, { borderColor: COLORS.silver }]}>
          {second.profilePicture ? (
            <Image source={{ uri: second.profilePicture }} style={styles.avatarImage} />
          ) : (
            <ThemedText style={styles.avatarEmoji}>{second.avatar}</ThemedText>
          )}
        </View>
        <ThemedText style={styles.name} numberOfLines={1}>{second.name}</ThemedText>
        <ThemedText style={[styles.points, { color: COLORS.silver }]}>{second.points} pts</ThemedText>
        <View style={[styles.podiumBase, styles.podiumSecond, { backgroundColor: COLORS.silver }]}>
          <ThemedText style={styles.medal}>🥈</ThemedText>
        </View>
      </View>

      {/* 1st Place */}
      <View style={styles.podiumItem}>
        <View style={[styles.avatar, styles.avatarFirst, { borderColor: COLORS.gold, backgroundColor: COLORS.goldLight }]}>
          {first.profilePicture ? (
            <Image source={{ uri: first.profilePicture }} style={styles.avatarImageFirst} />
          ) : (
            <ThemedText style={styles.avatarEmojiFirst}>{first.avatar}</ThemedText>
          )}
        </View>
        <ThemedText style={[styles.name, styles.nameFirst]}>{first.name}</ThemedText>
        <ThemedText style={[styles.points, styles.pointsFirst, { color: COLORS.gold }]}>{first.points} pts</ThemedText>
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
          styles.avatar,
          styles.avatarThird,
          {
            borderColor: COLORS.bronze,
            backgroundColor: third.isMe ? `${COLORS.primary}30` : mist,
          }
        ]}>
          {third.profilePicture ? (
            <Image source={{ uri: third.profilePicture }} style={styles.avatarImage} />
          ) : (
            <ThemedText style={styles.avatarEmoji}>{third.avatar}</ThemedText>
          )}
        </View>
        <ThemedText style={[styles.name, third.isMe && { color: COLORS.primary }]} numberOfLines={1}>
          {third.name}
        </ThemedText>
        <ThemedText style={[styles.points, { color: COLORS.bronze }]}>{third.points} pts</ThemedText>
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
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginBottom: 8,
  },
  avatarFirst: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarSecond: {
    backgroundColor: BrandColors.secondary[100],
  },
  avatarThird: {
    backgroundColor: BrandColors.secondary[100],
  },
  avatarEmoji: {
    fontSize: 28,
  },
  avatarEmojiFirst: {
    fontSize: 36,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarImageFirst: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 70,
    textAlign: 'center',
  },
  nameFirst: {
    fontSize: 15,
    fontWeight: '700',
  },
  points: {
    fontSize: 12,
    fontWeight: '700',
  },
  pointsFirst: {
    fontSize: 14,
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
