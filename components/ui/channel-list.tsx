import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import type { Channel } from '@/src/shared/types/channel';
import { ChannelService } from '@/src/shared/services/channel-service';
import { UserRole } from '@/types';

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
              style={[styles.channelItem, isSelected && styles.channelItemSelected]}
              onPress={() => onSelectChannel(channel)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.channelIcon}>{channel.icon}</ThemedText>
              <ThemedText
                style={[styles.channelName, isSelected && styles.channelNameSelected]}
                numberOfLines={1}
              >
                {channel.name}
              </ThemedText>
              {!canWrite && (
                <Ionicons
                  name="eye-outline"
                  size={12}
                  color={isSelected ? '#FFFFFF' : '#999'}
                  style={styles.readOnlyIcon}
                />
              )}
            </TouchableOpacity>
          );
        })}

        {canCreateChannel && onCreateChannel && (
          <TouchableOpacity onPress={onCreateChannel} style={styles.addButton}>
            <Ionicons name="add" size={20} color="#3b82f6" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    gap: 6,
  },
  channelItemSelected: {
    backgroundColor: '#3b82f6',
  },
  channelIcon: {
    fontSize: 16,
  },
  channelName: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '500',
  },
  channelNameSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  readOnlyIcon: {
    marginLeft: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
  },
});
