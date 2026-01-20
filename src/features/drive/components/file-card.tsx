import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import type { StorageFile } from '@/src/shared/types/document';
import { FILE_TYPE_ICONS } from '@/src/shared/types/document';
import { DriveService } from '@/src/shared/services/drive-service';

export interface FileCardProps {
  file: StorageFile;
  canDelete?: boolean;
  onDelete?: () => void;
  onPress?: () => void;
}

export function FileCard({ file, canDelete, onDelete, onPress }: FileCardProps) {
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(file.createdAt);

  const handlePress = async () => {
    if (onPress) {
      onPress();
      return;
    }

    // Ouvrir le fichier dans le navigateur
    try {
      if (Platform.OS === 'web') {
        window.open(file.fileUrl, '_blank');
      } else {
        const canOpen = await Linking.canOpenURL(file.fileUrl);
        if (canOpen) {
          await Linking.openURL(file.fileUrl);
        } else {
          Alert.alert('Erreur', 'Impossible d\'ouvrir ce fichier');
        }
      }
    } catch (error) {
      console.error('Erreur ouverture fichier:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir ce fichier');
    }
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      // Sur web, utiliser window.confirm car Alert.alert ne fonctionne pas
      const confirmed = window.confirm(`Voulez-vous vraiment supprimer "${file.name}" ?`);
      if (confirmed && onDelete) {
        onDelete();
      }
    } else {
      Alert.alert(
        'Supprimer le fichier',
        `Voulez-vous vraiment supprimer "${file.name}" ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: onDelete,
          },
        ]
      );
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.iconContainer}>
          <ThemedText style={styles.icon}>{FILE_TYPE_ICONS[file.fileType]}</ThemedText>
        </View>
        <View style={styles.content}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {file.name}
          </ThemedText>
          {file.description && (
            <ThemedText style={styles.description} numberOfLines={1}>
              {file.description}
            </ThemedText>
          )}
          <View style={styles.meta}>
            <ThemedText style={styles.size}>
              {DriveService.formatFileSize(file.size)}
            </ThemedText>
            <ThemedText style={styles.date}>{formattedDate}</ThemedText>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handlePress}>
            <Ionicons name="download-outline" size={20} color="#3b82f6" />
          </TouchableOpacity>
          {canDelete && onDelete && (
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 22,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  description: {
    color: '#999',
    fontSize: 12,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  size: {
    color: '#666',
    fontSize: 12,
  },
  date: {
    color: '#666',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    padding: 8,
  },
});
