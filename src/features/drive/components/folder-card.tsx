import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import type { StorageFolder } from '@/src/shared/types/document';
import { FOLDER_LABELS } from '@/src/shared/types/document';

export interface FolderCardProps {
  folder: StorageFolder;
  fileCount?: number;
  onPress: () => void;
  onLongPress?: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
}

export function FolderCard({ folder, fileCount, onPress, onLongPress, canDelete, onDelete }: FolderCardProps) {
  const handleDelete = () => {
    Alert.alert(
      'Supprimer le dossier',
      `Voulez-vous vraiment supprimer "${folder.name}" et tout son contenu ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.iconContainer}>
          <ThemedText style={styles.icon}>{folder.icon}</ThemedText>
        </View>
        <View style={styles.content}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {folder.name}
          </ThemedText>
          {folder.description && (
            <ThemedText style={styles.description} numberOfLines={1}>
              {folder.description}
            </ThemedText>
          )}
          <View style={styles.meta}>
            <ThemedText style={styles.category}>
              {FOLDER_LABELS[folder.category]}
            </ThemedText>
            {fileCount !== undefined && (
              <ThemedText style={styles.fileCount}>
                {fileCount} fichier{fileCount !== 1 ? 's' : ''}
              </ThemedText>
            )}
          </View>
        </View>
        {canDelete && onDelete ? (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#666" />
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    color: '#999',
    fontSize: 13,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  category: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '500',
  },
  fileCount: {
    color: '#666',
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
});
