import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Unit, UserRole } from '@/types';
import { UnitService } from '@/services/unit-service';

export default function UnitSelectionScreen() {
  const params = useLocalSearchParams();
  const { register, isLoading: authLoading } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
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
      console.log('📋 Unités chargées:', allUnits);
      setUnits(allUnits);
    } catch (error: any) {
      console.error('Erreur lors du chargement des unités:', error);
      Alert.alert('Erreur', 'Impossible de charger les unités disponibles');
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
      case 'castors':
        return 'water';
      case 'louveteaux':
        return 'paw';
      case 'eclaireurs':
        return 'compass';
      case 'pionniers':
        return 'trail-sign';
      case 'compagnons':
        return 'people';
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
      case 'castors':
        return '#3b82f6';
      case 'louveteaux':
        return '#f59e0b';
      case 'eclaireurs':
        return '#10b981';
      case 'pionniers':
        return '#8b5cf6';
      case 'compagnons':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const handleContinue = async () => {
    if (!selectedUnit) {
      Alert.alert('Choisis ta fédération', 'Sélectionne une fédération pour continuer ton inscription.');
      return;
    }

    try {
      console.log('🚀 Inscription scout avec l\'unité:', selectedUnit);

      // Convertir la date de naissance
      const dateOfBirth = params.dateOfBirth ? new Date(params.dateOfBirth as string) : new Date();

      // Créer le compte scout
      const registeredUser = await register(
        params.email as string,
        params.password as string,
        params.firstName as string,
        params.lastName as string,
        UserRole.SCOUT,
        selectedUnit, // Passer l'unitId
        dateOfBirth // Passer la date de naissance
      );

      console.log('✅ Inscription réussie, redirection vers la page d\'attente');

      // Rediriger vers la page d'attente de validation
      router.push('/(auth)/pending-approval');
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
          <ThemedText style={styles.loadingText}>Chargement des unités...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#f9fafb' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Choisis ta fédération
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Sélectionne la fédération à laquelle tu appartiens
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
              const isSelected = selectedUnit === unit.id;
              const unitColor = getUnitColor(unit.category);

              return (
                <Pressable
                  key={unit.id}
                  onPress={() => {
                    console.log('🎯 Unité sélectionnée:', unit.name, 'Category:', unit.category);
                    setSelectedUnit(unit.id);
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

        <PrimaryButton
          title={authLoading ? 'Création du compte...' : 'Continuer'}
          onPress={handleContinue}
          disabled={!selectedUnit || authLoading}
          style={styles.confirmButton}
        />

        <View style={styles.footer}>
          <ThemedText
            type="link"
            onPress={() => router.push('/(auth)/register')}
            style={styles.backLink}
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
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
