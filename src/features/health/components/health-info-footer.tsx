import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface HealthInfoFooterProps {
  lastUpdatedAt: Date;
  signedByParentName?: string;
}

export function HealthInfoFooter({
  lastUpdatedAt,
  signedByParentName,
}: HealthInfoFooterProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: '#f3f4f6' }]}>
      <ThemedText type="defaultSemiBold" style={styles.title}>
        Informations complémentaires
      </ThemedText>

      <View style={styles.row}>
        <ThemedText style={[styles.label, { color: textSecondary }]}>
          Dernière mise à jour
        </ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.value}>
          {formatDate(lastUpdatedAt)}
        </ThemedText>
      </View>

      {signedByParentName && (
        <View style={styles.row}>
          <ThemedText style={[styles.label, { color: textSecondary }]}>
            Signé par
          </ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.value}>
            {signedByParentName}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 15,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
  },
});
