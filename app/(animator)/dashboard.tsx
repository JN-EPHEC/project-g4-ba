import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, Badge } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { Animator } from '@/types';

export default function AnimatorDashboardScreen() {
  const { user } = useAuth();
  const animator = user as Animator;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Bonjour {animator?.firstName} 👋
        </ThemedText>

        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText type="title" style={styles.statValue}>24</ThemedText>
              <ThemedText style={styles.statLabel}>Scouts</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="title" style={styles.statValue}>5</ThemedText>
              <ThemedText style={styles.statLabel}>Événements</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="title" style={styles.statValue}>8</ThemedText>
              <ThemedText style={styles.statLabel}>Défis actifs</ThemedText>
            </View>
          </View>
        </Card>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Actions rapides
        </ThemedText>

        <Card style={styles.actionCard}>
          <Ionicons name="add-circle" size={24} color="#3b82f6" />
          <View style={styles.actionContent}>
            <ThemedText type="defaultSemiBold">Créer un événement</ThemedText>
            <ThemedText style={styles.actionDescription}>
              Planifier une nouvelle activité
            </ThemedText>
          </View>
        </Card>

        <Card style={styles.actionCard}>
          <Ionicons name="flash" size={24} color="#f59e0b" />
          <View style={styles.actionContent}>
            <ThemedText type="defaultSemiBold">Créer un défi</ThemedText>
            <ThemedText style={styles.actionDescription}>
              Lancer un nouveau défi pour les scouts
            </ThemedText>
          </View>
        </Card>

        <Card style={styles.actionCard}>
          <Ionicons name="document-text" size={24} color="#8b5cf6" />
          <View style={styles.actionContent}>
            <ThemedText type="defaultSemiBold">Partager un document</ThemedText>
            <ThemedText style={styles.actionDescription}>
              Ajouter un document à signer
            </ThemedText>
          </View>
        </Card>
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
  title: {
    marginBottom: 20,
  },
  statsCard: {
    padding: 20,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.7,
    textAlign: 'center',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  actionCard: {
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionDescription: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
});
