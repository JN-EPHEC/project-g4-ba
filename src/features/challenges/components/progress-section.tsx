import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressSectionProps {
  completed: number;
  total: number;
}

export function ProgressSection({ completed, total }: ProgressSectionProps) {
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Votre progression</Text>

      <View style={styles.progressHeader}>
        <Text style={styles.label}>Challenges complétés</Text>
        <Text style={styles.count}>
          {completed} / {total}
        </Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    color: '#666666',
  },
  count: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F0E6D2',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 4,
  },
});
