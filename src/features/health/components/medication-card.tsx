import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Medication } from '@/types';

interface MedicationCardProps {
  medication: Medication;
}

export function MedicationCard({ medication }: MedicationCardProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: cardColor, borderColor: cardBorderColor },
      ]}
    >
      <View style={styles.iconContainer}>
        {medication.isVital ? (
          <View style={styles.vitalIcon}>
            <ThemedText style={styles.vitalEmoji}>⚠️</ThemedText>
          </View>
        ) : (
          <View style={styles.pillIcon}>
            <ThemedText style={styles.pillEmoji}>💊</ThemedText>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="defaultSemiBold" style={styles.name}>
            {medication.name}
          </ThemedText>
          {medication.isVital && (
            <View style={styles.vitalBadge}>
              <ThemedText style={styles.vitalBadgeText}>VITAL</ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={[styles.dosage, { color: '#dc2626' }]}>
          {medication.dosage}
        </ThemedText>
        <ThemedText style={[styles.frequency, { color: textSecondary }]}>
          {medication.frequency}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    marginRight: 14,
  },
  pillIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillEmoji: {
    fontSize: 24,
  },
  vitalIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalEmoji: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 17,
    flex: 1,
  },
  vitalBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vitalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
    letterSpacing: 0.5,
  },
  dosage: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  frequency: {
    fontSize: 14,
  },
});
