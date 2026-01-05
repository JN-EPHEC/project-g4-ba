import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Section, SECTION_EMOJIS, SECTION_COLORS, SECTION_LABELS } from '@/types';
import { SectionService } from '@/services/section-service';

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
};

export default function SectionSelectionScreen() {
  const params = useLocalSearchParams();
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const unitId = params.unitId as string;

  useEffect(() => {
    loadSections();
  }, [unitId]);

  const loadSections = async () => {
    try {
      setLoading(true);
      if (unitId) {
        const sectionsData = await SectionService.getSectionsByUnit(unitId);
        console.log('📋 Sections chargées:', sectionsData);
        setSections(sectionsData);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des sections:', error);
      Alert.alert('Erreur', 'Impossible de charger les sections disponibles');
    } finally {
      setLoading(false);
    }
  };

  const getSectionColor = (section: Section): string => {
    return SECTION_COLORS[section.sectionType] || colors.primary;
  };

  const getSectionEmoji = (section: Section): string => {
    return SECTION_EMOJIS[section.sectionType] || '🏕️';
  };

  const handleContinue = () => {
    if (!selectedSection) {
      Alert.alert('Choisis ta section', 'Sélectionne une section pour continuer ton inscription.');
      return;
    }

    // Rediriger vers la page de configuration du totem
    router.push({
      pathname: '/(auth)/totem-setup',
      params: {
        email: params.email as string,
        password: params.password as string,
        firstName: params.firstName as string,
        lastName: params.lastName as string,
        dateOfBirth: params.dateOfBirth as string,
        role: params.role as string,
        unitId: unitId,
        sectionId: selectedSection,
      },
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Chargement des sections...</ThemedText>
      </View>
    );
  }

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
            <ThemedText style={styles.iconEmoji}>🏕️</ThemedText>
          </View>
          <ThemedText style={styles.title}>Choisis ta section</ThemedText>
          <ThemedText style={styles.subtitle}>
            Dans quelle section es-tu inscrit ?
          </ThemedText>
        </View>

        {/* Sections List */}
        <View style={styles.sectionsContainer}>
          {sections.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.neutral} />
              <ThemedText style={styles.emptyText}>Aucune section disponible dans cette unité</ThemedText>
              <ThemedText style={styles.emptySubtext}>Contacte ton animateur pour créer une section</ThemedText>
            </View>
          ) : (
            sections.map((section) => {
              const isSelected = selectedSection === section.id;
              const sectionColor = getSectionColor(section);

              return (
                <Pressable
                  key={section.id}
                  onPress={() => setSelectedSection(section.id)}
                  style={[
                    styles.sectionCard,
                    isSelected && {
                      borderColor: sectionColor,
                      borderWidth: 2,
                      shadowColor: sectionColor,
                      shadowOpacity: 0.2,
                    },
                  ]}
                >
                  {/* Logo ou Emoji */}
                  <View style={[styles.sectionLogo, { backgroundColor: `${sectionColor}15` }]}>
                    {section.logoUrl ? (
                      <Image
                        source={{ uri: section.logoUrl }}
                        style={styles.sectionLogoImage}
                      />
                    ) : (
                      <ThemedText style={styles.sectionEmoji}>
                        {getSectionEmoji(section)}
                      </ThemedText>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.sectionInfo}>
                    <ThemedText style={styles.sectionName}>{section.name}</ThemedText>
                    <ThemedText style={[styles.sectionAge, { color: sectionColor }]}>
                      {section.ageRange.min} - {section.ageRange.max} ans
                    </ThemedText>
                  </View>

                  {/* Checkmark */}
                  <View
                    style={[
                      styles.checkmark,
                      isSelected
                        ? { backgroundColor: sectionColor, borderWidth: 0 }
                        : { borderColor: colors.mist, borderWidth: 2 },
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!selectedSection || sections.length === 0) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedSection || sections.length === 0}
            activeOpacity={0.8}
          >
            <ThemedText
              style={[
                styles.continueButtonText,
                (!selectedSection || sections.length === 0) && styles.continueButtonTextDisabled,
              ]}
            >
              Continuer
            </ThemedText>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.neutral,
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
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 40,
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
  },

  // Sections
  sectionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  emptyCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  emptyText: {
    fontSize: 15,
    color: colors.dark,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.neutral,
    textAlign: 'center',
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.mist,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionLogo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionEmoji: {
    fontSize: 28,
  },
  sectionLogoImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.dark,
  },
  sectionAge: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
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
