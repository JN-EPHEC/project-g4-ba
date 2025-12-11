import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  Modal,
  Text,
  Pressable,
} from 'react-native';

import { Avatar } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { StorageService } from '@/services/storage-service';
import { BrandColors } from '@/constants/theme';
import { Spacing, Radius } from '@/constants/design-tokens';

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
  const [showMenu, setShowMenu] = useState(false);
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Ref pour l'input file web
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const pickImage = async () => {
    if (!editable) return;
    setShowMenu(false);

    try {
      // Sur le web, utiliser l'input file natif
      if (Platform.OS === 'web') {
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
        return;
      }

      // Sur mobile, utiliser expo-image-picker
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre permission pour accéder à vos photos.'
        );
        return;
      }

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
      showAlert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  // Handler pour le changement de fichier sur web
  const handleWebFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Créer une URL blob pour le fichier
      const localUri = URL.createObjectURL(file);
      await uploadImage(localUri);
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      showAlert('Erreur', 'Impossible de sélectionner l\'image');
    }

    // Reset l'input pour permettre de sélectionner le même fichier
    if (event.target) {
      event.target.value = '';
    }
  };

  const takePhoto = async () => {
    if (!editable) return;
    setShowMenu(false);

    // La prise de photo n'est pas disponible sur le web
    if (Platform.OS === 'web') {
      showAlert('Non disponible', 'La prise de photo n\'est pas disponible sur le web. Utilisez "Choisir une photo" à la place.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre permission pour accéder à votre appareil photo.'
        );
        return;
      }

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
      showAlert('Erreur', 'Impossible de prendre une photo');
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

      showAlert('Succès', 'Votre photo de profil a été mise à jour');
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      showAlert('Erreur', 'Impossible de mettre à jour votre photo de profil');
    } finally {
      setIsUploading(false);
    }
  };

  // Fonction d'alerte compatible web/mobile
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const showImagePickerOptions = () => {
    if (!editable || isUploading) return;

    if (Platform.OS === 'web') {
      // Sur le web, afficher un menu modal personnalisé
      setShowMenu(true);
    } else {
      // Sur mobile, utiliser Alert.alert
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
    }
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
          <View style={[styles.editBadge, { backgroundColor: BrandColors.primary[500] }]}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {/* Input file caché pour le web */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef as any}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleWebFileChange as any}
        />
      )}

      {/* Menu modal pour le web */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            <Text style={[styles.menuTitle, { color: textColor }]}>
              Changer la photo de profil
            </Text>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: cardBorder }]}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Ionicons name="images" size={22} color={BrandColors.primary[500]} />
              <Text style={[styles.menuItemText, { color: textColor }]}>
                Choisir une photo
              </Text>
            </TouchableOpacity>

            {Platform.OS !== 'web' && (
              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: cardBorder }]}
                onPress={takePhoto}
                activeOpacity={0.7}
              >
                <Ionicons name="camera" size={22} color={BrandColors.primary[500]} />
                <Text style={[styles.menuItemText, { color: textColor }]}>
                  Prendre une photo
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowMenu(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: textSecondary }]}>
                Annuler
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
    borderRadius: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  menuContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
