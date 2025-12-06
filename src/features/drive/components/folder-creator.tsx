import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { DriveService } from '@/src/shared/services/drive-service';
import { FolderCategory, FOLDER_ICONS, FOLDER_LABELS } from '@/src/shared/types/document';

interface SelectedFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

export interface FolderCreatorProps {
  unitId: string;
  userId: string;
  parentId?: string;
  onCreated: () => void;
  onCancel: () => void;
}

export function FolderCreator({
  unitId,
  userId,
  parentId,
  onCreated,
  onCancel,
}: FolderCreatorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FolderCategory>(FolderCategory.OTHER);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  const categories = Object.values(FolderCategory);

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        }));
        setSelectedFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error('Erreur sélection fichier:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom du dossier est requis');
      return;
    }

    setIsCreating(true);
    try {
      // Créer le dossier
      const folder = await DriveService.createFolder(
        name.trim(),
        category,
        unitId,
        userId,
        description.trim() || undefined,
        parentId
      );

      // Uploader les fichiers dans le dossier créé
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          await DriveService.uploadFile(
            file.uri,
            file.name,
            file.mimeType,
            file.size,
            folder.id,
            unitId,
            userId
          );
        }
      }

      Alert.alert(
        'Succès',
        selectedFiles.length > 0
          ? `Dossier créé avec ${selectedFiles.length} fichier(s)`
          : 'Dossier créé avec succès'
      );
      onCreated();
    } catch (error) {
      console.error('Erreur création dossier:', error);
      Alert.alert('Erreur', 'Impossible de créer le dossier');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Nouveau dossier</ThemedText>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Nom du dossier"
        placeholderTextColor="#666"
        value={name}
        onChangeText={setName}
        maxLength={50}
      />

      <TextInput
        style={[styles.input, styles.descriptionInput]}
        placeholder="Description (optionnel)"
        placeholderTextColor="#666"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={200}
      />

      <ThemedText style={styles.label}>Catégorie</ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryButton,
              category === cat && styles.categoryButtonSelected,
            ]}
            onPress={() => setCategory(cat)}
          >
            <ThemedText style={styles.categoryIcon}>{FOLDER_ICONS[cat]}</ThemedText>
            <ThemedText
              style={[
                styles.categoryLabel,
                category === cat && styles.categoryLabelSelected,
              ]}
            >
              {FOLDER_LABELS[cat]}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Section fichiers attachés */}
      <ThemedText style={styles.label}>Fichiers à ajouter (optionnel)</ThemedText>

      <TouchableOpacity style={styles.attachButton} onPress={handleSelectFile}>
        <Ionicons name="attach" size={20} color="#3b82f6" />
        <ThemedText style={styles.attachButtonText}>
          Attacher un fichier
        </ThemedText>
      </TouchableOpacity>

      {selectedFiles.length > 0 && (
        <View style={styles.filesList}>
          {selectedFiles.map((file, index) => (
            <View key={`${file.name}-${index}`} style={styles.fileItem}>
              <Ionicons name="document" size={18} color="#999" />
              <ThemedText style={styles.fileName} numberOfLines={1}>
                {file.name}
              </ThemedText>
              <ThemedText style={styles.fileSize}>
                {(file.size / 1024).toFixed(1)} Ko
              </ThemedText>
              <TouchableOpacity
                onPress={() => handleRemoveFile(index)}
                style={styles.removeFileButton}
              >
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <PrimaryButton
        title={isCreating ? 'Création...' : selectedFiles.length > 0 ? `Créer avec ${selectedFiles.length} fichier(s)` : 'Créer le dossier'}
        onPress={handleCreate}
        disabled={isCreating || !name.trim()}
        style={styles.createButton}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  input: {
    backgroundColor: '#3A3A3A',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 12,
  },
  descriptionInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  label: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#3A3A3A',
    gap: 6,
  },
  categoryButtonSelected: {
    backgroundColor: '#3b82f6',
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryLabel: {
    color: '#CCCCCC',
    fontSize: 13,
    fontWeight: '500',
  },
  categoryLabelSelected: {
    color: '#FFFFFF',
  },
  createButton: {
    marginTop: 8,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A3A3A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
  },
  attachButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  filesList: {
    marginBottom: 12,
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A3A',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  fileName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  fileSize: {
    color: '#999',
    fontSize: 12,
  },
  removeFileButton: {
    padding: 2,
  },
});
