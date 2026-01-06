import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { AIImageService } from '@/services/ai-image-service';
import { SectionService } from '@/services/section-service';
import { StorageService } from '@/src/shared/services/storage-service';
import { SECTION_LABELS, SECTION_EMOJIS, SectionType } from '@/types';

// Design System Colors
const colors = {
  primary: '#2D5A45',
  primaryLight: '#3d7a5a',
  accent: '#E07B4C',
  accentLight: '#FEF3EE',
  neutral: '#8B7E74',
  neutralLight: '#C4BBB3',
  dark: '#1A2E28',
  mist: '#E8EDE9',
  canvas: '#FDFCFB',
  cardBg: '#FFFFFF',
  danger: '#DC3545',
  success: '#28A745',
};

type LogoStyle = 'nature' | 'moderne' | 'classique';

export default function SectionLogoSetupScreen() {
  const params = useLocalSearchParams();
  const sectionId = params.sectionId as string;
  const sectionName = params.sectionName as string;
  const sectionType = params.sectionType as SectionType;

  const [selectedStyle, setSelectedStyle] = useState<LogoStyle>('nature');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const styles_options: { key: LogoStyle; label: string; description: string; emoji: string }[] = [
    {
      key: 'nature',
      label: 'Nature',
      description: 'Style organique avec des éléments naturels',
      emoji: '🌿',
    },
    {
      key: 'moderne',
      label: 'Moderne',
      description: 'Design épuré et minimaliste',
      emoji: '✨',
    },
    {
      key: 'classique',
      label: 'Classique',
      description: 'Style traditionnel scout',
      emoji: '⚜️',
    },
  ];

  const handleGenerateLogo = async () => {
    setIsGenerating(true);
    setGeneratedLogo(null);

    try {
      const result = await AIImageService.generateSectionLogoWithRetry(
        sectionType,
        sectionName,
        selectedStyle
      );

      if (result.success && result.imageBase64) {
        // Créer une URL data pour afficher l'image
        setGeneratedLogo(`data:image/png;base64,${result.imageBase64}`);
      } else {
        Alert.alert(
          'Erreur',
          result.error || 'Impossible de générer le logo. Réessayez plus tard.'
        );
      }
    } catch (error) {
      console.error('Erreur génération logo:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la génération.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveLogo = async () => {
    if (!generatedLogo || !sectionId) {
      console.log('❌ handleSaveLogo - données manquantes:', { generatedLogo: !!generatedLogo, sectionId });
      return;
    }

    console.log('🔄 Début sauvegarde logo pour section:', sectionId);
    setIsSaving(true);

    try {
      // Upload l'image vers Firebase Storage (utiliser uploadBase64Image pour les images base64)
      console.log('📤 Upload de l\'image base64...');
      const logoUrl = await StorageService.uploadBase64Image(
        generatedLogo,
        `sections/${sectionId}/logo_${Date.now()}.png`,
        'image/png'
      );
      console.log('✅ Image uploadée, URL:', logoUrl);

      // Mettre à jour la section avec l'URL du logo
      console.log('📝 Mise à jour de la section...');
      await SectionService.updateSection(sectionId, { logoUrl });
      console.log('✅ Section mise à jour avec succès');

      // Utiliser alert() pour le web au lieu de Alert.alert()
      if (Platform.OS === 'web') {
        alert('Logo enregistré ! Le logo de ta section a été sauvegardé avec succès.');
        router.replace('/(animator)/dashboard');
      } else {
        Alert.alert(
          'Logo enregistré !',
          'Le logo de ta section a été sauvegardé avec succès.',
          [
            {
              text: 'Continuer',
              onPress: () => router.replace('/(animator)/dashboard'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde logo:', error);
      if (Platform.OS === 'web') {
        alert('Erreur: Impossible de sauvegarder le logo.');
      } else {
        Alert.alert('Erreur', 'Impossible de sauvegarder le logo.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    if (Platform.OS === 'web') {
      if (confirm('Passer cette étape ? Tu pourras toujours personnaliser le logo plus tard depuis les paramètres.')) {
        router.replace('/(animator)/dashboard');
      }
    } else {
      Alert.alert(
        'Passer cette étape ?',
        'Tu pourras toujours personnaliser le logo plus tard depuis les paramètres.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Passer',
            onPress: () => router.replace('/(animator)/dashboard'),
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <ThemedText style={styles.sectionEmoji}>
              {SECTION_EMOJIS[sectionType] || '🏕️'}
            </ThemedText>
          </View>
          <ThemedText style={styles.title}>Personnalise ta section</ThemedText>
          <ThemedText style={styles.subtitle}>
            Génère un logo unique pour {sectionName} avec l'IA
          </ThemedText>
        </View>

        {/* Section Info */}
        <View style={styles.sectionInfoCard}>
          <ThemedText style={styles.sectionInfoLabel}>Section</ThemedText>
          <ThemedText style={styles.sectionInfoName}>{sectionName}</ThemedText>
          <ThemedText style={styles.sectionInfoType}>
            {SECTION_LABELS[sectionType] || sectionType}
          </ThemedText>
        </View>

        {/* Style Selection */}
        <View style={styles.styleSection}>
          <ThemedText style={styles.styleSectionTitle}>Choisis un style</ThemedText>
          <View style={styles.styleOptions}>
            {styles_options.map((style) => (
              <TouchableOpacity
                key={style.key}
                style={[
                  styles.styleOption,
                  selectedStyle === style.key && styles.styleOptionActive,
                ]}
                onPress={() => setSelectedStyle(style.key)}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.styleOptionEmoji}>{style.emoji}</ThemedText>
                <ThemedText
                  style={[
                    styles.styleOptionLabel,
                    selectedStyle === style.key && styles.styleOptionLabelActive,
                  ]}
                >
                  {style.label}
                </ThemedText>
                <ThemedText style={styles.styleOptionDesc}>{style.description}</ThemedText>
                {selectedStyle === style.key && (
                  <View style={styles.styleOptionCheck}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={handleGenerateLogo}
          disabled={isGenerating}
          activeOpacity={0.8}
        >
          {isGenerating ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <ThemedText style={styles.generateButtonText}>Génération en cours...</ThemedText>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              <ThemedText style={styles.generateButtonText}>
                {generatedLogo ? 'Régénérer le logo' : 'Générer le logo avec l\'IA'}
              </ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* Generated Logo Preview */}
        {generatedLogo && (
          <View style={styles.previewSection}>
            <ThemedText style={styles.previewTitle}>Aperçu du logo</ThemedText>
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: generatedLogo }}
                style={styles.previewImage}
                contentFit="contain"
              />
            </View>

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={handleGenerateLogo}
                disabled={isGenerating}
              >
                <Ionicons name="refresh" size={18} color={colors.primary} />
                <ThemedText style={styles.regenerateButtonText}>Autre proposition</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSaveLogo}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    <ThemedText style={styles.saveButtonText}>Valider ce logo</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <ThemedText style={styles.skipButtonText}>Passer cette étape</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sectionEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.neutral,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Section Info Card
  sectionInfoCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  sectionInfoLabel: {
    fontSize: 12,
    color: colors.neutral,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionInfoName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 4,
  },
  sectionInfoType: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },

  // Style Section
  styleSection: {
    marginBottom: 24,
  },
  styleSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 12,
  },
  styleOptions: {
    gap: 12,
  },
  styleOption: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.mist,
    position: 'relative',
  },
  styleOptionActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  styleOptionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  styleOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 4,
  },
  styleOptionLabelActive: {
    color: colors.primary,
  },
  styleOptionDesc: {
    fontSize: 13,
    color: colors.neutral,
  },
  styleOptionCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  // Generate Button
  generateButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  generateButtonDisabled: {
    backgroundColor: colors.neutralLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Preview Section
  previewSection: {
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  previewContainer: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mist,
    marginBottom: 16,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  regenerateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.canvas,
  },
  regenerateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: {
    backgroundColor: colors.neutralLight,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Skip Button
  skipButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.neutral,
  },
});
