import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { UnitService } from '@/services/unit-service';
import { Animator, Scout } from '@/types';
import { db } from '@/config/firebase';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ValidateScoutsScreen() {
  const { user } = useAuth();
  const animator = user as Animator;
  const [pendingScouts, setPendingScouts] = useState<Scout[]>([]);
  const [validatedScouts, setValidatedScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(true);
  const iconColor = useThemeColor({}, 'icon');

  useEffect(() => {
    loadScouts();
  }, [animator?.unitId]);

  const loadScouts = async () => {
    try {
      setLoading(true);

      if (animator?.unitId) {
        const allScouts = await UnitService.getScoutsByUnit(animator.unitId);

        // Séparer les scouts validés et non validés
        const pending = allScouts.filter((s: Scout) => !s.validated);
        const validated = allScouts.filter((s: Scout) => s.validated);

        setPendingScouts(pending);
        setValidatedScouts(validated);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des scouts:', error);
      Alert.alert('Erreur', 'Impossible de charger les scouts');
    } finally {
      setLoading(false);
    }
  };

  const validateScout = async (scoutId: string) => {
    try {
      // Mettre à jour le scout dans Firestore
      const scoutRef = doc(db, 'users', scoutId);
      await updateDoc(scoutRef, {
        validated: true,
        validatedAt: Timestamp.now(),
        validatedBy: animator.id,
        updatedAt: Timestamp.now(),
      });

      Alert.alert('✅ Validé', 'Le scout a été validé avec succès');

      // Recharger les scouts
      await loadScouts();
    } catch (error: any) {
      console.error('Erreur lors de la validation du scout:', error);
      Alert.alert('Erreur', 'Impossible de valider le scout');
    }
  };

  const rejectScout = async (scoutId: string) => {
    Alert.alert(
      'Rejeter ce scout ?',
      'Cette action supprimera définitivement le compte du scout.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implémenter la suppression du compte
              // Pour l'instant, on ne fait rien
              Alert.alert('Information', 'Fonctionnalité en cours de développement');
            } catch (error: any) {
              console.error('Erreur lors du rejet du scout:', error);
              Alert.alert('Erreur', 'Impossible de rejeter le scout');
            }
          },
        },
      ]
    );
  };

  const renderScoutCard = (scout: Scout, isPending: boolean) => (
    <Card key={scout.id} style={styles.scoutCard}>
      <View style={styles.scoutHeader}>
        <View style={styles.scoutAvatar}>
          <ThemedText style={styles.avatarText}>
            {scout.firstName.charAt(0)}
            {scout.lastName.charAt(0)}
          </ThemedText>
        </View>
        <View style={styles.scoutInfo}>
          <ThemedText type="defaultSemiBold">
            {scout.firstName} {scout.lastName}
          </ThemedText>
          <ThemedText style={styles.scoutEmail}>{scout.email}</ThemedText>
          {!isPending && scout.validatedAt && (
            <ThemedText style={styles.validatedDate}>
              Validé le {new Date(scout.validatedAt).toLocaleDateString()}
            </ThemedText>
          )}
        </View>
      </View>

      {isPending && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.validateButton]}
            onPress={() => validateScout(scout.id)}
          >
            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            <ThemedText style={styles.buttonText}>Valider</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => rejectScout(scout.id)}
          >
            <Ionicons name="close-circle" size={20} color="#ffffff" />
            <ThemedText style={styles.buttonText}>Rejeter</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Chargement...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Validation des scouts
        </ThemedText>

        {/* Scouts en attente */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={24} color={iconColor} />
            <ThemedText type="subtitle">
              En attente ({pendingScouts.length})
            </ThemedText>
          </View>

          {pendingScouts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#10b981" />
              <ThemedText style={styles.emptyText}>
                Aucun scout en attente de validation
              </ThemedText>
            </Card>
          ) : (
            <View style={styles.scoutsList}>
              {pendingScouts.map((scout) => renderScoutCard(scout, true))}
            </View>
          )}
        </View>

        {/* Scouts validés */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-done-circle-outline" size={24} color={iconColor} />
            <ThemedText type="subtitle">
              Validés ({validatedScouts.length})
            </ThemedText>
          </View>

          {validatedScouts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="people-outline" size={48} color={iconColor} />
              <ThemedText style={styles.emptyText}>
                Aucun scout validé pour le moment
              </ThemedText>
            </Card>
          ) : (
            <View style={styles.scoutsList}>
              {validatedScouts.map((scout) => renderScoutCard(scout, false))}
            </View>
          )}
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    opacity: 0.7,
  },
  title: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  scoutsList: {
    gap: 12,
  },
  scoutCard: {
    padding: 16,
  },
  scoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  scoutAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  scoutInfo: {
    flex: 1,
  },
  scoutEmail: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
  validatedDate: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
    color: '#10b981',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
  },
  validateButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 14,
  },
});
