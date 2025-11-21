import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge, Card, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { UnitService } from '@/services/unit-service';
import { Unit, UnitCategory } from '@/types';

export default function UnitsScreen() {
  const { user } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      setIsLoading(true);
      const allUnits = await UnitService.getAllUnits();
      setUnits(allUnits);
    } catch (error) {
      console.error('Erreur lors du chargement des unités:', error);
      Alert.alert('Erreur', 'Impossible de charger les unités');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryLabel = (category: UnitCategory): string => {
    const labels: Record<UnitCategory, string> = {
      [UnitCategory.CASTORS]: 'Castors (6-8 ans)',
      [UnitCategory.LOUVETEAUX]: 'Louveteaux (8-12 ans)',
      [UnitCategory.ECLAIREURS]: 'Éclaireurs (12-16 ans)',
      [UnitCategory.PIONNIERS]: 'Pionniers (16-18 ans)',
      [UnitCategory.COMPAGNONS]: 'Compagnons (18+ ans)',
    };
    return labels[category] || category;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Unités
          </ThemedText>
          <PrimaryButton
            title="Créer une unité"
            onPress={() => router.push('/(animator)/units/create')}
            style={styles.createButton}
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : units.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ThemedText style={styles.emptyText}>
              Aucune unité créée pour le moment
            </ThemedText>
          </Card>
        ) : (
          units.map((unit) => (
            <Card key={unit.id} style={styles.unitCard}>
              <View style={styles.unitHeader}>
                <View style={styles.unitInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.unitName}>
                    {unit.name}
                  </ThemedText>
                  <Badge variant="info" size="small">
                    {getCategoryLabel(unit.category)}
                  </Badge>
                </View>
                {user?.id === unit.leaderId && (
                  <Badge variant="success" size="small">
                    Chef d'unité
                  </Badge>
                )}
              </View>
              {unit.description && (
                <ThemedText style={styles.unitDescription}>
                  {unit.description}
                </ThemedText>
              )}
              <View style={styles.unitActions}>
                <PrimaryButton
                  title="Voir détails"
                  onPress={() => router.push(`/(animator)/units/${unit.id}`)}
                  style={styles.detailButton}
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    flex: 1,
  },
  createButton: {
    marginLeft: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.7,
    textAlign: 'center',
  },
  unitCard: {
    padding: 16,
    marginBottom: 12,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  unitInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitName: {
    fontSize: 18,
  },
  unitDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
  },
  unitActions: {
    marginTop: 8,
  },
  detailButton: {
    minWidth: 120,
  },
});

