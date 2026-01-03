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
import { useAuth } from '@/context/auth-context';
import { Unit, UserRole } from '@/types';
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

// Codes d'accès par catégorie de fédération
const ACCESS_CODES: Record<string, string> = {
  'scouts': 'SCOUTS2025',
  'guides': 'GUIDES2025',
  'patro': 'PATRO2025',
  'sgp': 'SGP2025',
  'faucons': 'FAUCONS2025',
};

type UnitMode = 'choice' | 'join';

export default function AnimatorUnitSelectionScreen() {
  const params = useLocalSearchParams();
  const { register, isLoading: authLoading } = useAuth();
  const [mode, setMode] = useState<UnitMode>('choice');
  const [selectedChoice, setSelectedChoice] = useState<'join' | 'create' | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessCode, setAccessCode] = useState('');

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      setLoading(true);
      const allUnits = await UnitService.getAllUnits();
      console.log('📋 Unités chargées pour animateur:', allUnits);
      setUnits(allUnits);
    } catch (error: any) {
      console.error('Erreur lors du chargement des unités:', error);
      Alert.alert('Erreur', 'Impossible de charger les fédérations disponibles');
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

  const getSelectedUnit = (): Unit | undefined => {
    return units.find(u => u.id === selectedUnit);
  };

  // Déduire la catégorie à partir du nom si elle n'est pas définie
  const getCategoryFromUnit = (unit: Unit): string => {
    if (unit.category) {
      return String(unit.category).toLowerCase();
    }
    // Déduire la catégorie à partir du nom
    const nameLower = unit.name.toLowerCase();
    if (nameLower.includes('scout')) return 'scouts';
    if (nameLower.includes('guide')) return 'guides';
    if (nameLower.includes('patro')) return 'patro';
    if (nameLower.includes('sgp')) return 'sgp';
    if (nameLower.includes('faucon')) return 'faucons';
    return '';
  };

  const handleContinue = async () => {
    console.log('🔍 handleContinue appelé');
    console.log('🔍 selectedUnit:', selectedUnit);
    console.log('🔍 accessCode:', accessCode);

    if (!selectedUnit) {
      console.log('❌ Pas de fédération sélectionnée');
      Alert.alert('Choisis ta fédération', 'Sélectionne une fédération pour continuer ton inscription.');
      return;
    }

    if (!accessCode.trim()) {
      console.log('❌ Pas de code d\'accès');
      Alert.alert('Code d\'accès requis', 'Entre le code d\'accès de ta fédération pour confirmer que tu es animateur.');
      return;
    }

    const unit = getSelectedUnit();
    if (!unit) {
      Alert.alert('Erreur', 'Fédération non trouvée');
      return;
    }

    // Vérifier que le code d'accès correspond à la catégorie de la fédération sélectionnée
    const categoryKey = getCategoryFromUnit(unit);
    console.log('🔍 Catégorie brute:', unit.category);
    console.log('🔍 Catégorie déduite:', categoryKey);
    const expectedCode = ACCESS_CODES[categoryKey];
    console.log('🔍 Code attendu:', expectedCode);
    console.log('🔍 Code entré (uppercase):', accessCode.trim().toUpperCase());

    if (!expectedCode) {
      console.log('❌ Code non configuré pour cette fédération');
      Alert.alert('Erreur', 'Code d\'accès non configuré pour cette fédération.');
      return;
    }

    if (accessCode.trim().toUpperCase() !== expectedCode) {
      console.log('❌ Code invalide');
      Alert.alert(
        'Code invalide',
        `Le code d'accès est incorrect pour ${unit.name}. Le code attendu est: ${expectedCode}`,
        [{ text: 'Réessayer', style: 'default' }]
      );
      return;
    }

    console.log('✅ Code valide, création du compte...');

    try {
      console.log('🚀 Inscription animateur avec la fédération:', unit.name, 'ID:', unit.id);

      // Créer le compte animateur avec unitId
      const registeredUser = await register(
        params.email as string,
        params.password as string,
        params.firstName as string,
        params.lastName as string,
        UserRole.ANIMATOR,
        unit.id
      );
      console.log('✅ Inscription animateur réussie');

      // Rediriger vers le dashboard
      setTimeout(() => {
        router.replace('/(animator)/dashboard');
      }, 500);
    } catch (error: any) {
      console.error('❌ Erreur d\'inscription:', error);
      const errorMessage = error?.message || 'Impossible de créer ton compte';
      Alert.alert('Erreur', errorMessage, [{ text: 'OK', style: 'default' }]);
    }
  };

  const handleChoiceContinue = () => {
    if (selectedChoice === 'join') {
      setMode('join');
    } else if (selectedChoice === 'create') {
      // Naviguer vers l'écran de création d'unité
      router.push({
        pathname: '/(auth)/create-unit',
        params: {
          email: params.email as string,
          password: params.password as string,
          firstName: params.firstName as string,
          lastName: params.lastName as string,
          dateOfBirth: params.dateOfBirth as string,
          role: params.role as string,
        },
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Chargement des fédérations...</ThemedText>
      </View>
    );
  }

  // Écran de choix initial
  if (mode === 'choice') {
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
              <ThemedText style={styles.iconEmoji}>⭐</ThemedText>
            </View>
            <ThemedText style={styles.title}>Rejoindre une unité</ThemedText>
            <ThemedText style={styles.subtitle}>
              Mon unité existe-t-elle déjà sur l'application ?
            </ThemedText>
          </View>

          {/* Choice Cards */}
          <View style={styles.choiceContainer}>
            <Pressable
              onPress={() => setSelectedChoice('join')}
              style={[
                styles.choiceCard,
                selectedChoice === 'join' && styles.choiceCardSelected,
              ]}
            >
              <View style={[styles.choiceIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="search" size={28} color={colors.primary} />
              </View>
              <View style={styles.choiceContent}>
                <ThemedText style={styles.choiceTitle}>Mon unité existe déjà</ThemedText>
                <ThemedText style={styles.choiceDescription}>
                  Je veux rejoindre une unité existante sur l'application
                </ThemedText>
              </View>
              <View
                style={[
                  styles.checkmark,
                  selectedChoice === 'join'
                    ? { backgroundColor: colors.primary, borderWidth: 0 }
                    : { borderColor: colors.mist, borderWidth: 2 },
                ]}
              >
                {selectedChoice === 'join' && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
            </Pressable>

            <Pressable
              onPress={() => setSelectedChoice('create')}
              style={[
                styles.choiceCard,
                selectedChoice === 'create' && styles.choiceCardSelected,
              ]}
            >
              <View style={[styles.choiceIcon, { backgroundColor: `${colors.accent}15` }]}>
                <Ionicons name="add-circle" size={28} color={colors.accent} />
              </View>
              <View style={styles.choiceContent}>
                <ThemedText style={styles.choiceTitle}>Mon unité n'existe pas encore</ThemedText>
                <ThemedText style={styles.choiceDescription}>
                  Je veux créer ma propre unité sur l'application
                </ThemedText>
              </View>
              <View
                style={[
                  styles.checkmark,
                  selectedChoice === 'create'
                    ? { backgroundColor: colors.accent, borderWidth: 0 }
                    : { borderColor: colors.mist, borderWidth: 2 },
                ]}
              >
                {selectedChoice === 'create' && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
            </Pressable>
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                !selectedChoice && styles.continueButtonDisabled,
              ]}
              onPress={handleChoiceContinue}
              disabled={!selectedChoice}
              activeOpacity={0.8}
            >
              <ThemedText
                style={[
                  styles.continueButtonText,
                  !selectedChoice && styles.continueButtonTextDisabled,
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

  // Écran de sélection d'unité (mode === 'join')
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
            <ThemedText style={styles.iconEmoji}>🏕</ThemedText>
          </View>
          <ThemedText style={styles.title}>Choisis ton unité</ThemedText>
          <ThemedText style={styles.subtitle}>
            Sélectionne l'unité que tu animes
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
                  onPress={() => {
                    console.log('🎯 Fédération sélectionnée:', unit.name, 'ID:', unit.id);
                    setSelectedUnit(unit.id);
                  }}
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

        {/* Code Animateur Section - Toujours visible pour animateurs */}
        {selectedUnit && (
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
              value={accessCode}
              onChangeText={(text) => setAccessCode(text.toUpperCase())}
              autoCapitalize="characters"
            />
          </View>
        )}

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!selectedUnit || !accessCode.trim() || authLoading) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedUnit || !accessCode.trim() || authLoading}
            activeOpacity={0.8}
          >
            <ThemedText
              style={[
                styles.continueButtonText,
                (!selectedUnit || !accessCode.trim() || authLoading) && styles.continueButtonTextDisabled,
              ]}
            >
              {authLoading ? 'Création du compte...' : 'Continuer'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setMode('choice');
              setSelectedUnit(null);
              setAccessCode('');
            }}
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

  // Choice Cards
  choiceContainer: {
    gap: 16,
    marginBottom: 24,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 2,
    borderColor: colors.mist,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  choiceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  choiceIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceContent: {
    flex: 1,
  },
  choiceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 4,
  },
  choiceDescription: {
    fontSize: 13,
    color: colors.neutral,
    lineHeight: 18,
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
