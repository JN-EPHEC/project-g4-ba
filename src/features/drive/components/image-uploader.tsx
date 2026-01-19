import React, { useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { DriveService } from '@/src/shared/services/drive-service';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

export interface ImageUploaderProps {
  folderId: string;
  unitId: string;
  userId: string;
  onUploadComplete: () => void;
  onCancel: () => void;
}

export function ImageUploader({
  folderId,
  unitId,
  userId,
  onUploadComplete,
  onCancel,
}: ImageUploaderProps) {
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    name: string;
    mimeType: string;
  } | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de l\'accès à vos photos pour ajouter des images.'
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
        setSelectedImage({
          uri: asset.uri,
          name: fileName,
          mimeType: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const takePhoto = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de l\'accès à la caméra pour prendre une photo.'
        );
        return;
      }
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = `photo_${Date.now()}.jpg`;
        setSelectedImage({
          uri: asset.uri,
          name: fileName,
          mimeType: 'image/jpeg',
        });
      }
    } catch (error) {
      console.error('Erreur prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setIsUploading(true);
    try {
      // Récupérer le blob de l'image
      const response = await fetch(selectedImage.uri);
      const blob = await response.blob();

      await DriveService.uploadFileFromBlob(
        blob,
        selectedImage.name,
        selectedImage.mimeType,
        blob.size,
        folderId,
        unitId,
        userId,
        description || undefined
      );

      Alert.alert('Succès', 'Photo ajoutée avec succès !');
      onUploadComplete();
    } catch (error: any) {
      console.error('Erreur upload:', error);
      Alert.alert('Erreur', error?.message || 'Impossible d\'ajouter la photo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card style={[styles.card, { backgroundColor: cardColor }]}>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: textColor }]}>Ajouter une photo</ThemedText>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={textSecondary} />
        </TouchableOpacity>
      </View>

      {!selectedImage ? (
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionButton} onPress={pickImage}>
            <View style={[styles.optionIcon, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
              <Ionicons name="images" size={32} color={BrandColors.primary[500]} />
            </View>
            <ThemedText style={[styles.optionText, { color: textColor }]}>
              Choisir depuis la galerie
            </ThemedText>
          </TouchableOpacity>

          {Platform.OS !== 'web' && (
            <TouchableOpacity style={styles.optionButton} onPress={takePhoto}>
              <View style={[styles.optionIcon, { backgroundColor: `${BrandColors.secondary[500]}15` }]}>
                <Ionicons name="camera" size={32} color={BrandColors.secondary[500]} />
              </View>
              <ThemedText style={[styles.optionText, { color: textColor }]}>
                Prendre une photo
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.selectedFile}>
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close-circle" size={28} color="#ef4444" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.descriptionInput, { color: textColor, backgroundColor: `${textSecondary}15` }]}
            placeholder="Description (optionnel)"
            placeholderTextColor={textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={200}
          />

          <PrimaryButton
            title={isUploading ? 'Envoi en cours...' : 'Ajouter la photo'}
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
    borderColor: '#e5e5e5',
    gap: 16,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
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
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
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
