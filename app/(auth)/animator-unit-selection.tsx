import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View, ActivityIndicator } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Unit, UserRole } from '@/types';
import { UnitService } from '@/services/unit-service';
import { BrandColors } from '@/constants/theme';

// Codes d'accès par catégorie de fédération
const ACCESS_CODES: Record<string, string> = {
  'scouts': 'SCOUTS2025',
  'guides': 'GUIDES2025',
  'patro': 'PATRO2025',
  'sgp': 'SGP2025',
  'faucons': 'FAUCONS2025',
};

export default function AnimatorUnitSelectionScreen() {
  const params = useLocalSearchParams();
  const { register, isLoading: authLoading } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(true);
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

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

  const getUnitIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    switch (category) {
      case 'scouts':
        return 'shield';
      case 'guides':
        return 'flower';
      case 'patro':
        return 'sunny';
      case 'sgp':
        return 'people-circle';
      case 'faucons':
        return 'flame';
      default:
        return 'flag';
    }
  };

  const getUnitColor = (category: string): string => {
    switch (category) {
      case 'scouts':
        return '#1e40af'; // Bleu foncé - Les Scouts
      case 'guides':
        return '#db2777'; // Rose vif - Les Guides
      case 'patro':
        return '#059669'; // Vert émeraude - Le Patro
      case 'sgp':
        return '#7c3aed'; // Violet - SGP
      case 'faucons':
        return '#dc2626'; // Rouge vif - Faucons Rouges
      default:
        return '#6b7280';
    }
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

    // Vérifier que le code d'accès correspond à la catégorie de la fédération sélectionnée
    const categoryKey = String(selectedUnit.category).toLowerCase();
    console.log('🔍 Catégorie brute:', selectedUnit.category);
    console.log('🔍 Catégorie key:', categoryKey);
    console.log('🔍 Keys disponibles dans ACCESS_CODES:', Object.keys(ACCESS_CODES));
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
        `Le code d'accès est incorrect pour ${selectedUnit.name}. Le code attendu est: ${expectedCode}`,
        [{ text: 'Réessayer', style: 'default' }]
      );
      return;
    }

    console.log('✅ Code valide, création du compte...');

    try {
      console.log('🚀 Inscription animateur avec la fédération:', selectedUnit.name, 'ID:', selectedUnit.id);

      // Créer le compte animateur avec unitId
      const registeredUser = await register(
        params.email as string,
        params.password as string,
        params.firstName as string,
        params.lastName as string,
        UserRole.ANIMATOR,
        selectedUnit.id // Passer l'unitId (pas la catégorie)
      );

      console.log('✅ Inscription animateur réussie, redirection vers le dashboard');

      // Rediriger vers le dashboard animateur
      router.push('/(animator)/dashboard');
    } catch (error: any) {
      console.error('❌ Erreur d\'inscription:', error);
      const errorMessage = error?.message || 'Impossible de créer ton compte';
      Alert.alert('Erreur', errorMessage, [{ text: 'OK', style: 'default' }]);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#f9fafb' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Chargement des fédérations...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#f9fafb' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          {/* Icône nature */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, { backgroundColor: BrandColors.accent[500] }]}>
              <Ionicons name="star" size={32} color="#FFFFFF" />
            </View>
          </View>
          <ThemedText type="title" style={[styles.title, { color: BrandColors.primary[600] }]}>
            Choisis ta fédération
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Sélectionne la fédération que tu animes
          </ThemedText>
        </View>

        <View style={styles.unitsContainer}>
          {units.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="alert-circle-outline" size={48} color={iconColor} />
              <ThemedText style={styles.emptyText}>
                Aucune fédération disponible
              </ThemedText>
            </Card>
          ) : (
            units.map((unit) => {
              const isSelected = selectedUnit?.id === unit.id;
              const unitColor = getUnitColor(unit.category);

              return (
                <Pressable
                  key={unit.id}
                  onPress={() => {
                    console.log('🎯 Fédération sélectionnée:', unit.name, 'ID:', unit.id, 'Category:', unit.category);
                    setSelectedUnit(unit);
                  }}
                  style={({ pressed }) => [
                    styles.unitCard,
                    {
                      borderColor: isSelected ? unitColor : '#e5e7eb',
                      borderWidth: isSelected ? 3 : 1,
                      backgroundColor: isSelected ? unitColor + '10' : '#ffffff',
                      transform: [{ scale: isSelected ? 1.02 : 1 }],
                    },
                    pressed && styles.unitCardPressed,
                  ]}
                >
                  <View style={[styles.unitIconContainer, {
                    backgroundColor: unitColor + '25',
                    borderWidth: 2,
                    borderColor: unitColor + '40',
                  }]}>
                    <Ionicons name={getUnitIcon(unit.category)} size={36} color={unitColor} />
                  </View>

                  <View style={styles.unitContent}>
                    <ThemedText type="subtitle" style={styles.unitTitle}>
                      {unit.name}
                    </ThemedText>
                    {unit.description && (
                      <ThemedText style={styles.unitDescription}>{unit.description}</ThemedText>
                    )}
                  </View>

                  {isSelected && (
                    <View style={[styles.checkmark, { backgroundColor: unitColor }]}>
                      <Ionicons name="checkmark-circle" size={28} color="#ffffff" />
                    </View>
                  )}
                </Pressable>
              );
            })
          )}
        </View>

        {/* Champ code d'accès */}
        <Card style={styles.codeCard}>
          <View style={styles.codeHeader}>
            <Ionicons name="key" size={24} color={BrandColors.accent[500]} />
            <ThemedText type="subtitle" style={styles.codeTitle}>
              Code d'accès animateur
            </ThemedText>
          </View>
          <ThemedText style={styles.codeDescription}>
            Entre le code fourni par ta fédération pour confirmer que tu es animateur
          </ThemedText>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Code d'accès (ex: SCOUTS2025)"
              placeholderTextColor="#9ca3af"
              value={accessCode}
              onChangeText={setAccessCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
        </Card>

        <PrimaryButton
          title={authLoading ? 'Création du compte...' : 'Continuer'}
          onPress={handleContinue}
          disabled={!selectedUnit || !accessCode.trim() || authLoading}
          style={styles.confirmButton}
        />

        <View style={styles.footer}>
          <ThemedText
            type="link"
            onPress={() => router.back()}
            style={[styles.backLink, { color: BrandColors.accent[500] }]}
          >
            Retour
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  unitsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  unitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    gap: 16,
    marginVertical: 4,
  },
  unitCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  unitIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  unitContent: {
    flex: 1,
    gap: 4,
  },
  unitTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  unitDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  checkmark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCard: {
    padding: 20,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  codeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  codeDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  input: {
    padding: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  confirmButton: {
    marginBottom: 16,
  },
  footer: {
    alignItems: 'center',
  },
  backLink: {
    fontSize: 16,
  },
});
