import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { AIImageService } from '@/services/ai-image-service';
import { TOTEM_ANIMALS } from '@/components/totem-selector';

interface TotemImageGeneratorProps {
  animalName: string;
  userId: string;
  currentTotemImage?: string;
  onImageGenerated: (imageUrl: string) => void;
}

type GenerationState = 'idle' | 'generating' | 'preview' | 'saving' | 'error';

export function TotemImageGenerator({
  animalName,
  userId,
  currentTotemImage,
  onImageGenerated,
}: TotemImageGeneratorProps) {
  const [state, setState] = useState<GenerationState>('idle');
  const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Trouver les traits de l'animal
  const animal = TOTEM_ANIMALS.find(
    (a) => a.name.toLowerCase() === animalName.toLowerCase()
  );
  const traits = animal?.traits || '';
  const animalEmoji = animal?.emoji || '🐾';

  // Réinitialiser l'image générée quand l'animal change
  useEffect(() => {
    setGeneratedImageBase64(null);
    setGeneratedImageUrl(null);
    setState('idle');
    setErrorMessage('');
  }, [animalName]);

  // Fonction d'alerte cross-platform
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleGenerateImage = async () => {
    setState('generating');
    setErrorMessage('');

    const result = await AIImageService.generateTotemImageWithRetry(animalName, traits);

    if (result.success && result.imageBase64 && result.imageUrl) {
      // La Cloud Function a déjà uploadé l'image vers Firebase Storage
      setGeneratedImageBase64(result.imageBase64);
      setGeneratedImageUrl(result.imageUrl);
      setState('preview');
    } else {
      setErrorMessage(result.error || 'Erreur inconnue');
      setState('error');
    }
  };

  const handleRegenerate = async () => {
    setState('generating');
    setErrorMessage('');

    const result = await AIImageService.generateTotemImageWithRetry(animalName, traits);

    if (result.success && result.imageBase64 && result.imageUrl) {
      // La Cloud Function a déjà uploadé l'image vers Firebase Storage
      setGeneratedImageBase64(result.imageBase64);
      setGeneratedImageUrl(result.imageUrl);
      setState('preview');
    } else {
      setErrorMessage(result.error || 'Erreur inconnue');
      setState('error');
    }
  };

  const handleUseAsAvatar = async () => {
    if (!generatedImageUrl) return;

    setState('saving');

    try {
      // L'image est déjà dans Firebase Storage (uploadée par la Cloud Function)
      // On notifie simplement le parent avec l'URL
      onImageGenerated(generatedImageUrl);

      setState('idle');

      showAlert('Succès', 'Ton badge totem a été défini comme photo de profil !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setErrorMessage('Erreur lors de la sauvegarde');
      setState('error');
    }
  };

  // Image à afficher (seulement l'image générée dans cette session)
  // On n'affiche PAS currentTotemImage car c'est l'ancienne photo de profil
  const displayImage = generatedImageBase64;

  // État de chargement
  const isLoading = state === 'generating' || state === 'saving';

  return (
    <View style={[styles.container, { backgroundColor: cardColor, borderColor: cardBorder }]}>
      <ThemedText style={[styles.title, { color: textColor }]}>
        Image totem (IA)
      </ThemedText>

      <View style={styles.content}>
        {/* Image preview */}
        <View style={styles.imageSection}>
          {isLoading ? (
            <View style={[styles.imagePlaceholder, { backgroundColor: `${textSecondary}20` }]}>
              <ActivityIndicator size="large" color={BrandColors.accent[500]} />
            </View>
          ) : displayImage ? (
            <Image
              source={{ uri: displayImage }}
              style={styles.totemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: `${textSecondary}20` }]}>
              <ThemedText style={styles.placeholderEmoji}>{animalEmoji}</ThemedText>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          {/* Bouton Régénérer */}
          <TouchableOpacity
            style={[styles.regenerateButton]}
            onPress={state === 'preview' || generatedImageBase64 ? handleRegenerate : handleGenerateImage}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isLoading ? ['#9CA3AF', '#9CA3AF'] : [BrandColors.accent[400], BrandColors.accent[500]]}
              style={styles.regenerateGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons
                name={displayImage ? "sparkles" : "sparkles-outline"}
                size={18}
                color="#FFFFFF"
              />
              <ThemedText style={styles.regenerateText}>
                {isLoading ? 'Génération...' : (displayImage ? 'Régénérer' : 'Générer')}
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          {/* Description */}
          <ThemedText style={[styles.description, { color: textSecondary }]}>
            {isLoading
              ? 'Cela peut prendre 10-30 sec...'
              : 'Génère une image unique de ton animal totem grâce à l\'intelligence artificielle'
            }
          </ThemedText>

          {/* Bouton utiliser comme avatar (visible seulement après génération) */}
          {state === 'preview' && generatedImageUrl && (
            <TouchableOpacity
              style={[styles.useAsAvatarButton, { borderColor: BrandColors.primary[500] }]}
              onPress={handleUseAsAvatar}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={18} color={BrandColors.primary[500]} />
              <ThemedText style={[styles.useAsAvatarText, { color: BrandColors.primary[500] }]}>
                Utiliser comme avatar
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Message d'erreur */}
      {state === 'error' && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#DC2626" />
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    gap: 16,
  },
  imageSection: {
    width: 100,
    height: 100,
  },
  totemImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  actionsSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
  regenerateButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  regenerateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  regenerateText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
  useAsAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
  },
  useAsAvatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
  },
});
