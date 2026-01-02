import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CommentItemProps {
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
  isOwnComment: boolean;
  isAuthorAnimator?: boolean;
  canDelete: boolean;
  onDelete?: () => void;
}

export function CommentItem({
  authorName,
  authorAvatar,
  content,
  createdAt,
  isOwnComment,
  isAuthorAnimator = false,
  canDelete,
  onDelete,
}: CommentItemProps) {
  const cardColor = useThemeColor({}, 'card');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const timeAgo = formatDistanceToNow(createdAt, {
    addSuffix: true,
    locale: fr,
  });

  return (
    <View style={[styles.container, { backgroundColor: cardColor }]}>
      {/* Avatar */}
      {authorAvatar ? (
        <Image source={{ uri: authorAvatar }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <ThemedText style={styles.avatarText}>
            {authorName.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={[styles.authorName, isAuthorAnimator && { color: BrandColors.accent[600] }]}>
            {authorName}
            {isAuthorAnimator && (
              <ThemedText style={styles.animatorBadge}> · Animateur</ThemedText>
            )}
            {isOwnComment && (
              <ThemedText style={styles.youBadge}> (vous)</ThemedText>
            )}
          </ThemedText>
          <ThemedText style={[styles.timestamp, { color: textSecondary }]}>
            {timeAgo}
          </ThemedText>
        </View>
        <ThemedText style={styles.text}>{content}</ThemedText>
      </View>

      {/* Delete button */}
      {canDelete && onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={NeutralColors.gray[400]} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: BrandColors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.primary[600],
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
  },
  youBadge: {
    fontSize: 11,
    fontWeight: '400',
    color: BrandColors.primary[500],
  },
  animatorBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: BrandColors.accent[500],
  },
  timestamp: {
    fontSize: 11,
  },
  text: {
    fontSize: 14,
    lineHeight: 18,
  },
  deleteButton: {
    padding: 4,
  },
});
