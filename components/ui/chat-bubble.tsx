import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from './avatar';
import { EmojiPicker } from './emoji-picker';
import { ChannelService } from '@/src/shared/services/channel-service';
import type { MessageReaction } from '@/src/shared/types/channel';
import { BrandColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/design-tokens';
import { getDisplayName } from '@/src/shared/utils/totem-utils';

export interface ChatBubbleAuthor {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  totemAnimal?: string;
  totemEmoji?: string;
  role?: string;
}

export interface ChatBubbleProps {
  id: string;
  content: string;
  authorId: string;
  author?: ChatBubbleAuthor;
  createdAt: Date;
  attachment?: { type: 'image' | 'file'; url: string; name?: string };
  reactions?: MessageReaction[];
  currentUserId?: string;
  isCurrentUser?: boolean;
  isAnimator?: boolean;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
  isSystemMessage?: boolean;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function ChatBubble({
  id,
  content,
  authorId,
  author,
  createdAt,
  attachment,
  reactions: initialReactions = [],
  currentUserId,
  isCurrentUser = false,
  isAnimator = false,
  canDelete = false,
  onDelete,
  isSystemMessage = false,
}: ChatBubbleProps) {
  const [reactions, setReactions] = useState<MessageReaction[]>(initialReactions);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const authorName = author ? getDisplayName(author) : 'Utilisateur';
  const isAuthorAnimator = author?.role === 'animator';

  // Message système (centré)
  if (isSystemMessage) {
    return (
      <View style={styles.systemMessageContainer}>
        <View style={[styles.systemMessageBubble, { backgroundColor: BrandColors.primary[500] + '15' }]}>
          <ThemedText style={[styles.systemMessageText, { color: BrandColors.primary[600] }]}>
            {content}
          </ThemedText>
        </View>
      </View>
    );
  }

  const handleReaction = async (emoji: string) => {
    if (!currentUserId) return;

    // Optimistic update
    const existingIndex = reactions.findIndex((r) => r.emoji === emoji);
    let newReactions = [...reactions];

    if (existingIndex !== -1) {
      const existing = newReactions[existingIndex];
      const hasUserReacted = existing.userIds.includes(currentUserId);

      if (hasUserReacted) {
        existing.userIds = existing.userIds.filter((id) => id !== currentUserId);
        existing.count--;
        if (existing.count === 0) {
          newReactions.splice(existingIndex, 1);
        }
      } else {
        existing.userIds.push(currentUserId);
        existing.count++;
      }
    } else {
      newReactions.push({
        emoji,
        userIds: [currentUserId],
        count: 1,
      });
    }

    setReactions(newReactions);

    try {
      const updatedReactions = await ChannelService.toggleReaction(id, currentUserId, emoji);
      setReactions(updatedReactions);
    } catch (error) {
      // Rollback on error
      setReactions(initialReactions);
      console.error('Erreur lors de la réaction:', error);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;

    if (Platform.OS === 'web') {
      if (confirm('Supprimer ce message ?')) {
        onDelete(id);
      }
    } else {
      Alert.alert(
        'Supprimer le message',
        'Voulez-vous vraiment supprimer ce message ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(id) },
        ]
      );
    }
  };

  // Vérifier si l'utilisateur actuel a réagi avec un emoji spécifique
  const hasUserReacted = (emoji: string): boolean => {
    if (!currentUserId) return false;
    const reaction = reactions.find((r) => r.emoji === emoji);
    return reaction ? reaction.userIds.includes(currentUserId) : false;
  };

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <Avatar
        imageUrl={author?.profilePicture}
        name={authorName}
        size="medium"
      />

      <View style={styles.messageContainer}>
        {/* Header: Nom + Badge + Heure */}
        <View style={styles.header}>
          <ThemedText
            style={[
              styles.authorName,
              { color: isAuthorAnimator ? BrandColors.accent[600] : textColor }
            ]}
          >
            {authorName}
          </ThemedText>

          {isAuthorAnimator && (
            <View style={styles.animatorBadge}>
              <ThemedText style={styles.animatorBadgeText}>Animateur</ThemedText>
            </View>
          )}

          <ThemedText style={[styles.timestamp, { color: textSecondary }]}>
            {formatTime(createdAt)}
          </ThemedText>

          {canDelete && onDelete && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="ellipsis-horizontal" size={16} color={textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Bulle de message */}
        <View style={[styles.bubble, { backgroundColor: '#F5F0E8' }]}>
          <ThemedText style={[styles.content, { color: '#1A2E28' }]}>
            {content}
          </ThemedText>

          {/* Attachment image */}
          {attachment?.type === 'image' && (
            <Image
              source={{ uri: attachment.url }}
              style={styles.attachmentImage}
              contentFit="cover"
            />
          )}
        </View>

        {/* Reactions row */}
        <View style={styles.reactionsRow}>
          {/* Réactions existantes */}
          {reactions.map((reaction) => (
            <TouchableOpacity
              key={reaction.emoji}
              style={[
                styles.reactionButton,
                hasUserReacted(reaction.emoji) && styles.reactionButtonActive
              ]}
              onPress={() => handleReaction(reaction.emoji)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.reactionEmoji}>{reaction.emoji}</ThemedText>
              <ThemedText style={[styles.reactionCount, { color: textSecondary }]}>
                {reaction.count}
              </ThemedText>
            </TouchableOpacity>
          ))}

          {/* Bouton pour ajouter une réaction */}
          {currentUserId && (
            <TouchableOpacity
              style={styles.addReactionButton}
              onPress={() => setShowEmojiPicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color={textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Emoji Picker Modal */}
      <EmojiPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={handleReaction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  messageContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  animatorBadge: {
    backgroundColor: BrandColors.accent[500] + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  animatorBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.accent[600],
  },
  timestamp: {
    fontSize: 12,
    marginLeft: 'auto',
  },
  deleteButton: {
    padding: 4,
    marginLeft: Spacing.xs,
  },
  bubble: {
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: Spacing.md,
    maxWidth: '95%',
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
  },
  attachmentImage: {
    width: '100%',
    height: 180,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  reactionButtonActive: {
    backgroundColor: BrandColors.accent[500] + '20',
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  addReactionButton: {
    padding: 4,
    borderRadius: Radius.full,
  },
  // System message
  systemMessageContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  systemMessageBubble: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  systemMessageText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
