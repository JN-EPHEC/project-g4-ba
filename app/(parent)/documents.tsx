import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';

export default function DocumentsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Documents
        </ThemedText>
        <Card style={styles.card}>
          <ThemedText>Page en construction...</ThemedText>
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
    paddingBottom: 100,
  },
  title: {
    marginBottom: 20,
  },
  card: {
    padding: 20,
  },
});
