import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { DriveService } from '@/src/shared/services/drive-service';

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
  } | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pour le web, utiliser un input file natif
  const handleWebFileSelect = () => {
    if (Platform.OS !== 'web') return;

    // Créer un input file caché si nécessaire
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';
      input.accept = '*/*';
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          setSelectedFile({
            uri: URL.createObjectURL(file),
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            file: file, // Stocker le File pour l'upload
          });
        }
      };
      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    fileInputRef.current.click();
  };

  const handleSelectFile = async () => {
    // Sur le web, utiliser l'input file natif
    if (Platform.OS === 'web') {
      handleWebFileSelect();
      return;
    }

    // Sur mobile, utiliser expo-document-picker
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
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
    <Card style={styles.card}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Ajouter un fichier</ThemedText>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      {!selectedFile ? (
        <TouchableOpacity style={styles.dropZone} onPress={handleSelectFile}>
          <Ionicons name="cloud-upload-outline" size={48} color="#3b82f6" />
          <ThemedText style={styles.dropZoneText}>
            Appuyez pour sélectionner un fichier
          </ThemedText>
          <ThemedText style={styles.dropZoneHint}>
            PDF, Images, Documents...
          </ThemedText>
        </TouchableOpacity>
      ) : (
        <View style={styles.selectedFile}>
          <View style={styles.fileInfo}>
            <Ionicons name="document" size={32} color="#3b82f6" />
            <View style={styles.fileDetails}>
              <ThemedText style={styles.fileName} numberOfLines={1}>
                {selectedFile.name}
              </ThemedText>
              <ThemedText style={styles.fileSize}>
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

          <TextInput
            style={styles.descriptionInput}
            placeholder="Description (optionnel)"
            placeholderTextColor="#666"
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
              color="#3b82f6"
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
  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#3b82f6',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  dropZoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  dropZoneHint: {
    color: '#666',
    fontSize: 13,
  },
  selectedFile: {
    gap: 16,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A3A',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  fileSize: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  descriptionInput: {
    backgroundColor: '#3A3A3A',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
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
