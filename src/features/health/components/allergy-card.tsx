import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Allergy, AllergySeverity } from '@/types';

interface AllergyCardProps {
  allergy: Allergy;
}

const severityConfig = {
  [AllergySeverity.LIGHT]: {
    label: 'Léger',
    backgroundColor: '#fef3c7',
    textColor: '#d97706',
    borderColor: '#fcd34d',
  },
  [AllergySeverity.MODERATE]: {
    label: 'Modéré',
    backgroundColor: '#fed7aa',
    textColor: '#ea580c',
    borderColor: '#fdba74',
  },
  [AllergySeverity.SEVERE]: {
    label: 'Sévère',
    backgroundColor: '#fecaca',
    textColor: '#dc2626',
    borderColor: '#fca5a5',
  },
};

export function AllergyCard({ allergy }: AllergyCardProps) {
  const cardColor = useThemeColor({}, 'card');
  const config = severityConfig[allergy.severity];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: cardColor, borderLeftColor: config.borderColor },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.emoji}>
            {allergy.severity === AllergySeverity.SEVERE ? '🚨' : 'ℹ️'}
          </ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.name}>
            {allergy.name}
          </ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
          <ThemedText style={[styles.badgeText, { color: config.textColor }]}>
            {config.label}
          </ThemedText>
        </View>
      </View>

      {allergy.description && (
        <ThemedText color="secondary" style={styles.description}>
          {allergy.description}
        </ThemedText>
      )}

      {allergy.requiresEpiPen && (
        <View style={styles.epiPenBadge}>
          <ThemedText style={styles.epiPenIcon}>💉</ThemedText>
          <ThemedText style={styles.epiPenText}>EpiPen requis</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  emoji: {
    fontSize: 18,
  },
  name: {
    fontSize: 17,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  epiPenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 6,
  },
  epiPenIcon: {
    fontSize: 14,
  },
  epiPenText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
});
