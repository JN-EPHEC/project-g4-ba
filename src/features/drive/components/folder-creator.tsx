import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { DriveService } from '@/src/shared/services/drive-service';
import { FolderCategory, FOLDER_LABELS } from '@/src/shared/types/document';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/design-tokens';

interface SelectedFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

// Couleurs par catégorie (vert ou orange)
const CATEGORY_COLORS: Record<FolderCategory, string> = {
  [FolderCategory.ADMINISTRATIVE]: BrandColors.primary[500], // Vert
  [FolderCategory.ACTIVITIES]: BrandColors.accent[500], // Orange
  [FolderCategory.PHOTOS]: BrandColors.accent[400], // Orange clair
  [FolderCategory.PLANNING]: BrandColors.primary[400], // Vert clair
  [FolderCategory.RESOURCES]: BrandColors.secondary[500], // Taupe
  [FolderCategory.OTHER]: NeutralColors.gray[500], // Gris
};

// Catégories principales à afficher (simplifiées)
const MAIN_CATEGORIES: { key: FolderCategory; label: string; color: string }[] = [
  { key: FolderCategory.ADMINISTRATIVE, label: 'Administratif', color: BrandColors.primary[500] },
  { key: FolderCategory.ACTIVITIES, label: 'Activités', color: BrandColors.accent[500] },
  { key: FolderCategory.PHOTOS, label: 'Photos', color: BrandColors.accent[400] },
  { key: FolderCategory.PLANNING, label: 'Planning', color: BrandColors.primary[400] },
  { key: FolderCategory.RESOURCES, label: 'Ressources', color: BrandColors.secondary[500] },
  { key: FolderCategory.OTHER, label: 'Autres', color: NeutralColors.gray[500] },
];

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
  const [category, setCategory] = useState<FolderCategory>(FolderCategory.ADMINISTRATIVE);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  // Theme colors
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const inputBg = useThemeColor({}, 'inputBackground');
  const inputBorder = useThemeColor({}, 'inputBorder');

  const selectedColor = CATEGORY_COLORS[category];

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
    <View style={[styles.card, { backgroundColor: cardColor, borderColor: cardBorder }]}>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: textColor }]}>Nouveau dossier</ThemedText>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Aperçu du dossier avec la couleur sélectionnée */}
      <View style={styles.previewContainer}>
        <View style={[styles.previewIcon, { backgroundColor: `${selectedColor}15` }]}>
          <Ionicons name="folder" size={40} color={selectedColor} />
        </View>
        <ThemedText style={[styles.previewName, { color: textColor }]}>
          {name || 'Nom du dossier'}
        </ThemedText>
      </View>

      <TextInput
        style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
        placeholder="Nom du dossier"
        placeholderTextColor={textSecondary}
        value={name}
        onChangeText={setName}
        maxLength={50}
      />

      <TextInput
        style={[styles.input, styles.descriptionInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
        placeholder="Description (optionnel)"
        placeholderTextColor={textSecondary}
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={200}
      />

      <ThemedText style={[styles.label, { color: textSecondary }]}>Catégorie (couleur du dossier)</ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {MAIN_CATEGORIES.map((cat) => {
          const isSelected = category === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: isSelected ? cat.color : `${cat.color}15`,
                  borderColor: cat.color,
                },
              ]}
              onPress={() => setCategory(cat.key)}
            >
              <Ionicons
                name="folder"
                size={18}
                color={isSelected ? '#FFFFFF' : cat.color}
              />
              <ThemedText
                style={[
                  styles.categoryLabel,
                  { color: isSelected ? '#FFFFFF' : cat.color },
                ]}
              >
                {cat.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Section fichiers attachés */}
      <ThemedText style={[styles.label, { color: textSecondary }]}>Fichiers à ajouter (optionnel)</ThemedText>

      <TouchableOpacity
        style={[styles.attachButton, { borderColor: selectedColor }]}
        onPress={handleSelectFile}
      >
        <Ionicons name="attach" size={20} color={selectedColor} />
        <ThemedText style={[styles.attachButtonText, { color: selectedColor }]}>
          Attacher un fichier
        </ThemedText>
      </TouchableOpacity>

      {selectedFiles.length > 0 && (
        <View style={styles.filesList}>
          {selectedFiles.map((file, index) => (
            <View
              key={`${file.name}-${index}`}
              style={[styles.fileItem, { backgroundColor: `${selectedColor}10`, borderColor: `${selectedColor}30` }]}
            >
              <Ionicons name="document" size={18} color={selectedColor} />
              <ThemedText style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
                {file.name}
              </ThemedText>
              <ThemedText style={[styles.fileSize, { color: textSecondary }]}>
                {(file.size / 1024).toFixed(1)} Ko
              </ThemedText>
              <TouchableOpacity
                onPress={() => handleRemoveFile(index)}
                style={styles.removeFileButton}
              >
                <Ionicons name="close-circle" size={20} color={BrandColors.accent[500]} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  previewIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  input: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontSize: 15,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  descriptionInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  categoryScroll: {
    marginBottom: Spacing.lg,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    gap: 6,
    borderWidth: 1,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  createButton: {
    marginTop: Spacing.sm,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  attachButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filesList: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
  },
  fileSize: {
    fontSize: 12,
  },
  removeFileButton: {
    padding: 2,
  },
});
