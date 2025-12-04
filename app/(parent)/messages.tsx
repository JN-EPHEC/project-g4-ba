import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { MessagesScreen } from '@/components/messages-screen';
import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types';
import type { Parent, Scout, Unit } from '@/types';
import { UserService } from '@/services/user-service';
import { UnitService } from '@/services/unit-service';

export default function ParentMessagesScreen() {
  const { user, isLoading } = useAuth();
  const parent = user as Parent;

  const [scouts, setScouts] = useState<Scout[]>([]);
  const [units, setUnits] = useState<Record<string, Unit>>({});
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [isLoadingScouts, setIsLoadingScouts] = useState(true);

  useEffect(() => {
    loadScoutsAndUnits();
  }, [parent?.scoutIds]);

  const loadScoutsAndUnits = async () => {
    if (!parent?.scoutIds || parent.scoutIds.length === 0) {
      setIsLoadingScouts(false);
      return;
    }

    try {
      // Charger les scouts du parent
      const scoutPromises = parent.scoutIds.map((id) => UserService.getUserById(id));
      const scoutResults = await Promise.all(scoutPromises);
      const validScouts = scoutResults.filter((s): s is Scout => s !== null && s.role === UserRole.SCOUT);
      setScouts(validScouts);

      // Charger les unités uniques
      const unitIds = [...new Set(validScouts.map((s) => s.unitId).filter(Boolean))];
      const unitsMap: Record<string, Unit> = {};

      await Promise.all(
        unitIds.map(async (unitId) => {
          try {
            const unit = await UnitService.getUnitById(unitId);
            if (unit) {
              unitsMap[unitId] = unit;
            }
          } catch (error) {
            console.error('Erreur chargement unité:', error);
          }
        })
      );

      setUnits(unitsMap);

      // Sélectionner la première unité par défaut
      if (unitIds.length > 0 && !selectedUnitId) {
        setSelectedUnitId(unitIds[0]);
      }
    } catch (error) {
      console.error('Erreur chargement scouts:', error);
    } finally {
      setIsLoadingScouts(false);
    }
  };

  if (isLoading || isLoadingScouts) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <ThemedText style={styles.loadingText}>Chargement...</ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={styles.loadingText}>Non connecté</ThemedText>
      </ThemedView>
    );
  }

  if (scouts.length === 0 || Object.keys(units).length === 0) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={styles.emptyIcon}>📭</ThemedText>
        <ThemedText type="subtitle" style={styles.emptyTitle}>
          Aucune unité
        </ThemedText>
        <ThemedText style={styles.emptyText}>
          Vos enfants ne sont pas encore assignés à une unité.
        </ThemedText>
      </ThemedView>
    );
  }

  // Si plusieurs unités, afficher un sélecteur
  const unitIds = Object.keys(units);

  if (unitIds.length > 1 && !selectedUnitId) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="title" style={styles.title}>
            Messages
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Sélectionnez une unité
          </ThemedText>

          {unitIds.map((unitId) => {
            const unit = units[unitId];
            const unitScouts = scouts.filter((s) => s.unitId === unitId);

            return (
              <TouchableOpacity key={unitId} onPress={() => setSelectedUnitId(unitId)}>
                <Card style={styles.unitCard}>
                  <ThemedText type="subtitle" style={styles.unitName}>
                    {unit.name}
                  </ThemedText>
                  <ThemedText style={styles.unitScouts}>
                    {unitScouts.map((s) => s.firstName).join(', ')}
                  </ThemedText>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ThemedView>
    );
  }

  const finalUnitId = selectedUnitId || unitIds[0];

  return (
    <View style={styles.flex}>
      {unitIds.length > 1 && (
        <View style={styles.unitSelector}>
          <TouchableOpacity onPress={() => setSelectedUnitId(null)}>
            <ThemedText style={styles.changeUnit}>
              ← Changer d'unité ({units[finalUnitId]?.name})
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
      <MessagesScreen
        user={user}
        unitId={finalUnitId}
        userRole={UserRole.PARENT}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    gap: 12,
  },
  loadingText: {
    color: '#999999',
  },
  title: {
    marginBottom: 8,
    color: '#FFFFFF',
  },
  subtitle: {
    color: '#999999',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#FFFFFF',
  },
  emptyText: {
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  unitCard: {
    backgroundColor: '#2A2A2A',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  unitName: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  unitScouts: {
    color: '#999999',
    fontSize: 13,
  },
  unitSelector: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  changeUnit: {
    color: '#3b82f6',
    fontSize: 14,
  },
});
