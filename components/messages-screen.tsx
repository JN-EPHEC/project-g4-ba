import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChannelList, PostCard, type PostAuthor } from '@/components/ui';
import { ChatBubble, type ChatBubbleAuthor } from '@/components/ui/chat-bubble';
import { DateSeparator } from '@/components/ui/date-separator';
import { ChatHeader } from '@/components/ui/chat-header';
import { PostComposer } from '@/components/ui/post-composer';
import { ChannelType } from '@/src/shared/types/channel';
import type { MentionableUser } from '@/components/ui/post-composer';
import { ChannelService } from '@/src/shared/services/channel-service';
import { StorageService } from '@/src/shared/services/storage-service';
import { UserService } from '@/services/user-service';
import { UnitService } from '@/services/unit-service';
import type { Channel, ChannelMessage } from '@/src/shared/types/channel';
import type { AnyUser } from '@/types';
import { UserRole } from '@/types';
import { BrandColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/design-tokens';

interface MessagesScreenProps {
  user: AnyUser;
  unitId: string;
  userRole: UserRole;
}

interface MessageGroup {
  date: Date;
  messages: ChannelMessage[];
}

// Grouper les messages par date
function groupMessagesByDate(messages: ChannelMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let currentDateStr = '';

  // Messages sont ordonnés du plus récent au plus ancien, on inverse pour l'affichage
  const sortedMessages = [...messages].reverse();

  for (const msg of sortedMessages) {
    const msgDate = new Date(msg.createdAt);
    const dateStr = msgDate.toDateString();

    if (dateStr !== currentDateStr) {
      groups.push({ date: msgDate, messages: [] });
      currentDateStr = dateStr;
    }
    groups[groups.length - 1].messages.push(msg);
  }

  return groups;
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
  const [listKey, setListKey] = useState(0);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Charger les membres de l'unité pour les mentions
  const loadUnitMembers = useCallback(async () => {
    if (!unitId) return;

    try {
      console.log('[Messages] Chargement des membres pour mentions...');
      const members = await UnitService.getUnitMembers(unitId);
      const mentionable: MentionableUser[] = members
        .filter((member) => member.id !== user.id)
        .map((member) => ({
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          totemAnimal: (member as any).totemAnimal,
          totemEmoji: (member as any).totemEmoji,
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
      if (userRole === UserRole.ANIMATOR) {
        console.log('[Messages] Création/vérification des canaux par défaut...');
        await ChannelService.ensureDefaultChannels(unitId, user.id);
        console.log('[Messages] Canaux par défaut OK');
      }

      console.log('[Messages] Récupération des canaux accessibles...');
      const accessibleChannels = await ChannelService.getAccessibleChannels(unitId, userRole);
      console.log('[Messages] Canaux reçus:', accessibleChannels.length);
      setChannels(accessibleChannels);

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

      const authorIds = [...new Set(fetchedMessages.map((m) => m.authorId))];
      const authorsMap: Record<string, PostAuthor> = { ...authors };

      if (!authorsMap[user.id]) {
        authorsMap[user.id] = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          totemAnimal: (user as any).totemAnimal,
          totemEmoji: (user as any).totemEmoji,
          role: user.role,
        };
      }

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
                  totemAnimal: (userData as any).totemAnimal,
                  totemEmoji: (userData as any).totemEmoji,
                  role: userData.role,
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
  }, [selectedChannel?.id, user]);

  useEffect(() => {
    loadChannels();
    loadUnitMembers();
  }, [loadChannels, loadUnitMembers]);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages();
    }
  }, [selectedChannel?.id]);

  // Auto-scroll vers le bas quand nouveau message
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

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

    if (!authors[user.id]) {
      setAuthors((prev) => ({
        ...prev,
        [user.id]: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          totemAnimal: (user as any).totemAnimal,
          totemEmoji: (user as any).totemEmoji,
        },
      }));
    }

    // Ajouter le nouveau message au début de la liste
    setMessages((prev) => [newMessage, ...prev]);
    setListKey((prev) => prev + 1);

    // Scroller vers le bas après l'ajout
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const canWriteInChannel = selectedChannel
    ? ChannelService.canWrite(selectedChannel, userRole)
    : false;

  const canDeleteMessages = userRole === UserRole.ANIMATOR;

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await ChannelService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      console.log('[Messages] Message supprimé:', messageId);
    } catch (error) {
      console.error('[Messages] Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du message');
    }
  };

  // Convertir PostAuthor en ChatBubbleAuthor
  const toChatBubbleAuthor = (author?: PostAuthor): ChatBubbleAuthor | undefined => {
    if (!author) return undefined;
    return {
      id: author.id,
      firstName: author.firstName,
      lastName: author.lastName,
      profilePicture: author.profilePicture,
      totemAnimal: author.totemAnimal,
      totemEmoji: author.totemEmoji,
      role: author.role,
    };
  };

  // Grouper les messages par date
  const messageGroups = groupMessagesByDate(messages);

  // Déterminer si on utilise le style chat (uniquement pour le canal Général)
  const isChatStyle = selectedChannel?.type === ChannelType.GENERAL;

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary[500]} />
          <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
            Chargement des canaux...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!unitId) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={56} color={BrandColors.accent[500]} />
          <ThemedText type="subtitle" style={[styles.emptyTitle, { color: textColor }]}>
            Aucune unité associée
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
            Votre compte n'est pas encore rattaché à une unité scoute. Contactez votre animateur.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (channels.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="chatbubbles-outline" size={56} color={textSecondary} />
          <ThemedText type="subtitle" style={[styles.emptyTitle, { color: textColor }]}>
            Aucun canal disponible
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
            Les canaux de discussion n'ont pas encore été créés pour votre unité.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header avec titre et canaux */}
        <View style={styles.headerSection}>
          <ThemedText type="title" style={[styles.title, { color: textColor }]}>
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
            <ChatHeader
              channelName={selectedChannel.name}
              channelIcon={
                selectedChannel.name === 'Annonces'
                  ? 'megaphone'
                  : selectedChannel.name === 'Parents'
                    ? 'people'
                    : 'chatbubble'
              }
            />
          )}
        </View>

        {/* Zone de messages scrollable */}
        {selectedChannel && (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesScrollView}
            contentContainerStyle={isChatStyle ? styles.messagesContent : styles.messagesContentCard}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={BrandColors.primary[500]}
              />
            }
          >
            {isLoadingMessages ? (
              <View style={styles.loadingMessages}>
                <ActivityIndicator size="small" color={BrandColors.primary[500]} />
              </View>
            ) : messages.length === 0 ? (
              <Animated.View
                entering={FadeIn.duration(400)}
                style={styles.emptyStateChat}
              >
                <View style={styles.welcomeBubble}>
                  <ThemedText style={styles.welcomeText}>
                    Bienvenue dans #{selectedChannel.name} !
                  </ThemedText>
                </View>
              </Animated.View>
            ) : isChatStyle ? (
              // Style chat pour le canal Général
              <View key={`messages-list-${listKey}`}>
                {messageGroups.map((group, groupIndex) => (
                  <View key={`group-${groupIndex}`}>
                    <DateSeparator date={group.date} />
                    {group.messages.map((message, messageIndex) => (
                      <Animated.View
                        key={`${message.id}-${messageIndex}`}
                        entering={FadeInUp.duration(200).delay(messageIndex * 30)}
                      >
                        <ChatBubble
                          id={message.id}
                          content={message.content}
                          authorId={message.authorId}
                          author={toChatBubbleAuthor(authors[message.authorId])}
                          createdAt={message.createdAt}
                          attachment={message.attachment}
                          reactions={message.reactions}
                          currentUserId={user.id}
                          isCurrentUser={message.authorId === user.id}
                          isAnimator={userRole === UserRole.ANIMATOR}
                          canDelete={canDeleteMessages}
                          onDelete={handleDeleteMessage}
                        />
                      </Animated.View>
                    ))}
                  </View>
                ))}
              </View>
            ) : (
              // Style carte pour Annonces et Parents
              <View key={`messages-list-${listKey}`}>
                {messages.map((message, index) => (
                  <Animated.View
                    key={`${message.id}-${index}`}
                    entering={FadeInUp.duration(300).delay(index * 50)}
                  >
                    <PostCard
                      post={{
                        id: message.id,
                        content: message.content,
                        authorId: message.authorId,
                        unitId: selectedChannel.unitId,
                        channelId: selectedChannel.id,
                        attachment: message.attachment,
                        likes: message.likes,
                        likesCount: message.likesCount,
                        commentsCount: message.commentsCount,
                        createdAt: message.createdAt,
                      }}
                      author={authors[message.authorId]}
                      canDelete={canDeleteMessages}
                      onDelete={handleDeleteMessage}
                      isCurrentUser={message.authorId === user.id}
                      currentUserId={user.id}
                      isAnimator={userRole === UserRole.ANIMATOR}
                      authors={authors}
                    />
                  </Animated.View>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* Zone de saisie en bas */}
        {selectedChannel && (
          <View style={[
            isChatStyle ? styles.composerContainer : styles.composerContainerCard,
            { backgroundColor, borderTopColor: cardBorder }
          ]}>
            {canWriteInChannel ? (
              <PostComposer
                onSubmit={handleSubmitMessage}
                placeholder={`Message dans #${selectedChannel.name}...`}
                mentionableUsers={mentionableUsers}
                compact={isChatStyle}
              />
            ) : (
              <View style={[styles.readOnlyBanner, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
                <Ionicons name="eye-outline" size={16} color={BrandColors.accent[500]} />
                <ThemedText style={[styles.readOnlyText, { color: BrandColors.accent[500] }]}>
                  Ce canal est en lecture seule
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  headerSection: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.md,
    fontSize: 28,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 15,
  },
  loadingMessages: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  messagesScrollView: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: Spacing.md,
  },
  messagesContentCard: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  emptyStateChat: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing.xl * 2,
  },
  welcomeBubble: {
    backgroundColor: BrandColors.primary[500] + '15',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '500',
    color: BrandColors.primary[600],
  },
  composerContainer: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  composerContainerCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  readOnlyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});
