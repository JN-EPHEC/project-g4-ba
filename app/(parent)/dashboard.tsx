import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, Avatar, Badge } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { Parent } from '@/types';

export default function ParentDashboardScreen() {
  const { user } = useAuth();
  const parent = user as Parent;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Bonjour {parent?.firstName} 👋
        </ThemedText>

        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText type="title" style={styles.statValue}>2</ThemedText>
              <ThemedText style={styles.statLabel}>Scouts</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="title" style={styles.statValue}>3</ThemedText>
              <ThemedText style={styles.statLabel}>Documents à signer</ThemedText>
            </View>
          </View>
        </Card>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Mes scouts
        </ThemedText>

        <Card style={styles.scoutCard}>
          <View style={styles.scoutHeader}>
            <Avatar name="Jean Dupont" size="medium" />
            <View style={styles.scoutInfo}>
              <ThemedText type="defaultSemiBold">Jean Dupont</ThemedText>
              <ThemedText style={styles.scoutDetail}>150 points</ThemedText>
            </View>
            <Badge variant="success">Actif</Badge>
          </View>
        </Card>

        <Card style={styles.scoutCard}>
          <View style={styles.scoutHeader}>
            <Avatar name="Marie Dupont" size="medium" />
            <View style={styles.scoutInfo}>
              <ThemedText type="defaultSemiBold">Marie Dupont</ThemedText>
              <ThemedText style={styles.scoutDetail}>200 points</ThemedText>
            </View>
            <Badge variant="success">Actif</Badge>
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
    gap: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  scoutCard: {
    padding: 16,
    marginBottom: 12,
  },
  scoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoutInfo: {
    flex: 1,
  },
  scoutDetail: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
});
