import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types';
import { BrandColors } from '@/constants/theme';
import { TOTEM_ANIMALS } from '@/components/totem-selector';
import { AIImageService } from '@/services/ai-image-service';

type GenerationState = 'idle' | 'generating' | 'success' | 'error';

export default function TotemSetupScreen() {
  const params = useLocalSearchParams();
  const { register, isLoading: authLoading } = useAuth();

  // Mode custom ou sélection
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Animal custom
  const [customAnimalName, setCustomAnimalName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('');
  const [customTraits, setCustomTraits] = useState('');

  // Animal sélectionné dans la liste
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [selectedTraits, setSelectedTraits] = useState<string>('');

  // Génération d'image IA
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Recherche
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer les animaux
  const filteredAnimals = searchQuery
    ? TOTEM_ANIMALS.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.traits.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : TOTEM_ANIMALS;

  // Mettre à jour les infos quand un animal est sélectionné
  useEffect(() => {
    if (selectedAnimal) {
      const animal = TOTEM_ANIMALS.find((a) => a.name === selectedAnimal);
      if (animal) {
        setSelectedEmoji(animal.emoji);
        setSelectedTraits(animal.traits);
      }
    }
  }, [selectedAnimal]);

  // Récupérer le nom et les traits de l'animal actuel
  const getCurrentAnimalName = () => {
    if (isCustomMode && customAnimalName) {
      return customAnimalName;
    }
    return selectedAnimal || '';
  };

  const getCurrentTraits = () => {
    if (isCustomMode) {
      return customTraits;
    }
    return selectedTraits;
  };

  const getCurrentEmoji = () => {
    if (isCustomMode) {
      return customEmoji || '🐾';
    }
    return selectedEmoji || '🐾';
  };

  // Générer l'image IA
  const handleGenerateImage = async () => {
    const animalName = getCurrentAnimalName();
    const traits = getCurrentTraits();

    if (!animalName) {
      Alert.alert('Erreur', "Veuillez d'abord choisir ou créer un animal totem");
      return;
    }

    setGenerationState('generating');
    setErrorMessage('');

    const result = await AIImageService.generateTotemImageWithRetry(animalName, traits);

    if (result.success && result.imageBase64 && result.imageUrl) {
      setGeneratedImageBase64(result.imageBase64);
      setGeneratedImageUrl(result.imageUrl);
      setGenerationState('success');
    } else {
      setErrorMessage(result.error || 'Erreur lors de la génération');
      setGenerationState('error');
    }
  };

  // Créer le compte
  const handleFinish = async () => {
    const animalName = getCurrentAnimalName();
    const emoji = getCurrentEmoji();
    const traits = getCurrentTraits();

    try {
      const dateOfBirth = params.dateOfBirth ? new Date(params.dateOfBirth as string) : new Date();

      await register(
        params.email as string,
        params.password as string,
        params.firstName as string,
        params.lastName as string,
        UserRole.SCOUT,
        params.unitId as string,
        dateOfBirth,
        animalName
          ? {
              totemAnimal: animalName,
              totemEmoji: emoji,
              totemTraits: traits,
              totemImageUrl: generatedImageUrl || undefined,
            }
          : undefined
      );

      router.push('/(auth)/pending-approval');
    } catch (error: any) {
      console.error('Erreur inscription:', error);
      Alert.alert('Erreur', error?.message || 'Impossible de créer ton compte');
    }
  };

  // Passer cette étape
  const handleSkip = async () => {
    try {
      const dateOfBirth = params.dateOfBirth ? new Date(params.dateOfBirth as string) : new Date();

      await register(
        params.email as string,
        params.password as string,
        params.firstName as string,
        params.lastName as string,
        UserRole.SCOUT,
        params.unitId as string,
        dateOfBirth
      );

      router.push('/(auth)/pending-approval');
    } catch (error: any) {
      console.error('Erreur inscription:', error);
      Alert.alert('Erreur', error?.message || 'Impossible de créer ton compte');
    }
  };

  const hasAnimal = isCustomMode ? !!customAnimalName : !!selectedAnimal;
  const isGenerating = generationState === 'generating';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <ThemedText style={styles.logoEmoji}>🐾</ThemedText>
        </View>
        <ThemedText style={styles.headerTitle}>Choisis ton totem</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Ton animal totem te représentera dans l'application
        </ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Toggle Mode Custom */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="create-outline" size={20} color={BrandColors.accent[500]} />
              <ThemedText style={styles.toggleLabel}>Créer mon propre animal</ThemedText>
            </View>
            <Switch
              value={isCustomMode}
              onValueChange={setIsCustomMode}
              trackColor={{ false: '#E5E7EB', true: BrandColors.accent[200] }}
              thumbColor={isCustomMode ? BrandColors.accent[500] : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Mode Custom */}
        {isCustomMode && (
          <View style={styles.customSection}>
            {/* Nom de l'animal */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Nom de l'animal</ThemedText>
              <View style={styles.inputWrapper}>
                <Ionicons name="paw-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Dragon, Phénix, Licorne..."
                  placeholderTextColor="#6B7280"
                  value={customAnimalName}
                  onChangeText={setCustomAnimalName}
                />
              </View>
            </View>

            {/* Emoji */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Emoji</ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.emojiInput]}
                  placeholder="🐉"
                  placeholderTextColor="#6B7280"
                  value={customEmoji}
                  onChangeText={(text) => {
                    // Garder seulement le premier emoji (qui peut faire plusieurs caractères)
                    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u;
                    const match = text.match(emojiRegex);
                    setCustomEmoji(match ? match[0] : text.slice(0, 4));
                  }}
                />
              </View>
            </View>

            {/* Traits */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Traits / Qualités</ThemedText>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Ex: Force, sagesse, protection..."
                  placeholderTextColor="#6B7280"
                  value={customTraits}
                  onChangeText={setCustomTraits}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>
          </View>
        )}

        {/* Mode Sélection */}
        {!isCustomMode && (
          <View style={styles.selectionSection}>
            {/* Barre de recherche */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un animal..."
                placeholderTextColor="#6B7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Grille des animaux */}
            <View style={styles.animalsGrid}>
              {filteredAnimals.slice(0, 12).map((animal) => {
                const isSelected = selectedAnimal === animal.name;
                return (
                  <TouchableOpacity
                    key={animal.id}
                    style={[
                      styles.animalCard,
                      isSelected && styles.animalCardSelected,
                    ]}
                    onPress={() => setSelectedAnimal(animal.name)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.animalEmoji,
                        isSelected && { backgroundColor: `${BrandColors.accent[500]}20` },
                      ]}
                    >
                      <ThemedText style={styles.animalEmojiText}>{animal.emoji}</ThemedText>
                    </View>
                    <ThemedText
                      style={[styles.animalName, isSelected && styles.animalNameSelected]}
                      numberOfLines={1}
                    >
                      {animal.name}
                    </ThemedText>
                    {isSelected && (
                      <View style={styles.checkmark}>
                        <Ionicons name="checkmark-circle" size={18} color={BrandColors.accent[500]} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {filteredAnimals.length > 12 && (
              <ThemedText style={styles.moreText}>
                + {filteredAnimals.length - 12} autres animaux disponibles
              </ThemedText>
            )}
          </View>
        )}

        {/* Section Génération IA */}
        {hasAnimal && (
          <View style={styles.aiSection}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={20} color={BrandColors.accent[500]} />
              <ThemedText style={styles.aiTitle}>Générer un avatar IA</ThemedText>
            </View>

            <View style={styles.aiContent}>
              {/* Preview de l'image */}
              <View style={styles.imagePreview}>
                {isGenerating ? (
                  <View style={styles.imagePlaceholder}>
                    <ActivityIndicator size="large" color={BrandColors.accent[500]} />
                  </View>
                ) : generatedImageBase64 ? (
                  <Image
                    source={{ uri: generatedImageBase64 }}
                    style={styles.generatedImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <ThemedText style={styles.placeholderEmoji}>{getCurrentEmoji()}</ThemedText>
                  </View>
                )}
              </View>

              {/* Boutons */}
              <View style={styles.aiActions}>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={handleGenerateImage}
                  disabled={isGenerating}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      isGenerating
                        ? ['#9CA3AF', '#9CA3AF']
                        : [BrandColors.accent[400], BrandColors.accent[500]]
                    }
                    style={styles.generateGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons
                      name={generatedImageBase64 ? 'refresh' : 'sparkles-outline'}
                      size={18}
                      color="#FFFFFF"
                    />
                    <ThemedText style={styles.generateText}>
                      {isGenerating
                        ? 'Génération...'
                        : generatedImageBase64
                          ? 'Régénérer'
                          : 'Générer'}
                    </ThemedText>
                  </LinearGradient>
                </TouchableOpacity>

                <ThemedText style={styles.aiDescription}>
                  {isGenerating
                    ? 'Cela peut prendre 10-30 secondes...'
                    : "Génère une image unique de ton totem grâce à l'IA"}
                </ThemedText>
              </View>
            </View>

            {/* Message d'erreur */}
            {generationState === 'error' && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Boutons d'action */}
        <View style={styles.actions}>
          <PrimaryButton
            title={authLoading ? 'Création du compte...' : 'Continuer'}
            onPress={handleFinish}
            disabled={authLoading}
            style={styles.continueButton}
          />

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip} disabled={authLoading}>
            <ThemedText style={styles.skipText}>Passer cette étape</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  header: {
    backgroundColor: BrandColors.primary[500],
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 8,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoEmoji: {
    fontSize: 36,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  toggleContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  customSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  emojiInput: {
    fontSize: 24,
    textAlign: 'center',
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  selectionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  animalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  animalCard: {
    width: '31%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  animalCardSelected: {
    borderColor: BrandColors.accent[500],
    backgroundColor: `${BrandColors.accent[500]}08`,
  },
  animalEmoji: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  animalEmojiText: {
    fontSize: 24,
  },
  animalName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  animalNameSelected: {
    color: BrandColors.accent[600],
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  moreText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
  aiSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  aiContent: {
    flexDirection: 'row',
    gap: 16,
  },
  aiInfoContent: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  infoBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: `${BrandColors.primary[500]}10`,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: BrandColors.primary[500],
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: BrandColors.primary[700],
    lineHeight: 18,
  },
  imagePreview: {
    width: 100,
    height: 100,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  generatedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  aiActions: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
  generateButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  generateText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  aiDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
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
  actions: {
    marginTop: 8,
  },
  continueButton: {
    marginBottom: 12,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 15,
    color: '#6B7280',
  },
});
