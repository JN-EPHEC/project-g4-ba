import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { CommentItem } from './comment-item';
import { ChannelService } from '@/src/shared/services/channel-service';
import { UserService } from '@/services/user-service';
import { MessageComment } from '@/src/shared/types/channel';
import { BrandColors, NeutralColors } from '@/constants/theme';

interface Author {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  profilePicture?: string;
  totemAnimal?: string;
  totemEmoji?: string;
}

interface CommentsSectionProps {
  messageId: string;
  channelId?: string;
  currentUserId: string;
  isAnimator: boolean;
  authors: Record<string, Author>;
  onCommentAdded?: () => void;
}

export function CommentsSection({
  messageId,
  channelId,
  currentUserId,
  isAnimator,
  authors,
  onCommentAdded,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<MessageComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Local authors map pour stocker les auteurs chargés dynamiquement
  const [localAuthors, setLocalAuthors] = useState<Record<string, Author>>({});

  const cardColor = useThemeColor({}, 'card');
  const inputBg = useThemeColor({}, 'inputBackground');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'textSecondary');

  useEffect(() => {
    loadComments();
  }, [messageId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const fetchedComments = await ChannelService.getComments(messageId);
      setComments(fetchedComments);

      // Charger les auteurs des commentaires qui ne sont pas dans la map
      const missingAuthorIds = fetchedComments
        .map((c) => c.authorId)
        .filter((id) => !authors[id] && !localAuthors[id]);

      const uniqueMissingIds = [...new Set(missingAuthorIds)];

      if (uniqueMissingIds.length > 0) {
        const newAuthors: Record<string, Author> = {};
        await Promise.all(
          uniqueMissingIds.map(async (authorId) => {
            try {
              const userData = await UserService.getUserById(authorId);
              if (userData) {
                newAuthors[authorId] = {
                  id: userData.id,
                  firstName: userData.firstName,
                  lastName: userData.lastName,
                  profilePicture: userData.profilePicture,
                  totemAnimal: (userData as any).totemAnimal,
                  totemEmoji: (userData as any).totemEmoji,
                };
              }
            } catch (error) {
              console.error('[CommentsSection] Error loading author:', error);
            }
          })
        );
        setLocalAuthors((prev) => ({ ...prev, ...newAuthors }));
      }
    } catch (error) {
      console.error('[CommentsSection] Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting || !channelId) return;

    try {
      setSubmitting(true);
      const comment = await ChannelService.addComment(
        messageId,
        channelId,
        currentUserId,
        newComment.trim()
      );
      setComments((prev) => [...prev, comment]);
      setNewComment('');
      onCommentAdded?.();
    } catch (error) {
      console.error('[CommentsSection] Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await ChannelService.deleteComment(commentId, messageId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentAdded?.();
    } catch (error) {
      console.error('[CommentsSection] Error deleting comment:', error);
    }
  };

  const getAuthor = (authorId: string): { name: string; avatar?: string } => {
    // Chercher d'abord dans les auteurs passés en props, puis dans les auteurs locaux
    const author = authors[authorId] || localAuthors[authorId];
    if (!author) return { name: 'Utilisateur' };

    // Récupérer l'avatar
    const avatar = author.profilePicture || author.avatarUrl;

    // Utiliser juste le prénom
    let name: string;
    if (author.firstName) {
      name = author.firstName;
    } else {
      name = author.displayName || 'Utilisateur';
    }

    return { name, avatar };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={BrandColors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: `${cardColor}80` }]}>
      {/* Comments List */}
      {comments.length > 0 ? (
        <View style={styles.commentsList}>
          {comments.map((comment) => {
            const isOwnComment = comment.authorId === currentUserId;
            const canDelete = isOwnComment || isAnimator;
            const authorInfo = getAuthor(comment.authorId);

            return (
              <CommentItem
                key={comment.id}
                authorName={authorInfo.name}
                authorAvatar={authorInfo.avatar}
                content={comment.content}
                createdAt={comment.createdAt}
                isOwnComment={isOwnComment}
                canDelete={canDelete}
                onDelete={() => handleDelete(comment.id)}
              />
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            Aucun commentaire. Soyez le premier !
          </ThemedText>
        </View>
      )}

      {/* Comment Input */}
      <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
        <TextInput
          style={[styles.input, { color: textColor }]}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Ajouter un commentaire..."
          placeholderTextColor={placeholderColor}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { opacity: newComment.trim() ? 1 : 0.5 },
          ]}
          onPress={handleSubmit}
          disabled={!newComment.trim() || submitting}
          activeOpacity={0.7}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  commentsList: {
    marginBottom: 12,
  },
  emptyContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: NeutralColors.gray[400],
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 80,
    paddingVertical: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BrandColors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
