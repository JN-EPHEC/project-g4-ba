import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import type { Channel } from '@/src/shared/types/channel';
import { ChannelService } from '@/src/shared/services/channel-service';
import { UserRole } from '@/types';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/design-tokens';

export interface ChannelListProps {
  channels: Channel[];
  selectedChannelId: string | null;
  onSelectChannel: (channel: Channel) => void;
  userRole: UserRole;
  onCreateChannel?: () => void;
}

export function ChannelList({
  channels,
  selectedChannelId,
  onSelectChannel,
  userRole,
  onCreateChannel,
}: ChannelListProps) {
  const canCreateChannel = userRole === UserRole.ANIMATOR;
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {channels.map((channel) => {
          const isSelected = channel.id === selectedChannelId;
          const canWrite = ChannelService.canWrite(channel, userRole);

          return (
            <TouchableOpacity
              key={channel.id}
              style={[
                styles.channelItem,
                {
                  backgroundColor: isSelected ? BrandColors.primary[500] : cardColor,
                  borderColor: isSelected ? BrandColors.primary[500] : cardBorder,
                }
              ]}
              onPress={() => onSelectChannel(channel)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  channel.type === 'announcements' ? 'megaphone' :
                  channel.type === 'parents' ? 'folder' :
                  'chatbubble'
                }
                size={16}
                color={isSelected ? '#FFFFFF' : BrandColors.primary[500]}
              />
              <ThemedText
                style={[
                  styles.channelName,
                  { color: isSelected ? '#FFFFFF' : textColor }
                ]}
                numberOfLines={1}
              >
                {channel.name}
              </ThemedText>
              {!canWrite && (
                <Ionicons
                  name="eye-outline"
                  size={12}
                  color={isSelected ? '#FFFFFF' : textSecondary}
                  style={styles.readOnlyIcon}
                />
              )}
            </TouchableOpacity>
          );
        })}

        {canCreateChannel && onCreateChannel && (
          <TouchableOpacity
            onPress={onCreateChannel}
            style={[styles.addButton, { borderColor: BrandColors.primary[500] }]}
          >
            <Ionicons name="add" size={20} color={BrandColors.primary[500]} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    gap: Spacing.xs,
    borderWidth: 1,
  },
  channelName: {
    fontSize: 14,
    fontWeight: '600',
  },
  readOnlyIcon: {
    marginLeft: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
});
