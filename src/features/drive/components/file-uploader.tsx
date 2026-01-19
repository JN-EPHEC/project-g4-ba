import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { DriveService } from '@/src/shared/services/drive-service';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

export interface FileUploaderProps {
  folderId: string;
  unitId: string;
  userId: string;
  onUploadComplete: () => void;
  onCancel: () => void;
}

export function FileUploader({
  folderId,
  unitId,
  userId,
  onUploadComplete,
  onCancel,
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    mimeType: string;
    size: number;
    file?: File; // Pour le web, on stocke le File directement
    isImage?: boolean;
  } | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Pour le web, utiliser un input file natif
  const handleWebFileSelect = (acceptImages: boolean = false) => {
    if (Platform.OS !== 'web') return;

    // Créer un input file caché
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.accept = acceptImages ? 'image/*' : '*/*';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const isImage = file.type.startsWith('image/');
        setSelectedFile({
          uri: URL.createObjectURL(file),
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          file: file,
          isImage,
        });
      }
      // Nettoyer
      document.body.removeChild(input);
    };
    document.body.appendChild(input);
    input.click();
  };

  // Sélectionner depuis la galerie photos
  const handleSelectFromGallery = async () => {
    if (Platform.OS === 'web') {
      handleWebFileSelect(true);
      return;
    }

    // Demander la permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Nous avons besoin de l\'accès à vos photos pour ajouter des images.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `photo_${Date.now()}.jpg`;

        // Obtenir la taille du fichier
        const response = await fetch(asset.uri);
        const blob = await response.blob();

        setSelectedFile({
          uri: asset.uri,
          name: fileName,
          mimeType: asset.mimeType || 'image/jpeg',
          size: blob.size,
          isImage: true,
        });
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  // Sélectionner un document (PDF, etc.)
  const handleSelectDocument = async () => {
    if (Platform.OS === 'web') {
      handleWebFileSelect(false);
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
          isImage: false,
        });
      }
    } catch (error) {
      console.error('Erreur sélection fichier:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Sur le web, utiliser le File directement si disponible
      if (Platform.OS === 'web' && selectedFile.file) {
        await DriveService.uploadFileFromBlob(
          selectedFile.file,
          selectedFile.name,
          selectedFile.mimeType,
          selectedFile.size,
          folderId,
          unitId,
          userId,
          description || undefined
        );
      } else if (selectedFile.isImage) {
        // Pour les images sur mobile, convertir en blob
        const response = await fetch(selectedFile.uri);
        const blob = await response.blob();
        await DriveService.uploadFileFromBlob(
          blob,
          selectedFile.name,
          selectedFile.mimeType,
          blob.size,
          folderId,
          unitId,
          userId,
          description || undefined
        );
      } else {
        await DriveService.uploadFile(
          selectedFile.uri,
          selectedFile.name,
          selectedFile.mimeType,
          selectedFile.size,
          folderId,
          unitId,
          userId,
          description || undefined
        );
      }

      Alert.alert('Succès', 'Fichier uploadé avec succès');
      onUploadComplete();
    } catch (error) {
      console.error('Erreur upload:', error);
      Alert.alert('Erreur', 'Impossible d\'uploader le fichier');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card style={[styles.card, { backgroundColor: cardColor }]}>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: textColor }]}>Ajouter un fichier</ThemedText>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={textSecondary} />
        </TouchableOpacity>
      </View>

      {!selectedFile ? (
        <View style={styles.optionsContainer}>
          {/* Option 1: Galerie photos */}
          <TouchableOpacity
            style={[styles.optionButton, { borderColor: textSecondary }]}
            onPress={handleSelectFromGallery}
          >
            <View style={[styles.optionIcon, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
              <Ionicons name="images" size={32} color={BrandColors.primary[500]} />
            </View>
            <View style={styles.optionTextContainer}>
              <ThemedText style={[styles.optionText, { color: textColor }]}>
                Choisir une photo
              </ThemedText>
              <ThemedText style={[styles.optionHint, { color: textSecondary }]}>
                Depuis votre galerie
              </ThemedText>
            </View>
          </TouchableOpacity>

          {/* Option 2: Documents */}
          <TouchableOpacity
            style={[styles.optionButton, { borderColor: textSecondary }]}
            onPress={handleSelectDocument}
          >
            <View style={[styles.optionIcon, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
              <Ionicons name="document" size={32} color={BrandColors.accent[500]} />
            </View>
            <View style={styles.optionTextContainer}>
              <ThemedText style={[styles.optionText, { color: textColor }]}>
                Choisir un document
              </ThemedText>
              <ThemedText style={[styles.optionHint, { color: textSecondary }]}>
                PDF, Word...
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.selectedFile}>
          {/* Preview de l'image ou icône document */}
          {selectedFile.isImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: selectedFile.uri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedFile(null)}
              >
                <Ionicons name="close-circle" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.fileInfo, { backgroundColor: `${textSecondary}15` }]}>
              <Ionicons name="document" size={32} color={BrandColors.accent[500]} />
              <View style={styles.fileDetails}>
                <ThemedText style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
                  {selectedFile.name}
                </ThemedText>
                <ThemedText style={[styles.fileSize, { color: textSecondary }]}>
                  {DriveService.formatFileSize(selectedFile.size)}
                </ThemedText>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setSelectedFile(null)}
              >
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={[styles.descriptionInput, { backgroundColor: `${textSecondary}15`, color: textColor }]}
            placeholder="Description (optionnel)"
            placeholderTextColor={textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={200}
          />

          <PrimaryButton
            title={isUploading ? 'Upload en cours...' : 'Uploader'}
            onPress={handleUpload}
            disabled={isUploading}
            style={styles.uploadButton}
          />

          {isUploading && (
            <ActivityIndicator
              size="small"
              color={BrandColors.primary[500]}
              style={styles.loader}
            />
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionHint: {
    fontSize: 13,
    marginTop: 2,
  },
  selectedFile: {
    gap: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 13,
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  descriptionInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  uploadButton: {
    marginTop: 8,
  },
  loader: {
    marginTop: 8,
  },
});
