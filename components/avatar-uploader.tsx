import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Avatar } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { StorageService } from '@/services/storage-service';

interface AvatarUploaderProps {
  currentAvatarUrl?: string;
  userName?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  onUploadComplete?: (url: string) => void;
  editable?: boolean;
}

export function AvatarUploader({
  currentAvatarUrl,
  userName,
  size = 'large',
  onUploadComplete,
  editable = true,
}: AvatarUploaderProps) {
  const { user, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const iconColor = useThemeColor({}, 'icon');

  const pickImage = async () => {
    if (!editable) return;

    try {
      // Demander les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre permission pour accéder à vos photos.'
        );
        return;
      }

      // Ouvrir le sélecteur d'images
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const takePhoto = async () => {
    if (!editable) return;

    try {
      // Demander les permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre permission pour accéder à votre appareil photo.'
        );
        return;
      }

      // Ouvrir l'appareil photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre une photo');
    }
  };

  const uploadImage = async (localUri: string) => {
    if (!user?.id) return;

    try {
      setIsUploading(true);

      // Upload l'image vers Firebase Storage
      const downloadURL = await StorageService.uploadAvatar(user.id, localUri);

      // Mettre à jour le profil utilisateur
      await updateUser({ profilePicture: downloadURL });

      setAvatarUrl(downloadURL);
      onUploadComplete?.(downloadURL);

      Alert.alert('Succès', 'Votre photo de profil a été mise à jour');
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour votre photo de profil');
    } finally {
      setIsUploading(false);
    }
  };

  const showImagePickerOptions = () => {
    if (!editable || isUploading) return;

    Alert.alert(
      'Changer la photo de profil',
      'Choisissez une option',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Prendre une photo', onPress: takePhoto },
        { text: 'Choisir depuis la galerie', onPress: pickImage },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={showImagePickerOptions}
        disabled={!editable || isUploading}
        style={styles.avatarContainer}
      >
        <Avatar
          name={userName}
          imageUrl={avatarUrl || currentAvatarUrl}
          size={size}
        />
        {isUploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
        {editable && !isUploading && (
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

