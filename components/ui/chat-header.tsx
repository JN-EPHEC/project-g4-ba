import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { Spacing } from '@/constants/design-tokens';

interface ChatHeaderProps {
  channelName: string;
  channelIcon?: string;
  memberCount?: number;
  onlineCount?: number;
  onSearchPress?: () => void;
}

export function ChatHeader({
  channelName,
  channelIcon = 'chatbubble',
  memberCount,
  onlineCount,
  onSearchPress,
}: ChatHeaderProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={[styles.container, { borderBottomColor: borderColor }]}>
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={channelIcon as any}
            size={20}
            color={BrandColors.primary[600]}
          />
        </View>
        <View style={styles.textContainer}>
          <ThemedText style={[styles.channelName, { color: textColor }]}>
            #{channelName}
          </ThemedText>
          {(memberCount !== undefined || onlineCount !== undefined) && (
            <ThemedText style={[styles.memberInfo, { color: textSecondary }]}>
              {memberCount !== undefined && `${memberCount} membres`}
              {memberCount !== undefined && onlineCount !== undefined && ' · '}
              {onlineCount !== undefined && `${onlineCount} en ligne`}
            </ThemedText>
          )}
        </View>
      </View>

      {onSearchPress && (
        <TouchableOpacity onPress={onSearchPress} style={styles.searchButton}>
          <Ionicons name="search" size={20} color={textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BrandColors.primary[500] + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    gap: 2,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberInfo: {
    fontSize: 12,
  },
  searchButton: {
    padding: Spacing.sm,
  },
});
