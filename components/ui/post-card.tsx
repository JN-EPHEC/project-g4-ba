import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from './avatar';
import { Card } from './card';
import type { Post, PostAttachment } from '@/src/shared/services/community-service';

export interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

export interface PostCardProps {
  post: Post;
  author?: PostAuthor;
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

function AttachmentPreview({ attachment }: { attachment: PostAttachment }) {
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
      style={styles.fileAttachment}
      onPress={() => Linking.openURL(attachment.url)}
    >
      <Ionicons name="document-outline" size={24} color="#3b82f6" />
      <ThemedText style={styles.fileName} numberOfLines={1}>
        {attachment.name || 'Fichier'}
      </ThemedText>
      <Ionicons name="download-outline" size={20} color="#666" />
    </TouchableOpacity>
  );
}

export function PostCard({ post, author }: PostCardProps) {
  const authorName = author
    ? `${author.firstName} ${author.lastName}`
    : 'Utilisateur';

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Avatar
          imageUrl={author?.profilePicture}
          name={authorName}
          size="medium"
        />
        <View style={styles.headerText}>
          <ThemedText type="defaultSemiBold" style={styles.authorName}>
            {authorName}
          </ThemedText>
          <ThemedText style={styles.timestamp}>
            {formatRelativeTime(post.createdAt)}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={styles.content}>{post.content}</ThemedText>

      {post.attachment && (
        <View style={styles.attachmentContainer}>
          <AttachmentPreview attachment={post.attachment} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  timestamp: {
    color: '#999999',
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
  },
  attachmentContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  attachmentImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  fileName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
});
