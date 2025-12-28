import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

const COLORS = {
  gold: BrandColors.accent[500],
  primary: BrandColors.primary[500],
  neutral: BrandColors.secondary[500],
  mist: BrandColors.secondary[100],
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

interface LeaderboardListProps {
  users: LeaderboardUser[];
  startRank?: number;
}

export function LeaderboardList({ users, startRank = 4 }: LeaderboardListProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');

  return (
    <View style={[styles.container, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
      {users.map((user, index) => {
        const rank = startRank + index;
        const isLast = index === users.length - 1;

        return (
          <View
            key={user.id}
            style={[
              styles.row,
              !isLast && { borderBottomWidth: 1, borderBottomColor: cardBorderColor },
              user.isMe && { backgroundColor: `${COLORS.primary}08` },
            ]}
          >
            <ThemedText style={styles.rank}>{rank}</ThemedText>
            <View style={[
              styles.avatar,
              user.isMe && { backgroundColor: `${COLORS.primary}20`, borderWidth: 2, borderColor: COLORS.primary }
            ]}>
              {user.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
              ) : (
                <ThemedText style={styles.avatarEmoji}>{user.avatar}</ThemedText>
              )}
            </View>
            <View style={styles.info}>
              <ThemedText style={[styles.name, user.isMe && { color: COLORS.primary, fontWeight: '700' }]}>
                {user.name}
              </ThemedText>
              <ThemedText style={styles.streak}>🔥 {user.streak} jours</ThemedText>
            </View>
            <ThemedText style={styles.points}>{user.points}</ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  rank: {
    width: 28,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.neutral,
    textAlign: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  streak: {
    fontSize: 12,
    color: COLORS.neutral,
    marginTop: 2,
  },
  points: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gold,
  },
});
