import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';

export default function MessagesScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Messages
        </ThemedText>

        <Card style={styles.comingSoonCard}>
          <View style={styles.comingSoonContent}>
            <ThemedText style={styles.comingSoonIcon}>💬</ThemedText>
            <ThemedText type="subtitle" style={styles.comingSoonTitle}>
              Fonctionnalité à venir
            </ThemedText>
            <ThemedText style={styles.comingSoonText}>
              La messagerie sera bientôt disponible pour communiquer avec votre unité.
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
  comingSoonCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonContent: {
    alignItems: 'center',
    gap: 12,
  },
  comingSoonIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  comingSoonTitle: {
    marginBottom: 8,
  },
  comingSoonText: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 14,
  },
});
