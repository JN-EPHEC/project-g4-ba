import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MessagesScreen } from '@/components/messages-screen';
import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types';
import type { Parent, Scout } from '@/types';
import { ParentScoutService } from '@/services/parent-scout-service';
import { BrandColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';

export default function ParentMessagesScreen() {
  const { user, isLoading } = useAuth();
  const parent = user as Parent;

  const [scouts, setScouts] = useState<Scout[]>([]);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [isLoadingScouts, setIsLoadingScouts] = useState(true);

  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  useEffect(() => {
    loadScoutsAndUnit();
  }, [parent?.id]);

  const loadScoutsAndUnit = async () => {
    if (!parent?.id) {
      setIsLoadingScouts(false);
      return;
    }

    try {
      // Charger les scouts liés au parent
      const linkedScouts = await ParentScoutService.getScoutsByParent(parent.id);
      setScouts(linkedScouts);

      // Prendre l'unitId du premier scout qui en a un
      const scoutWithUnit = linkedScouts.find((s) => s.unitId);
      if (scoutWithUnit) {
        setUnitId(scoutWithUnit.unitId);
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
        <ActivityIndicator size="large" color={BrandColors.primary[500]} />
        <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
          Chargement...
        </ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
          Non connecté
        </ThemedText>
      </ThemedView>
    );
  }

  if (scouts.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color={textSecondary} />
        <ThemedText type="subtitle" style={[styles.emptyTitle, { color: textColor }]}>
          Aucun scout lié
        </ThemedText>
        <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
          Liez d'abord un scout à votre compte pour accéder aux messages.
        </ThemedText>
      </ThemedView>
    );
  }

  if (!unitId) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={BrandColors.accent[500]} />
        <ThemedText type="subtitle" style={[styles.emptyTitle, { color: textColor }]}>
          Aucune unité
        </ThemedText>
        <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
          Vos enfants ne sont pas encore assignés à une unité scoute.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <MessagesScreen
      user={user}
      unitId={unitId}
      userRole={UserRole.PARENT}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
});
