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
  TextInput,
  TouchableOpacity,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Unit } from '@/types';
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
  scouts: '#004B87',
  guides: '#00A86B',
};

export default function UnitSelectionScreen() {
  const params = useLocalSearchParams();
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [animatorCode, setAnimatorCode] = useState('');

  // Vérifier si c'est un animateur (pour afficher le code d'accès)
  const isAnimator = params.role === 'animator';

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      setLoading(true);
      const allUnits = await UnitService.getAllUnits();
      console.log('📋 Unités chargées:', allUnits);
      setUnits(allUnits);
    } catch (error: any) {
      console.error('Erreur lors du chargement des unités:', error);
      Alert.alert('Erreur', 'Impossible de charger les unités disponibles');
    } finally {
      setLoading(false);
    }
  };

  const getUnitColor = (unit: Unit): string => {
    // Utiliser la catégorie définie ou la déduire du nom
    let category = unit.category?.toLowerCase() || '';
    if (!category) {
      const nameLower = unit.name.toLowerCase();
      if (nameLower.includes('scout')) category = 'scouts';
      else if (nameLower.includes('guide')) category = 'guides';
      else if (nameLower.includes('patro')) category = 'patro';
      else if (nameLower.includes('sgp')) category = 'sgp';
      else if (nameLower.includes('faucon')) category = 'faucons';
    }

    switch (category) {
      case 'scouts':
        return colors.scouts;
      case 'guides':
        return colors.guides;
      case 'patro':
        return '#059669';
      case 'sgp':
        return '#7c3aed';
      case 'faucons':
        return '#dc2626';
      default:
        return colors.neutral;
    }
  };

  const getUnitInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  const handleContinue = async () => {
    if (!selectedUnit) {
      Alert.alert('Choisis ta fédération', 'Sélectionne une fédération pour continuer ton inscription.');
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
        unitId: selectedUnit,
        animatorCode: animatorCode || undefined,
      },
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Chargement des fédérations...</ThemedText>
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
          <ThemedText style={styles.title}>Choisis ta fédération</ThemedText>
          <ThemedText style={styles.subtitle}>
            Pour personnaliser ton expérience WeCamp
          </ThemedText>
        </View>

        {/* Federations List */}
        <View style={styles.federationsContainer}>
          {units.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.neutral} />
              <ThemedText style={styles.emptyText}>Aucune fédération disponible</ThemedText>
            </View>
          ) : (
            units.map((unit) => {
              const isSelected = selectedUnit === unit.id;
              const unitColor = getUnitColor(unit);

              return (
                <Pressable
                  key={unit.id}
                  onPress={() => setSelectedUnit(unit.id)}
                  style={[
                    styles.federationCard,
                    isSelected && {
                      borderColor: unitColor,
                      borderWidth: 2,
                      shadowColor: unitColor,
                      shadowOpacity: 0.2,
                    },
                  ]}
                >
                  {/* Logo/Initial */}
                  <View style={[styles.federationLogo, { backgroundColor: `${unitColor}15` }]}>
                    <ThemedText style={[styles.federationInitial, { color: unitColor }]}>
                      {getUnitInitial(unit.name)}
                    </ThemedText>
                  </View>

                  {/* Info */}
                  <View style={styles.federationInfo}>
                    <ThemedText style={styles.federationName}>{unit.name}</ThemedText>
                    {unit.description && (
                      <ThemedText style={styles.federationDescription}>
                        {unit.description}
                      </ThemedText>
                    )}
                  </View>

                  {/* Checkmark */}
                  <View
                    style={[
                      styles.checkmark,
                      isSelected
                        ? { backgroundColor: unitColor, borderWidth: 0 }
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

        {/* Code Animateur Section - Seulement pour les animateurs */}
        {selectedUnit && isAnimator && (
          <View style={styles.codeSection}>
            <View style={styles.codeSectionHeader}>
              <ThemedText style={styles.codeIcon}>🔑</ThemedText>
              <ThemedText style={styles.codeSectionTitle}>Code d'accès animateur</ThemedText>
            </View>

            <ThemedText style={styles.codeSectionDescription}>
              Entre le code fourni par ta fédération pour confirmer que tu es animateur.
            </ThemedText>

            <TextInput
              style={styles.codeInput}
              placeholder="Ex: GUIDES2025"
              placeholderTextColor="#6B7280"
              value={animatorCode}
              onChangeText={(text) => setAnimatorCode(text.toUpperCase())}
              autoCapitalize="characters"
            />

            <View style={styles.codeHint}>
              <Ionicons name="information-circle-outline" size={14} color={colors.neutralLight} />
              <ThemedText style={styles.codeHintText}>
                Pas de code ? Continue en tant que scout ou parent.
              </ThemedText>
            </View>
          </View>
        )}

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedUnit && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedUnit}
            activeOpacity={0.8}
          >
            <ThemedText
              style={[
                styles.continueButtonText,
                !selectedUnit && styles.continueButtonTextDisabled,
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

  // Federations
  federationsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  emptyCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  emptyText: {
    fontSize: 15,
    color: colors.neutral,
    textAlign: 'center',
  },
  federationCard: {
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
  federationLogo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  federationInitial: {
    fontSize: 24,
    fontWeight: '700',
  },
  federationInfo: {
    flex: 1,
  },
  federationName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.dark,
  },
  federationDescription: {
    fontSize: 13,
    color: colors.neutral,
    marginTop: 2,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  // Code Section
  codeSection: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.mist,
    marginBottom: 24,
  },
  codeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  codeIcon: {
    fontSize: 20,
  },
  codeSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark,
  },
  codeSectionDescription: {
    fontSize: 13,
    color: colors.neutral,
    lineHeight: 18,
    marginBottom: 12,
  },
  codeInput: {
    backgroundColor: colors.mist,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    letterSpacing: 1,
  },
  codeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  codeHintText: {
    fontSize: 12,
    color: colors.neutralLight,
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
