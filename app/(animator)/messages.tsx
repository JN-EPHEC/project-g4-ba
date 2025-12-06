import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PostCard, PostComposer, ChannelList, type PostAuthor } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { ChannelService } from '@/src/shared/services/channel-service';
import { StorageService } from '@/src/shared/services/storage-service';
import { UserService } from '@/services/user-service';
import type { Channel, ChannelMessage } from '@/src/shared/types/channel';
import type { Animator } from '@/types';
import { UserRole } from '@/types';

export default function MessagesScreen() {
  const { user } = useAuth();
  const animator = user as Animator;

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [authors, setAuthors] = useState<Record<string, PostAuthor>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Charger les canaux
  const loadChannels = useCallback(async () => {
    console.log('[Messages] loadChannels appelé, unitId:', animator?.unitId);

    if (!animator?.unitId) {
      console.log('[Messages] Pas de unitId, arrêt du chargement');
      setIsLoading(false);
      return;
    }

    try {
      console.log('[Messages] Création/vérification des canaux par défaut...');
      // S'assurer que les canaux par défaut existent
      const fetchedChannels = await ChannelService.ensureDefaultChannels(
        animator.unitId,
        animator.id
      );
      console.log('[Messages] Canaux reçus:', fetchedChannels.length);
      setChannels(fetchedChannels);

      // Sélectionner le premier canal par défaut
      if (fetchedChannels.length > 0 && !selectedChannel) {
        setSelectedChannel(fetchedChannels[0]);
      }
    } catch (error) {
      console.error('[Messages] Erreur chargement canaux:', error);
    } finally {
      setIsLoading(false);
    }
  }, [animator?.unitId, animator?.id]);

  // Charger les messages du canal sélectionné
  const loadMessages = useCallback(async () => {
    if (!selectedChannel) return;

    setIsLoadingMessages(true);
    try {
      const fetchedMessages = await ChannelService.getMessages(selectedChannel.id);
      setMessages(fetchedMessages);

      // Charger les auteurs
      const authorIds = [...new Set(fetchedMessages.map((m) => m.authorId))];
      const authorsMap: Record<string, PostAuthor> = { ...authors };

      await Promise.all(
        authorIds
          .filter((id) => !authorsMap[id])
          .map(async (authorId) => {
            try {
              const userData = await UserService.getUserById(authorId);
              if (userData) {
                authorsMap[authorId] = {
                  id: userData.id,
                  firstName: userData.firstName,
                  lastName: userData.lastName,
                  profilePicture: userData.profilePicture,
                };
              }
            } catch (error) {
              console.error('Erreur chargement auteur:', error);
            }
          })
      );

      setAuthors(authorsMap);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    } finally {
      setIsLoadingMessages(false);
      setIsRefreshing(false);
    }
  }, [selectedChannel?.id]);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages();
    }
  }, [selectedChannel?.id]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadMessages();
  };

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setMessages([]);
  };

  const handleSubmitMessage = async (content: string, attachmentUri?: string) => {
    if (!selectedChannel || !animator) return;

    let attachment: { type: 'image' | 'file'; url: string; name?: string } | undefined;

    if (attachmentUri) {
      const uploadResult = await StorageService.uploadPostAttachment(
        animator.unitId,
        attachmentUri
      );
      attachment = {
        type: uploadResult.type,
        url: uploadResult.url,
        name: uploadResult.name,
      };
    }

    const newMessage = await ChannelService.sendMessage(
      selectedChannel.id,
      animator.id,
      content,
      attachment
    );

    // Ajouter le nouveau message à la fin de la liste
    setMessages((prev) => [...prev, newMessage]);

    // Ajouter l'auteur s'il n'existe pas
    if (!authors[animator.id]) {
      setAuthors((prev) => ({
        ...prev,
        [animator.id]: {
          id: animator.id,
          firstName: animator.firstName,
          lastName: animator.lastName,
          profilePicture: animator.profilePicture,
        },
      }));
    }
  };

  const canWriteInChannel = selectedChannel
    ? ChannelService.canWrite(selectedChannel, UserRole.ANIMATOR)
    : false;

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <ThemedText style={styles.loadingText}>
            Chargement des canaux...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3b82f6"
          />
        }
      >
        <ThemedText type="title" style={styles.title}>
          Messages
        </ThemedText>

        <Animated.View entering={FadeIn.duration(300)}>
          <ChannelList
            channels={channels}
            selectedChannelId={selectedChannel?.id || null}
            onSelectChannel={handleSelectChannel}
            userRole={UserRole.ANIMATOR}
          />
        </Animated.View>

        {selectedChannel && (
          <>
            <View style={styles.channelHeader}>
              <ThemedText style={styles.channelIcon}>{selectedChannel.icon}</ThemedText>
              <View>
                <ThemedText type="subtitle" style={styles.channelTitle}>
                  {selectedChannel.name}
                </ThemedText>
                {selectedChannel.description && (
                  <ThemedText style={styles.channelDescription}>
                    {selectedChannel.description}
                  </ThemedText>
                )}
              </View>
            </View>

            {canWriteInChannel && (
              <Animated.View entering={FadeIn.duration(300)}>
                <PostComposer
                  onSubmit={handleSubmitMessage}
                  placeholder={`Message dans #${selectedChannel.name}...`}
                />
              </Animated.View>
            )}

            {isLoadingMessages ? (
              <View style={styles.loadingMessages}>
                <ActivityIndicator size="small" color="#3b82f6" />
              </View>
            ) : messages.length === 0 ? (
              <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
                <ThemedText style={styles.emptyIcon}>💬</ThemedText>
                <ThemedText type="subtitle" style={styles.emptyTitle}>
                  Aucun message
                </ThemedText>
                <ThemedText style={styles.emptyText}>
                  Soyez le premier à écrire dans ce canal !
                </ThemedText>
              </Animated.View>
            ) : (
              messages.map((message, index) => (
                <Animated.View
                  key={message.id}
                  entering={FadeInDown.duration(300).delay(index * 30)}
                >
                  <PostCard
                    post={{
                      id: message.id,
                      content: message.content,
                      authorId: message.authorId,
                      unitId: selectedChannel.unitId,
                      attachment: message.attachment,
                      createdAt: message.createdAt,
                    }}
                    author={authors[message.authorId]}
                  />
                </Animated.View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  title: {
    marginBottom: 20,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#999999',
  },
  loadingMessages: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  channelIcon: {
    fontSize: 28,
  },
  channelTitle: {
    color: '#FFFFFF',
  },
  channelDescription: {
    color: '#999999',
    fontSize: 13,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#FFFFFF',
  },
  emptyText: {
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
