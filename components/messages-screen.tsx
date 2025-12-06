import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PostCard, PostComposer, ChannelList, type PostAuthor } from '@/components/ui';
import type { MentionableUser } from '@/components/ui/post-composer';
import { ChannelService } from '@/src/shared/services/channel-service';
import { StorageService } from '@/src/shared/services/storage-service';
import { UserService } from '@/services/user-service';
import { UnitService } from '@/services/unit-service';
import type { Channel, ChannelMessage } from '@/src/shared/types/channel';
import type { AnyUser } from '@/types';
import { UserRole } from '@/types';

interface MessagesScreenProps {
  user: AnyUser;
  unitId: string;
  userRole: UserRole;
}

export function MessagesScreen({ user, unitId, userRole }: MessagesScreenProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [authors, setAuthors] = useState<Record<string, PostAuthor>>({});
  const [mentionableUsers, setMentionableUsers] = useState<MentionableUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  // Compteur pour forcer le re-rendu de la liste
  const [listKey, setListKey] = useState(0);

  // Charger les membres de l'unité pour les mentions
  const loadUnitMembers = useCallback(async () => {
    if (!unitId) return;

    try {
      console.log('[Messages] Chargement des membres pour mentions...');
      const members = await UnitService.getUnitMembers(unitId);
      const mentionable: MentionableUser[] = members
        .filter((member) => member.id !== user.id) // Exclure l'utilisateur actuel
        .map((member) => ({
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
        }));
      setMentionableUsers(mentionable);
      console.log('[Messages] Membres chargés:', mentionable.length);
    } catch (error) {
      console.error('[Messages] Erreur chargement membres:', error);
    }
  }, [unitId, user.id]);

  // Charger les canaux accessibles selon le rôle
  const loadChannels = useCallback(async () => {
    if (!unitId) {
      console.log('[Messages] Pas de unitId, skip chargement');
      setIsLoading(false);
      return;
    }

    console.log('[Messages] Chargement des canaux pour unitId:', unitId, 'role:', userRole);

    try {
      // S'assurer que les canaux par défaut existent (uniquement pour les animateurs)
      if (userRole === UserRole.ANIMATOR) {
        console.log('[Messages] Création/vérification des canaux par défaut...');
        await ChannelService.ensureDefaultChannels(unitId, user.id);
        console.log('[Messages] Canaux par défaut OK');
      }

      // Récupérer les canaux accessibles pour ce rôle
      console.log('[Messages] Récupération des canaux accessibles...');
      const accessibleChannels = await ChannelService.getAccessibleChannels(unitId, userRole);
      console.log('[Messages] Canaux reçus:', accessibleChannels.length);
      setChannels(accessibleChannels);

      // Sélectionner le premier canal par défaut
      if (accessibleChannels.length > 0 && !selectedChannel) {
        setSelectedChannel(accessibleChannels[0]);
      }
    } catch (error) {
      console.error('[Messages] Erreur chargement canaux:', error);
    } finally {
      console.log('[Messages] Fin du chargement');
      setIsLoading(false);
    }
  }, [unitId, userRole, user.id]);

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
    loadUnitMembers();
  }, [loadChannels, loadUnitMembers]);

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
    if (!selectedChannel || !user) return;

    let attachment: { type: 'image' | 'file'; url: string; name?: string } | undefined;

    if (attachmentUri) {
      const uploadResult = await StorageService.uploadPostAttachment(
        unitId,
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
      user.id,
      content,
      attachment
    );

    // Ajouter l'auteur s'il n'existe pas (faire avant d'ajouter le message)
    if (!authors[user.id]) {
      setAuthors((prev) => ({
        ...prev,
        [user.id]: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
        },
      }));
    }

    // Ajouter le nouveau message au début de la liste (plus récent en premier)
    setMessages((prev) => [newMessage, ...prev]);

    // Forcer le re-rendu de la liste pour que React recalcule l'ordre
    setListKey((prev) => prev + 1);

    // Scroller vers le haut après l'ajout du message
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  const canWriteInChannel = selectedChannel
    ? ChannelService.canWrite(selectedChannel, userRole)
    : false;

  // Les animateurs peuvent supprimer les messages
  const canDeleteMessages = userRole === UserRole.ANIMATOR;

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await ChannelService.deleteMessage(messageId);
      // Retirer le message de la liste locale
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      console.log('[Messages] Message supprimé:', messageId);
    } catch (error) {
      console.error('[Messages] Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du message');
    }
  };

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

  if (channels.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.emptyIcon}>📭</ThemedText>
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            Aucun canal disponible
          </ThemedText>
          <ThemedText style={styles.emptyText}>
            Les canaux de discussion n'ont pas encore été créés pour votre unité.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
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
            userRole={userRole}
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

            {canWriteInChannel ? (
              <Animated.View entering={FadeIn.duration(300)}>
                <PostComposer
                  onSubmit={handleSubmitMessage}
                  placeholder={`Message dans #${selectedChannel.name}...`}
                  mentionableUsers={mentionableUsers}
                />
              </Animated.View>
            ) : (
              <View style={styles.readOnlyBanner}>
                <ThemedText style={styles.readOnlyText}>
                  Ce canal est en lecture seule
                </ThemedText>
              </View>
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
                  {canWriteInChannel
                    ? 'Soyez le premier à écrire dans ce canal !'
                    : 'Aucun message pour le moment.'}
                </ThemedText>
              </Animated.View>
            ) : (
              <View key={`messages-list-${listKey}`}>
                {messages.map((message, index) => (
                  <View key={`${message.id}-${index}`}>
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
                      canDelete={canDeleteMessages}
                      onDelete={handleDeleteMessage}
                    />
                  </View>
                ))}
              </View>
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
  readOnlyBanner: {
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  readOnlyText: {
    color: '#999999',
    fontSize: 13,
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
