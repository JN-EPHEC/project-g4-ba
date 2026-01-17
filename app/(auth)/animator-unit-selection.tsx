import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { UserRole, SECTION_LABELS, SECTION_EMOJIS, isValidSectionCode, isValidUnitCode, extractPrefixFromCode, getSectionTypeFromPrefix } from '@/types';
import { SectionService } from '@/services/section-service';
import { UnitService } from '@/services/unit-service';

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

export default function AnimatorUnitSelectionScreen() {
  const params = useLocalSearchParams();
  const { register, isLoading: authLoading } = useAuth();
  const [accessCode, setAccessCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  // Type 'section' ou 'unit' selon le code
  const [codeType, setCodeType] = useState<'section' | 'unit' | null>(null);
  const [foundSection, setFoundSection] = useState<{
    id: string;
    name: string;
    sectionType: string;
    unitId: string;
    unitName: string;
  } | null>(null);
  const [foundUnit, setFoundUnit] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCodeChange = async (text: string) => {
    const formattedCode = text.toUpperCase();
    setAccessCode(formattedCode);
    setError(null);
    setFoundSection(null);
    setFoundUnit(null);
    setCodeType(null);

    // Extraire le préfixe pour validation
    const prefix = extractPrefixFromCode(formattedCode);

    // Valider le format du code d'unité (UNIT-XXXXXX)
    if (prefix === 'UNIT' && formattedCode.length >= 11 && isValidUnitCode(formattedCode)) {
      setIsValidating(true);
      try {
        const unit = await UnitService.getUnitByAccessCode(formattedCode);
        if (unit) {
          setFoundUnit({
            id: unit.id,
            name: unit.name,
          });
          setCodeType('unit');
        } else {
          setError('Code d\'unité invalide. Vérifie le code fourni par l\'admin WeCamp.');
        }
      } catch (err) {
        console.error('Erreur validation code unité:', err);
        setError('Erreur de validation. Réessaie.');
      } finally {
        setIsValidating(false);
      }
    }
    // Valider le format du code de section (PREFIXE-XXXXXX)
    else if (prefix && formattedCode.length >= 10 && isValidSectionCode(formattedCode)) {
      setIsValidating(true);
      try {
        const section = await SectionService.getSectionByAccessCode(formattedCode);
        if (section) {
          // Récupérer le nom de l'unité parente
          const unit = await UnitService.getUnitById(section.unitId);
          setFoundSection({
            id: section.id,
            name: section.name,
            sectionType: section.sectionType,
            unitId: section.unitId,
            unitName: unit?.name || 'Unité',
          });
          setCodeType('section');
        } else {
          setError('Code invalide. Vérifie le code fourni par l\'admin WeCamp.');
        }
      } catch (err) {
        console.error('Erreur validation code:', err);
        setError('Erreur de validation. Réessaie.');
      } finally {
        setIsValidating(false);
      }
    }
  };

  const showError = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message, [{ text: 'OK', style: 'default' }]);
    }
  };

  const handleContinue = async () => {
    // Vérifier qu'on a trouvé soit une section soit une unité
    if (!foundSection && !foundUnit) {
      showError('Erreur', 'Entre un code valide pour continuer.');
      return;
    }

    try {
      // Cas 1: Code d'unité (UNIT-XXXXXX) - rejoindre l'unité directement
      if (codeType === 'unit' && foundUnit) {
        console.log('🚀 Inscription animateur avec l\'unité:', foundUnit.name, 'ID:', foundUnit.id);

        // Créer le compte animateur avec l'unitId
        const newUser = await register(
          params.email as string,
          params.password as string,
          params.firstName as string,
          params.lastName as string,
          UserRole.ANIMATOR,
          foundUnit.id
        );

        console.log('✅ Compte créé avec ID:', newUser.id);

        // Rejoindre l'unité (le premier animateur devient chef d'unité)
        const result = await UnitService.joinUnitAsAnimator(
          newUser.id,
          accessCode
        );

        console.log('✅ Inscription réussie, isUnitLeader:', result.isLeader);

        // Rediriger vers le dashboard
        setTimeout(() => {
          router.replace('/(animator)/dashboard');
        }, 500);
      }
      // Cas 2: Code de section (LOUV-XXXXXX, etc.) - rejoindre une section
      else if (codeType === 'section' && foundSection) {
        console.log('🚀 Inscription animateur avec la section:', foundSection.name, 'ID:', foundSection.id);

        // Créer le compte animateur avec l'unitId (sectionId sera mis à jour après)
        const newUser = await register(
          params.email as string,
          params.password as string,
          params.firstName as string,
          params.lastName as string,
          UserRole.ANIMATOR,
          foundSection.unitId
        );

        console.log('✅ Compte créé avec ID:', newUser.id);

        // Rejoindre la section (le premier animateur devient chef de section)
        const result = await SectionService.joinSectionAsAnimator(
          newUser.id,
          accessCode
        );

        console.log('✅ Inscription réussie, isSectionLeader:', result.isLeader);

        // Si l'animateur est devenu chef de section, proposer de personnaliser le logo
        if (result.isLeader) {
          setTimeout(() => {
            router.replace({
              pathname: '/(auth)/section-logo-setup',
              params: {
                sectionId: result.section.id,
                sectionName: result.section.name,
                sectionType: result.section.sectionType,
              },
            });
          }, 500);
        } else {
          // Sinon, rediriger vers le dashboard
          setTimeout(() => {
            router.replace('/(animator)/dashboard');
          }, 500);
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur d\'inscription:', error);
      const errorMessage = error?.message || 'Impossible de créer ton compte';
      showError('Erreur', errorMessage);
    }
  };

  // Obtenir l'emoji et le label de la section trouvée
  const getSectionInfo = () => {
    if (!foundSection) return { emoji: '', label: '' };
    const sectionType = getSectionTypeFromPrefix(extractPrefixFromCode(accessCode) || '');
    if (!sectionType) return { emoji: '', label: '' };
    return {
      emoji: SECTION_EMOJIS[sectionType] || '',
      label: SECTION_LABELS[sectionType] || '',
    };
  };

  const sectionInfo = getSectionInfo();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="key" size={40} color={colors.primary} />
          </View>
          <ThemedText style={styles.title}>Rejoins ton unité</ThemedText>
          <ThemedText style={styles.subtitle}>
            Entre le code d'accès fourni par l'admin WeCamp
          </ThemedText>
        </View>

        {/* Code Input Card */}
        <View style={styles.codeCard}>
          <View style={styles.codeInputContainer}>
            <TextInput
              style={styles.codeInput}
              placeholder="UNIT-XXXXXX"
              placeholderTextColor={colors.neutralLight}
              value={accessCode}
              onChangeText={handleCodeChange}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
            />
            {isValidating && (
              <ActivityIndicator size="small" color={colors.primary} style={styles.validatingIndicator} />
            )}
          </View>

          {/* Status Message */}
          {error && (
            <View style={styles.statusContainer}>
              <Ionicons name="close-circle" size={20} color={colors.danger} />
              <ThemedText style={[styles.statusText, { color: colors.danger }]}>{error}</ThemedText>
            </View>
          )}

          {/* Unité trouvée */}
          {foundUnit && codeType === 'unit' && (
            <View style={styles.sectionFoundCard}>
              <View style={styles.sectionFoundHeader}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <ThemedText style={styles.sectionFoundTitle}>Unité trouvée !</ThemedText>
              </View>
              <View style={styles.sectionFoundDetails}>
                <View style={styles.sectionNameRow}>
                  <Ionicons name="people" size={24} color={colors.primary} />
                  <ThemedText style={styles.sectionFoundName}>{foundUnit.name}</ThemedText>
                </View>
                <ThemedText style={styles.sectionFoundType}>Tu rejoindras l'unité entière</ThemedText>
              </View>
            </View>
          )}

          {/* Section trouvée */}
          {foundSection && codeType === 'section' && (
            <View style={styles.sectionFoundCard}>
              <View style={styles.sectionFoundHeader}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <ThemedText style={styles.sectionFoundTitle}>Section trouvée !</ThemedText>
              </View>
              <View style={styles.sectionFoundDetails}>
                <View style={styles.sectionNameRow}>
                  <ThemedText style={styles.sectionEmoji}>{sectionInfo.emoji}</ThemedText>
                  <ThemedText style={styles.sectionFoundName}>{foundSection.name}</ThemedText>
                </View>
                <ThemedText style={styles.sectionFoundType}>{sectionInfo.label}</ThemedText>
                <View style={styles.unitInfoRow}>
                  <Ionicons name="location-outline" size={14} color={colors.neutral} />
                  <ThemedText style={styles.unitFoundName}>{foundSection.unitName}</ThemedText>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* How it works */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <ThemedText style={styles.infoTitle}>Comment ça marche ?</ThemedText>
          </View>
          <View style={styles.infoSteps}>
            <View style={styles.infoStep}>
              <View style={styles.infoStepNumber}>
                <ThemedText style={styles.infoStepNumberText}>1</ThemedText>
              </View>
              <ThemedText style={styles.infoStepText}>
                Demande le code d'accès à l'admin WeCamp
              </ThemedText>
            </View>
            <View style={styles.infoStep}>
              <View style={styles.infoStepNumber}>
                <ThemedText style={styles.infoStepNumberText}>2</ThemedText>
              </View>
              <ThemedText style={styles.infoStepText}>
                Entre le code (ex: UNIT-A1B2C3 ou LOUV-X7Y8Z9)
              </ThemedText>
            </View>
            <View style={styles.infoStep}>
              <View style={styles.infoStepNumber}>
                <ThemedText style={styles.infoStepNumberText}>3</ThemedText>
              </View>
              <ThemedText style={styles.infoStepText}>
                Tu rejoins automatiquement l'unité ou la section
              </ThemedText>
            </View>
          </View>
          <View style={styles.infoNote}>
            <Ionicons name="star" size={14} color={colors.accent} />
            <ThemedText style={styles.infoNoteText}>
              Le premier animateur à rejoindre devient automatiquement chef d'unité ou de section.
            </ThemedText>
          </View>
        </View>

        {/* Code Examples */}
        <View style={styles.codeExamplesCard}>
          <ThemedText style={styles.codeExamplesTitle}>Préfixes de codes</ThemedText>
          <View style={styles.codeExamplesGrid}>
            <View style={[styles.codeExample, { backgroundColor: `${colors.primary}15` }]}>
              <ThemedText style={[styles.codeExamplePrefix, { color: colors.primary }]}>UNIT-</ThemedText>
              <ThemedText style={styles.codeExampleLabel}>Unité</ThemedText>
            </View>
            <View style={styles.codeExample}>
              <ThemedText style={styles.codeExamplePrefix}>BAL-</ThemedText>
              <ThemedText style={styles.codeExampleLabel}>Baladins</ThemedText>
            </View>
            <View style={styles.codeExample}>
              <ThemedText style={styles.codeExamplePrefix}>LOUV-</ThemedText>
              <ThemedText style={styles.codeExampleLabel}>Louveteaux</ThemedText>
            </View>
            <View style={styles.codeExample}>
              <ThemedText style={styles.codeExamplePrefix}>ECL-</ThemedText>
              <ThemedText style={styles.codeExampleLabel}>Éclaireurs</ThemedText>
            </View>
            <View style={styles.codeExample}>
              <ThemedText style={styles.codeExamplePrefix}>PIO-</ThemedText>
              <ThemedText style={styles.codeExampleLabel}>Pionniers</ThemedText>
            </View>
          </View>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              ((!foundSection && !foundUnit) || authLoading) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={(!foundSection && !foundUnit) || authLoading}
            activeOpacity={0.8}
          >
            {authLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText
                style={[
                  styles.continueButtonText,
                  ((!foundSection && !foundUnit) || authLoading) && styles.continueButtonTextDisabled,
                ]}
              >
                {codeType === 'unit' ? 'Rejoindre l\'unité' : 'Rejoindre la section'}
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.backButtonText}>Retour</ThemedText>
          </TouchableOpacity>
        </View>
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
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
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
    paddingHorizontal: 20,
  },

  // Code Card
  codeCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.mist,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    backgroundColor: colors.mist,
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.dark,
    letterSpacing: 2,
    textAlign: 'center',
  },
  validatingIndicator: {
    position: 'absolute',
    right: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  statusText: {
    fontSize: 14,
    flex: 1,
  },

  // Section Found Card
  sectionFoundCard: {
    backgroundColor: `${colors.success}10`,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: `${colors.success}30`,
  },
  sectionFoundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionFoundTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  sectionFoundDetails: {
    marginLeft: 32,
  },
  sectionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionEmoji: {
    fontSize: 24,
  },
  sectionFoundName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
  },
  sectionFoundType: {
    fontSize: 13,
    color: colors.neutral,
    marginTop: 2,
    marginLeft: 32,
  },
  unitInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    marginLeft: 32,
  },
  unitFoundName: {
    fontSize: 13,
    color: colors.neutral,
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.mist,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
  },
  infoSteps: {
    gap: 12,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoStepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoStepText: {
    fontSize: 14,
    color: colors.neutral,
    flex: 1,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.mist,
  },
  infoNoteText: {
    fontSize: 13,
    color: colors.accent,
    flex: 1,
    fontStyle: 'italic',
  },

  // Code Examples Card
  codeExamplesCard: {
    backgroundColor: colors.accentLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  codeExamplesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  codeExamplesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  codeExample: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  codeExamplePrefix: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.primary,
  },
  codeExampleLabel: {
    fontSize: 11,
    color: colors.neutral,
  },

  // Spacer
  spacer: {
    flex: 1,
    minHeight: 20,
  },

  // Buttons
  buttonsContainer: {
    gap: 12,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: colors.mist,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  continueButtonTextDisabled: {
    color: colors.neutralLight,
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
});
