import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { WidgetCard } from './widget-card';
import { ChannelService } from '@/src/shared/services/channel-service';
import { getRelativeTime } from '@/src/shared/utils/date-utils';
import { UserRole } from '@/types';
import type { Channel, ChannelMessage } from '@/src/shared/types/channel';

interface UnreadMessagesWidgetProps {
  userId: string;
  unitId: string;
  userRole: UserRole;
  delay?: number;
}

interface ChannelUnread {
  channel: Channel;
  unreadCount: number;
  lastMessage: ChannelMessage | null;
}

export function UnreadMessagesWidget({
  userId,
  unitId,
  userRole,
  delay = 0,
}: UnreadMessagesWidgetProps) {
  const router = useRouter();
  const [totalUnread, setTotalUnread] = useState(0);
  const [channelUnreads, setChannelUnreads] = useState<ChannelUnread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUnreadMessages = useCallback(async () => {
    try {
      // Récupérer les canaux accessibles
      const channels = await ChannelService.getAccessibleChannels(unitId, userRole);

      const channelData: ChannelUnread[] = [];

      for (const channel of channels) {
        const lastMessage = await ChannelService.getLastMessage(channel.id);
        // Toujours inclure le canal s'il y a un message
        if (lastMessage) {
          channelData.push({
            channel,
            unreadCount: 0, // On simplifie, pas de comptage complexe
            lastMessage,
          });
        }
      }

      // Trier par date du dernier message (plus récent en premier)
      channelData.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt?.getTime() || 0;
        const bTime = b.lastMessage?.createdAt?.getTime() || 0;
        return bTime - aTime;
      });

      setChannelUnreads(channelData.slice(0, 3)); // Max 3 canaux
      setTotalUnread(channelData.length);
    } catch (error) {
      console.error('[UnreadMessagesWidget] Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  }, [unitId, userRole]);

  useEffect(() => {
    loadUnreadMessages();
  }, [loadUnreadMessages]);

  const handleNavigateToMessages = () => {
    const basePath = userRole === UserRole.ANIMATOR ? '/(animator)' : userRole === UserRole.SCOUT ? '/(scout)' : '/(parent)';
    router.push(`${basePath}/messages`);
  };

  const truncateMessage = (content: string, maxLength = 50): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  if (isLoading) {
    return (
      <WidgetCard
        title="Messages"
        icon="chatbubbles"
        iconColor="#8b5cf6"
        delay={delay}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#8b5cf6" />
        </View>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title="Messages récents"
      icon="chatbubbles"
      iconColor="#8b5cf6"
      showSeeAll
      seeAllText="Messagerie"
      onHeaderPress={handleNavigateToMessages}
      delay={delay}
    >
      {channelUnreads.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-outline" size={32} color="#666" />
          <ThemedText style={styles.emptyText}>Aucun message pour l'instant</ThemedText>
        </View>
      ) : (
        <View style={styles.channelList}>
          {channelUnreads.map((item) => (
            <TouchableOpacity
              key={item.channel.id}
              style={styles.channelItem}
              onPress={handleNavigateToMessages}
              activeOpacity={0.7}
            >
              <View style={styles.channelIcon}>
                <ThemedText style={styles.channelEmoji}>{item.channel.icon}</ThemedText>
              </View>
              <View style={styles.channelContent}>
                <View style={styles.channelHeader}>
                  <ThemedText style={styles.channelName} numberOfLines={1}>
                    {item.channel.name}
                  </ThemedText>
                  {item.lastMessage && (
                    <ThemedText style={styles.timestamp}>
                      {getRelativeTime(item.lastMessage.createdAt)}
                    </ThemedText>
                  )}
                </View>
                {item.lastMessage && (
                  <ThemedText style={styles.lastMessage} numberOfLines={1}>
                    {truncateMessage(item.lastMessage.content)}
                  </ThemedText>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </WidgetCard>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
  channelList: {
    gap: 8,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#3A3A3A',
    borderRadius: 10,
    gap: 10,
  },
  channelIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#4A4A4A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelEmoji: {
    fontSize: 20,
  },
  channelContent: {
    flex: 1,
    gap: 2,
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  timestamp: {
    color: '#888',
    fontSize: 12,
  },
  lastMessage: {
    color: '#999',
    fontSize: 13,
  },
});
