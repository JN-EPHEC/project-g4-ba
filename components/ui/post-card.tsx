import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Modal, Platform, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from './avatar';
import { Card } from './card';
import type { Post, PostAttachment } from '@/src/shared/services/community-service';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/design-tokens';
import { getDisplayName } from '@/src/shared/utils/totem-utils';

export interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  totemAnimal?: string;
  totemEmoji?: string;
}

export interface PostCardProps {
  post: Post;
  author?: PostAuthor;
  /** Si true, affiche le bouton de suppression */
  canDelete?: boolean;
  /** Callback appelé quand l'utilisateur veut supprimer le message */
  onDelete?: (postId: string) => void;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function AttachmentPreview({ attachment, textSecondary }: { attachment: PostAttachment; textSecondary: string }) {
  if (attachment.type === 'image') {
    return (
      <Image
        source={{ uri: attachment.url }}
        style={styles.attachmentImage}
        contentFit="cover"
      />
    );
  }

  return (
    <TouchableOpacity
      style={[styles.fileAttachment, { backgroundColor: `${BrandColors.primary[500]}10` }]}
      onPress={() => Linking.openURL(attachment.url)}
    >
      <Ionicons name="document-outline" size={24} color={BrandColors.primary[500]} />
      <ThemedText style={styles.fileName} numberOfLines={1}>
        {attachment.name || 'Fichier'}
      </ThemedText>
      <Ionicons name="download-outline" size={20} color={textSecondary} />
    </TouchableOpacity>
  );
}

export function PostCard({ post, author, canDelete, onDelete, isCurrentUser }: PostCardProps & { isCurrentUser?: boolean }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const authorName = author
    ? getDisplayName(author)
    : 'Utilisateur';

  const authorNameWithoutTotem = author
    ? `${author.firstName} ${author.lastName}`
    : 'Utilisateur';

  const handleDelete = () => {
    if (onDelete) {
      if (Platform.OS === 'web') {
        setShowDeleteModal(true);
      } else {
        Alert.alert(
          'Supprimer le message',
          'Êtes-vous sûr de vouloir supprimer ce message ?',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(post.id) },
          ]
        );
      }
    }
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    if (onDelete) {
      onDelete(post.id);
    }
  };

  return (
    <Card style={[styles.card, { backgroundColor: cardColor, borderColor: cardBorder }]}>
      <View style={styles.header}>
        <Avatar
          imageUrl={author?.profilePicture}
          name={authorName}
          size="medium"
        />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <ThemedText type="defaultSemiBold" style={[styles.authorName, { color: textColor }]}>
              {authorName}
            </ThemedText>
            {isCurrentUser && (
              <View style={[styles.youBadge, { backgroundColor: `${BrandColors.primary[500]}20` }]}>
                <ThemedText style={[styles.youBadgeText, { color: BrandColors.primary[500] }]}>
                  (vous)
                </ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={[styles.timestamp, { color: textSecondary }]}>
            {formatRelativeTime(post.createdAt)}
          </ThemedText>
        </View>
        {canDelete && onDelete && (
          <TouchableOpacity
            onPress={handleDelete}
            style={[styles.menuButton, { backgroundColor: `${textSecondary}10` }]}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ThemedText style={[styles.content, { color: textColor }]}>{post.content}</ThemedText>

      {post.attachment && (
        <View style={styles.attachmentContainer}>
          <AttachmentPreview attachment={post.attachment} textSecondary={textSecondary} />
        </View>
      )}

      {/* Modal de confirmation pour le web */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>
              Supprimer le message
            </ThemedText>
            <ThemedText style={[styles.modalMessage, { color: textSecondary }]}>
              Êtes-vous sûr de vouloir supprimer ce message ?
            </ThemedText>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Annuler</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButtonStyle]}
                onPress={confirmDelete}
              >
                <ThemedText style={styles.deleteButtonTextStyle}>Supprimer</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
  },
  youBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  youBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
  },
  attachmentContainer: {
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  attachmentImage: {
    width: '100%',
    height: 200,
    borderRadius: Radius.lg,
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
  },
  menuButton: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 340,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: NeutralColors.gray[200],
  },
  cancelButtonText: {
    color: NeutralColors.gray[700],
    fontWeight: '600',
  },
  deleteButtonStyle: {
    backgroundColor: '#DC2626',
  },
  deleteButtonTextStyle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
