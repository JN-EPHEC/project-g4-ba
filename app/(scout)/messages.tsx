import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MessagesScreen } from '@/components/messages-screen';
import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types';
import type { Scout } from '@/types';

export default function ScoutMessagesScreen() {
  const { user, isLoading } = useAuth();
  const scout = user as Scout;

  if (isLoading || !user) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <ThemedText style={styles.loadingText}>Chargement...</ThemedText>
      </ThemedView>
    );
  }

  if (!scout.unitId) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={styles.emptyIcon}>📭</ThemedText>
        <ThemedText type="subtitle" style={styles.emptyTitle}>
          Aucune unité
        </ThemedText>
        <ThemedText style={styles.emptyText}>
          Vous n'êtes pas encore assigné à une unité.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <MessagesScreen
      user={user}
      unitId={scout.unitId}
      userRole={UserRole.SCOUT}
    />
  );
}

const styles = StyleSheet.create({
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
});
