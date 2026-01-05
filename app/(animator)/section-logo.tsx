import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
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
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { AIImageService } from '@/services/ai-image-service';
import { SectionService } from '@/services/section-service';
import { StorageService } from '@/src/shared/services/storage-service';
import { SECTION_LABELS, SECTION_EMOJIS, SectionType, Animator, Section } from '@/types';
import { BrandColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type LogoStyle = 'nature' | 'moderne' | 'classique';

export default function SectionLogoScreen() {
  const { user } = useAuth();
  const animator = user as Animator;
  const [section, setSection] = useState<Section | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<LogoStyle>('nature');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

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

  useEffect(() => {
    loadSection();
  }, [animator?.sectionId, animator?.unitId]);

  const loadSection = async () => {
    try {
      // Si l'animateur a un sectionId, charger directement cette section
      if (animator?.sectionId) {
        const sectionData = await SectionService.getSectionById(animator.sectionId);
        setSection(sectionData);
      }
      // Sinon, chercher les sections de l'unité
      else if (animator?.unitId) {
        const sections = await SectionService.getSectionsByUnit(animator.unitId);
        if (sections.length > 0) {
          // Prendre la première section de l'unité
          setSection(sections[0]);
        }
      }
    } catch (error) {
      console.error('Erreur chargement section:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (title: string, message: string, onPress?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      onPress?.();
    } else {
      Alert.alert(title, message, [{ text: 'OK', onPress }]);
    }
  };

  const handleGenerateLogo = async () => {
    if (!section) return;

    setIsGenerating(true);
    setGeneratedLogo(null);

    try {
      const result = await AIImageService.generateSectionLogoWithRetry(
        section.sectionType,
        section.name,
        selectedStyle
      );

      if (result.success && result.imageBase64) {
        setGeneratedLogo(`data:image/png;base64,${result.imageBase64}`);
      } else {
        showAlert(
          'Erreur',
          result.error || 'Impossible de générer le logo. Réessayez plus tard.'
        );
      }
    } catch (error) {
      console.error('Erreur génération logo:', error);
      showAlert('Erreur', 'Une erreur est survenue lors de la génération.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveLogo = async () => {
    if (!generatedLogo || !section) return;

    setIsSaving(true);

    try {
      // Utiliser uploadBase64Image pour les images générées par l'IA
      const logoUrl = await StorageService.uploadBase64Image(
        generatedLogo,
        `sections/${section.id}/logo_${Date.now()}.png`,
        'image/png'
      );

      await SectionService.updateSection(section.id, { logoUrl });

      showAlert(
        'Logo enregistré !',
        'Le logo de ta section a été sauvegardé avec succès.',
        () => router.back()
      );
    } catch (error) {
      console.error('Erreur sauvegarde logo:', error);
      showAlert('Erreur', 'Impossible de sauvegarder le logo.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary[500]} />
          <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
            Chargement...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!section) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="images-outline" size={48} color={textSecondary} />
          <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
            Aucune section disponible
          </ThemedText>
          <ThemedText style={[styles.loadingSubtext, { color: textSecondary }]}>
            Demandez à un administrateur WeCamp de créer une section pour votre unité.
          </ThemedText>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: BrandColors.primary[500] }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Retour</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={[styles.title, { color: BrandColors.primary[600] }]}>
            Logo de la section
          </ThemedText>
        </View>

        {/* Current Logo */}
        {section.logoUrl && (
          <View style={[styles.currentLogoCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            <ThemedText style={[styles.currentLogoLabel, { color: textSecondary }]}>
              Logo actuel
            </ThemedText>
            <Image
              source={{ uri: section.logoUrl }}
              style={styles.currentLogoImage}
              contentFit="contain"
            />
          </View>
        )}

        {/* Section Info */}
        <View style={[styles.sectionInfoCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
          <View style={styles.sectionInfoHeader}>
            <ThemedText style={styles.sectionEmoji}>
              {SECTION_EMOJIS[section.sectionType as SectionType] || '🏕️'}
            </ThemedText>
            <View style={styles.sectionInfoText}>
              <ThemedText style={[styles.sectionInfoName, { color: textColor }]}>
                {section.name}
              </ThemedText>
              <ThemedText style={[styles.sectionInfoType, { color: BrandColors.primary[500] }]}>
                {SECTION_LABELS[section.sectionType as SectionType] || section.sectionType}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Style Selection */}
        <View style={styles.styleSection}>
          <ThemedText style={[styles.styleSectionTitle, { color: textColor }]}>
            Choisis un style
          </ThemedText>
          <View style={styles.styleOptions}>
            {styles_options.map((style) => (
              <TouchableOpacity
                key={style.key}
                style={[
                  styles.styleOption,
                  { backgroundColor: cardColor, borderColor: cardBorder },
                  selectedStyle === style.key && styles.styleOptionActive,
                ]}
                onPress={() => setSelectedStyle(style.key)}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.styleOptionEmoji}>{style.emoji}</ThemedText>
                <ThemedText
                  style={[
                    styles.styleOptionLabel,
                    { color: textColor },
                    selectedStyle === style.key && styles.styleOptionLabelActive,
                  ]}
                >
                  {style.label}
                </ThemedText>
                <ThemedText style={[styles.styleOptionDesc, { color: textSecondary }]}>
                  {style.description}
                </ThemedText>
                {selectedStyle === style.key && (
                  <View style={styles.styleOptionCheck}>
                    <Ionicons name="checkmark-circle" size={20} color={BrandColors.primary[500]} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            { backgroundColor: BrandColors.accent[500] },
            isGenerating && styles.generateButtonDisabled,
          ]}
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
                {generatedLogo ? 'Régénérer le logo' : 'Générer un nouveau logo avec l\'IA'}
              </ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* Generated Logo Preview */}
        {generatedLogo && (
          <View style={styles.previewSection}>
            <ThemedText style={[styles.previewTitle, { color: textColor }]}>
              Aperçu du nouveau logo
            </ThemedText>
            <View style={[styles.previewContainer, { backgroundColor: cardColor, borderColor: cardBorder }]}>
              <Image
                source={{ uri: generatedLogo }}
                style={styles.previewImage}
                contentFit="contain"
              />
            </View>

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.regenerateButton, { borderColor: BrandColors.primary[500] }]}
                onPress={handleGenerateLogo}
                disabled={isGenerating}
              >
                <Ionicons name="refresh" size={18} color={BrandColors.primary[500]} />
                <ThemedText style={[styles.regenerateButtonText, { color: BrandColors.primary[500] }]}>
                  Autre proposition
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: BrandColors.primary[500] },
                  isSaving && styles.saveButtonDisabled,
                ]}
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
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  backArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },

  // Current Logo
  currentLogoCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  currentLogoLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  currentLogoImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },

  // Section Info Card
  sectionInfoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  sectionInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionEmoji: {
    fontSize: 32,
  },
  sectionInfoText: {
    flex: 1,
  },
  sectionInfoName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionInfoType: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Style Section
  styleSection: {
    marginBottom: 24,
  },
  styleSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  styleOptions: {
    gap: 12,
  },
  styleOption: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    position: 'relative',
  },
  styleOptionActive: {
    borderColor: BrandColors.primary[500],
    backgroundColor: `${BrandColors.primary[500]}08`,
  },
  styleOptionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  styleOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  styleOptionLabelActive: {
    color: BrandColors.primary[500],
  },
  styleOptionDesc: {
    fontSize: 13,
  },
  styleOptionCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  // Generate Button
  generateButton: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    shadowColor: '#E07B4C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  generateButtonDisabled: {
    backgroundColor: '#C4BBB3',
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
    marginBottom: 12,
    textAlign: 'center',
  },
  previewContainer: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
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
  },
  regenerateButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 14,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#C4BBB3',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
