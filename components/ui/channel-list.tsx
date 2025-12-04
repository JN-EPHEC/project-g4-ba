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
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
          Canaux
        </ThemedText>
        {canCreateChannel && onCreateChannel && (
          <TouchableOpacity onPress={onCreateChannel} style={styles.addButton}>
            <Ionicons name="add" size={20} color="#3b82f6" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
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
              <View style={styles.channelInfo}>
                <ThemedText
                  style={[styles.channelName, isSelected && styles.channelNameSelected]}
                  numberOfLines={1}
                >
                  {channel.name}
                </ThemedText>
                {!canWrite && (
                  <View style={styles.readOnlyBadge}>
                    <Ionicons name="eye-outline" size={10} color="#999" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerTitle: {
    color: '#999',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addButton: {
    padding: 4,
  },
  list: {
    maxHeight: 200,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  channelItemSelected: {
    backgroundColor: '#3b82f6',
  },
  channelIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  channelInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelName: {
    color: '#CCCCCC',
    fontSize: 15,
    flex: 1,
  },
  channelNameSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  readOnlyBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
});
